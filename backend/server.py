from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, date
import httpx
from bson import ObjectId
import math


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB connection
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ---------------------------------
# Status / Health Models & Routes
# ---------------------------------
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class StatusCheckCreate(BaseModel):
    client_name: str


@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


@api_router.get("/health")
async def health_check():
    # Basic check that Mongo is reachable
    try:
        await db.command("ping")
    except Exception as exc:  # pragma: no cover - simple health check
        raise HTTPException(status_code=503, detail=f"Database unreachable: {exc}")
    return {"status": "ok"}


# -------------------------
# Track & Trip Models & Routes
# -------------------------
class TrackPoint(BaseModel):
    timestamp: datetime
    lat: float
    lon: float
    speed_kn: Optional[float] = None
    course_deg: Optional[float] = None


class TrackCreate(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    start_time: Optional[datetime] = None


class Track(BaseModel):
    id: str
    name: Optional[str] = None
    notes: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None


class TrackPointBatch(BaseModel):
    points: List[TrackPoint]


class Trip(BaseModel):
    id: str
    track_id: str
    name: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    distance_nm: float
    avg_speed_kn: float
    max_speed_kn: float


def haversine_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two points in nautical miles."""
    r_km = 6371.0
    km_per_nm = 1.852
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    d_km = r_km * c
    return d_km / km_per_nm


async def compute_and_store_trip(track_doc: dict):
    """Compute trip stats from track points and upsert into trips collection."""
    track_id = track_doc["_id"]
    # Load points in time order
    points = await db.track_points.find({"track_id": track_id}).sort("timestamp", 1).to_list(10000)
    if not points:
        distance_nm = 0.0
        avg_speed_kn = 0.0
        max_speed_kn = 0.0
    else:
        distance_nm = 0.0
        max_speed_kn = 0.0
        for i in range(len(points) - 1):
            p1 = points[i]
            p2 = points[i + 1]
            distance_nm += haversine_nm(p1["lat"], p1["lon"], p2["lat"], p2["lon"])
        speeds = [p["speed_kn"] for p in points if p.get("speed_kn") is not None]
        max_speed_kn = max(speeds) if speeds else 0.0
        start_time = track_doc["start_time"]
        end_time = track_doc.get("end_time") or points[-1]["timestamp"]
        duration_hours = max(0.0, (end_time - start_time).total_seconds() / 3600.0)
        avg_speed_kn = distance_nm / duration_hours if duration_hours > 0 else 0.0

    trip_doc = {
        "track_id": track_id,
        "name": track_doc.get("name"),
        "start_time": track_doc["start_time"],
        "end_time": track_doc.get("end_time"),
        "distance_nm": distance_nm,
        "avg_speed_kn": avg_speed_kn,
        "max_speed_kn": max_speed_kn,
    }

    result = await db.trips.update_one(
        {"track_id": track_id}, {"$set": trip_doc}, upsert=True
    )
    if result.upserted_id is not None:
        trip_doc["_id"] = result.upserted_id
    else:
        existing = await db.trips.find_one({"track_id": track_id})
        if existing:
            trip_doc["_id"] = existing["_id"]


@api_router.post("/tracks", response_model=Track)
async def create_track(payload: TrackCreate):
    now = datetime.utcnow()
    doc = {
        "name": payload.name,
        "notes": payload.notes,
        "start_time": payload.start_time or now,
        "end_time": None,
    }
    result = await db.tracks.insert_one(doc)
    return Track(
        id=str(result.inserted_id),
        name=doc["name"],
        notes=doc["notes"],
        start_time=doc["start_time"],
        end_time=None,
    )


@api_router.post("/tracks/{track_id}/points")
async def append_track_points(track_id: str, batch: TrackPointBatch):
    try:
        track_obj_id = ObjectId(track_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid track id")

    track = await db.tracks.find_one({"_id": track_obj_id})
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    if not batch.points:
        return {"inserted": 0}

    docs = []
    for p in batch.points:
        docs.append(
            {
                "track_id": track_obj_id,
                "timestamp": p.timestamp,
                "lat": p.lat,
                "lon": p.lon,
                "speed_kn": p.speed_kn,
                "course_deg": p.course_deg,
            }
        )

    result = await db.track_points.insert_many(docs)
    return {"inserted": len(result.inserted_ids)}


@api_router.patch("/tracks/{track_id}/end", response_model=Track)
async def end_track(track_id: str, end_time: Optional[datetime] = None):
    try:
        track_obj_id = ObjectId(track_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid track id")

    end_ts = end_time or datetime.utcnow()
    update_result = await db.tracks.update_one(
        {"_id": track_obj_id}, {"$set": {"end_time": end_ts}}
    )
    if update_result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Track not found")

    updated = await db.tracks.find_one({"_id": track_obj_id})
    # Compute and store trip stats automatically
    await compute_and_store_trip(updated)

    return Track(
        id=str(updated["_id"]),
        name=updated.get("name"),
        notes=updated.get("notes"),
        start_time=updated["start_time"],
        end_time=updated.get("end_time"),
    )


@api_router.get("/tracks", response_model=List[Track])
async def list_tracks():
    cursor = db.tracks.find().sort("start_time", -1).limit(100)
    items: List[Track] = []
    async for doc in cursor:
        items.append(
            Track(
                id=str(doc["_id"]),
                name=doc.get("name"),
                notes=doc.get("notes"),
                start_time=doc["start_time"],
                end_time=doc.get("end_time"),
            )
        )
    return items


@api_router.get("/trips", response_model=List[Trip])
async def list_trips():
    cursor = db.trips.find().sort("start_time", -1)
    items: List[Trip] = []
    async for doc in cursor:
        items.append(
            Trip(
                id=str(doc["_id"]),
                track_id=str(doc["track_id"]),
                name=doc.get("name"),
                start_time=doc["start_time"],
                end_time=doc.get("end_time"),
                distance_nm=float(doc.get("distance_nm", 0.0)),
                avg_speed_kn=float(doc.get("avg_speed_kn", 0.0)),
                max_speed_kn=float(doc.get("max_speed_kn", 0.0)),
            )
        )
    return items


@api_router.get("/trips/{trip_id}", response_model=Trip)
async def get_trip(trip_id: str):
    try:
        obj_id = ObjectId(trip_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid trip id")

    doc = await db.trips.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Trip not found")
    return Trip(
        id=str(doc["_id"]),
        track_id=str(doc["track_id"]),
        name=doc.get("name"),
        start_time=doc["start_time"],
        end_time=doc.get("end_time"),
        distance_nm=float(doc.get("distance_nm", 0.0)),
        avg_speed_kn=float(doc.get("avg_speed_kn", 0.0)),
        max_speed_kn=float(doc.get("max_speed_kn", 0.0)),
    )


# -------------------------
# Waypoints & Routes Models & Routes
# -------------------------
class WaypointCreate(BaseModel):
    name: str
    description: Optional[str] = None
    lat: float
    lon: float


class WaypointUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class Waypoint(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    lat: float
    lon: float
    created_at: datetime


class RouteWaypoint(BaseModel):
    waypoint_id: str
    order: int


class RouteCreate(BaseModel):
    name: str
    description: Optional[str] = None
    waypoint_ids: List[str]


class Route(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    waypoint_ids: List[str]
    created_at: datetime


def waypoint_from_doc(doc: dict) -> Waypoint:
    return Waypoint(
        id=str(doc["_id"]),
        name=doc["name"],
        description=doc.get("description"),
        lat=doc["lat"],
        lon=doc["lon"],
        created_at=doc["created_at"],
    )


@api_router.post("/waypoints", response_model=Waypoint)
async def create_waypoint(payload: WaypointCreate):
    now = datetime.utcnow()
    doc = {
        "name": payload.name,
        "description": payload.description,
        "lat": payload.lat,
        "lon": payload.lon,
        "created_at": now,
    }
    result = await db.waypoints.insert_one(doc)
    doc["_id"] = result.inserted_id
    return waypoint_from_doc(doc)


@api_router.get("/waypoints", response_model=List[Waypoint])
async def list_waypoints():
    cursor = db.waypoints.find().sort("created_at", -1)
    items: List[Waypoint] = []
    async for doc in cursor:
        items.append(waypoint_from_doc(doc))
    return items


@api_router.delete("/waypoints/{waypoint_id}")
async def delete_waypoint(waypoint_id: str):
    try:
        obj_id = ObjectId(waypoint_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid waypoint id")

    result = await db.waypoints.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Waypoint not found")
    return {"deleted": True}


def route_from_doc(doc: dict) -> Route:
    return Route(
        id=str(doc["_id"]),
        name=doc["name"],
        description=doc.get("description"),
        waypoint_ids=[str(wid) for wid in doc.get("waypoint_ids", [])],
        created_at=doc["created_at"],
    )


@api_router.post("/routes", response_model=Route)
async def create_route(payload: RouteCreate):
    if not payload.waypoint_ids or len(payload.waypoint_ids) < 2:
        raise HTTPException(status_code=400, detail="Route must have at least two waypoints")

    try_ids = []
    for wid in payload.waypoint_ids:
        try:
            try_ids.append(ObjectId(wid))
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid waypoint id: {wid}")

    # Ensure all waypoints exist
    count = await db.waypoints.count_documents({"_id": {"$in": try_ids}})
    if count != len(try_ids):
        raise HTTPException(status_code=400, detail="One or more waypoints do not exist")

    now = datetime.utcnow()
    doc = {
        "name": payload.name,
        "description": payload.description,
        "waypoint_ids": try_ids,
        "created_at": now,
    }
    result = await db.routes.insert_one(doc)
    doc["_id"] = result.inserted_id
    return route_from_doc(doc)


@api_router.get("/routes", response_model=List[Route])
async def list_routes():
    cursor = db.routes.find().sort("created_at", -1)
    items: List[Route] = []
    async for doc in cursor:
        items.append(route_from_doc(doc))
    return items


@api_router.get("/routes/{route_id}", response_model=Route)
async def get_route(route_id: str):
    try:
        obj_id = ObjectId(route_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid route id")

    doc = await db.routes.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Route not found")
    return route_from_doc(doc)


@api_router.delete("/routes/{route_id}")
async def delete_route(route_id: str):
    try:
        obj_id = ObjectId(route_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid route id")

    result = await db.routes.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Route not found")
    return {"deleted": True}


class RouteWithWaypoints(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    waypoints: List[Waypoint]
    total_distance_nm: float
    created_at: datetime


@api_router.get("/routes/{route_id}/details", response_model=RouteWithWaypoints)
async def get_route_with_waypoints(route_id: str):
    """Get a route with full waypoint details and calculate total distance."""
    try:
        obj_id = ObjectId(route_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid route id")

    route_doc = await db.routes.find_one({"_id": obj_id})
    if not route_doc:
        raise HTTPException(status_code=404, detail="Route not found")

    waypoint_ids = route_doc.get("waypoint_ids", [])
    if not waypoint_ids:
        return RouteWithWaypoints(
            id=str(route_doc["_id"]),
            name=route_doc["name"],
            description=route_doc.get("description"),
            waypoints=[],
            total_distance_nm=0.0,
            created_at=route_doc["created_at"],
        )

    # Fetch all waypoints in a single query (optimized - no N+1)
    waypoints_docs = await db.waypoints.find({"_id": {"$in": waypoint_ids}}).to_list(None)
    waypoints_map = {str(doc["_id"]): waypoint_from_doc(doc) for doc in waypoints_docs}
    
    # Maintain order from waypoint_ids
    waypoints_list = [waypoints_map[str(wid)] for wid in waypoint_ids if str(wid) in waypoints_map]

    # Calculate total distance between consecutive waypoints
    total_distance_nm = 0.0
    for i in range(len(waypoints_list) - 1):
        w1 = waypoints_list[i]
        w2 = waypoints_list[i + 1]
        total_distance_nm += haversine_nm(w1.lat, w1.lon, w2.lat, w2.lon)

    return RouteWithWaypoints(
        id=str(route_doc["_id"]),
        name=route_doc["name"],
        description=route_doc.get("description"),
        waypoints=waypoints_list,
        total_distance_nm=total_distance_nm,
        created_at=route_doc["created_at"],
    )


# -------------------------
# Tide (NOAA) Models & Routes
# -------------------------
class TideStation(BaseModel):
    id: str
    name: str
    state: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None


class TidePredictionPoint(BaseModel):
    time: datetime
    height_ft: float
    type: Optional[str] = None


class TidePredictionResponse(BaseModel):
    station_id: str
    date: date
    predictions: List[TidePredictionPoint]


NOAA_METADATA_URL = "https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json"
NOAA_PREDICTIONS_URL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter"


@api_router.get("/tides/stations", response_model=List[TideStation])
async def search_stations(search: Optional[str] = None, state: Optional[str] = None):
    params = {"type": "tidepredictions"}
    async with httpx.AsyncClient(timeout=10) as client_http:
        resp = await client_http.get(NOAA_METADATA_URL, params=params)
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to fetch stations from NOAA")

    data = resp.json()
    stations_raw = data.get("stations", [])

    results: List[TideStation] = []
    search_lower = search.lower() if search else None
    state_lower = state.lower() if state else None

    for s in stations_raw:
        name = s.get("name", "")
        st = s.get("state")
        if search_lower and search_lower not in name.lower():
            continue
        if state_lower and (not st or state_lower != st.lower()):
            continue

        results.append(
            TideStation(
                id=str(s.get("id")),
                name=name,
                state=st,
                lat=s.get("lat"),
                lon=s.get("lng"),
            )
        )

    return results


@api_router.get("/tides/stations/{station_id}/predictions", response_model=TidePredictionResponse)
async def get_station_predictions(station_id: str, target_date: Optional[date] = None):
    d = target_date or date.today()
    day_str = d.strftime("%Y%m%d")

    params = {
        "station": station_id,
        "product": "predictions",
        "datum": "MLLW",
        "time_zone": "gmt",
        "units": "english",
        "interval": "hilo",
        "format": "json",
        "begin_date": day_str,
        "end_date": day_str,
    }
    async with httpx.AsyncClient(timeout=10) as client_http:
        resp = await client_http.get(NOAA_PREDICTIONS_URL, params=params)

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to fetch predictions from NOAA")

    data = resp.json()
    preds_raw = data.get("predictions")
    if preds_raw is None:
        raise HTTPException(status_code=502, detail="Unexpected response from NOAA")

    preds: List[TidePredictionPoint] = []
    for item in preds_raw:
        t_str = item.get("t")
        v_str = item.get("v")
        typ = item.get("type")
        if not t_str or v_str is None:
            continue
        try:
            t_dt = datetime.strptime(t_str, "%Y-%m-%d %H:%M")
            height = float(v_str)
        except Exception:
            continue

        preds.append(TidePredictionPoint(time=t_dt, height_ft=height, type=typ))

    return TidePredictionResponse(station_id=station_id, date=d, predictions=preds)


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
