// Simple geographic helpers for marine navigation

export interface LatLon {
  lat: number;
  lon: number;
}

const R_KM = 6371; // Earth radius in km
const KM_PER_NM = 1.852;

export function distanceNm(a: LatLon, b: LatLon): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  const dKm = R_KM * c;
  return dKm / KM_PER_NM;
}

export interface RouteLeg {
  from: LatLon;
  to: LatLon;
  distanceNm: number;
}

export interface RouteStats {
  totalDistanceNm: number;
  legs: RouteLeg[];
}

export function computeRouteStats(points: LatLon[]): RouteStats {
  if (points.length < 2) return { totalDistanceNm: 0, legs: [] };
  const legs: RouteLeg[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const from = points[i];
    const to = points[i + 1];
    const dNm = distanceNm(from, to);
    total += dNm;
    legs.push({ from, to, distanceNm: dNm });
  }
  return { totalDistanceNm: total, legs };
}
