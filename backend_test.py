"""
Backend API Tests for VoyageTrack
Tests the Route Navigation on Chart backend implementation
"""

import requests
import json
from datetime import datetime
import math

# Backend URL from environment
BACKEND_URL = "https://voyagetrack-4.preview.emergentagent.com/api"

def haversine_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two points in nautical miles."""
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


def test_health_check():
    """Test that backend is running"""
    print("\n=== Testing Backend Health ===")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200, f"Health check failed with status {response.status_code}"
        assert response.json()["status"] == "ok", "Health check status not ok"
        print("✅ Backend health check passed")
        return True
    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
        return False


def test_route_details_endpoint():
    """
    Test GET /api/routes/{route_id}/details endpoint
    
    Tests:
    1. Create 2 waypoints at different locations
    2. Create a route with those waypoints
    3. Fetch route details
    4. Verify response structure
    5. Verify distance calculation
    6. Test error cases
    """
    print("\n=== Testing Route Details Endpoint ===")
    
    # Test 1: Create waypoints
    print("\n--- Creating Waypoints ---")
    
    # Waypoint 1: San Francisco Bay Area
    waypoint1_data = {
        "name": "Marina Bay",
        "description": "Starting point at Marina",
        "lat": 37.8044,
        "lon": -122.4679
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/waypoints", json=waypoint1_data, timeout=10)
        print(f"Waypoint 1 Status: {response.status_code}")
        assert response.status_code == 200, f"Failed to create waypoint 1: {response.status_code}"
        waypoint1 = response.json()
        waypoint1_id = waypoint1["id"]
        print(f"✅ Created Waypoint 1: {waypoint1['name']} (ID: {waypoint1_id})")
        print(f"   Location: {waypoint1['lat']}, {waypoint1['lon']}")
    except Exception as e:
        print(f"❌ Failed to create waypoint 1: {e}")
        return False
    
    # Waypoint 2: Golden Gate Bridge area
    waypoint2_data = {
        "name": "Golden Gate",
        "description": "Near Golden Gate Bridge",
        "lat": 37.8199,
        "lon": -122.4783
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/waypoints", json=waypoint2_data, timeout=10)
        print(f"Waypoint 2 Status: {response.status_code}")
        assert response.status_code == 200, f"Failed to create waypoint 2: {response.status_code}"
        waypoint2 = response.json()
        waypoint2_id = waypoint2["id"]
        print(f"✅ Created Waypoint 2: {waypoint2['name']} (ID: {waypoint2_id})")
        print(f"   Location: {waypoint2['lat']}, {waypoint2['lon']}")
    except Exception as e:
        print(f"❌ Failed to create waypoint 2: {e}")
        return False
    
    # Calculate expected distance
    expected_distance = haversine_nm(
        waypoint1_data["lat"], waypoint1_data["lon"],
        waypoint2_data["lat"], waypoint2_data["lon"]
    )
    print(f"\n📏 Expected distance between waypoints: {expected_distance:.2f} nm")
    
    # Test 2: Create route with waypoints
    print("\n--- Creating Route ---")
    route_data = {
        "name": "Bay Area Cruise",
        "description": "Scenic route around San Francisco Bay",
        "waypoint_ids": [waypoint1_id, waypoint2_id]
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/routes", json=route_data, timeout=10)
        print(f"Route Creation Status: {response.status_code}")
        assert response.status_code == 200, f"Failed to create route: {response.status_code}"
        route = response.json()
        route_id = route["id"]
        print(f"✅ Created Route: {route['name']} (ID: {route_id})")
        print(f"   Waypoints: {route['waypoint_ids']}")
    except Exception as e:
        print(f"❌ Failed to create route: {e}")
        return False
    
    # Test 3: Fetch route details
    print("\n--- Fetching Route Details ---")
    try:
        response = requests.get(f"{BACKEND_URL}/routes/{route_id}/details", timeout=10)
        print(f"Route Details Status: {response.status_code}")
        assert response.status_code == 200, f"Failed to fetch route details: {response.status_code}"
        route_details = response.json()
        print(f"✅ Fetched route details successfully")
        print(f"\nRoute Details:")
        print(f"  ID: {route_details['id']}")
        print(f"  Name: {route_details['name']}")
        print(f"  Description: {route_details.get('description', 'N/A')}")
        print(f"  Total Distance: {route_details['total_distance_nm']:.2f} nm")
        print(f"  Number of Waypoints: {len(route_details['waypoints'])}")
    except Exception as e:
        print(f"❌ Failed to fetch route details: {e}")
        return False
    
    # Test 4: Verify response structure
    print("\n--- Verifying Response Structure ---")
    try:
        assert "id" in route_details, "Missing 'id' field"
        assert "name" in route_details, "Missing 'name' field"
        assert "waypoints" in route_details, "Missing 'waypoints' field"
        assert "total_distance_nm" in route_details, "Missing 'total_distance_nm' field"
        assert isinstance(route_details["waypoints"], list), "waypoints should be a list"
        assert len(route_details["waypoints"]) == 2, f"Expected 2 waypoints, got {len(route_details['waypoints'])}"
        print("✅ Response structure is correct")
        
        # Verify waypoint details
        for i, wp in enumerate(route_details["waypoints"], 1):
            print(f"\n  Waypoint {i}:")
            print(f"    ID: {wp['id']}")
            print(f"    Name: {wp['name']}")
            print(f"    Location: {wp['lat']}, {wp['lon']}")
            assert "id" in wp, f"Waypoint {i} missing 'id'"
            assert "name" in wp, f"Waypoint {i} missing 'name'"
            assert "lat" in wp, f"Waypoint {i} missing 'lat'"
            assert "lon" in wp, f"Waypoint {i} missing 'lon'"
        print("\n✅ All waypoint details are present")
    except AssertionError as e:
        print(f"❌ Response structure validation failed: {e}")
        return False
    
    # Test 5: Verify distance calculation
    print("\n--- Verifying Distance Calculation ---")
    try:
        actual_distance = route_details["total_distance_nm"]
        print(f"Expected distance: {expected_distance:.4f} nm")
        print(f"Actual distance: {actual_distance:.4f} nm")
        
        # Allow small floating point difference (0.01 nm tolerance)
        distance_diff = abs(actual_distance - expected_distance)
        print(f"Difference: {distance_diff:.6f} nm")
        
        assert actual_distance > 0, "Distance should be greater than 0"
        assert distance_diff < 0.01, f"Distance calculation mismatch: expected {expected_distance:.4f}, got {actual_distance:.4f}"
        print("✅ Distance calculation is accurate")
    except AssertionError as e:
        print(f"❌ Distance calculation validation failed: {e}")
        return False
    
    # Test 6: Error handling - Invalid route ID
    print("\n--- Testing Error Handling: Invalid Route ID ---")
    try:
        response = requests.get(f"{BACKEND_URL}/routes/invalid_id_123/details", timeout=10)
        print(f"Invalid ID Status: {response.status_code}")
        assert response.status_code == 400, f"Expected 400 for invalid ID, got {response.status_code}"
        print("✅ Invalid route ID handled correctly (400 Bad Request)")
    except AssertionError as e:
        print(f"❌ Invalid ID error handling failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Error testing invalid ID: {e}")
        return False
    
    # Test 7: Error handling - Non-existent route ID
    print("\n--- Testing Error Handling: Non-existent Route ID ---")
    try:
        # Use a valid ObjectId format but non-existent
        fake_id = "507f1f77bcf86cd799439011"
        response = requests.get(f"{BACKEND_URL}/routes/{fake_id}/details", timeout=10)
        print(f"Non-existent ID Status: {response.status_code}")
        assert response.status_code == 404, f"Expected 404 for non-existent route, got {response.status_code}"
        print("✅ Non-existent route ID handled correctly (404 Not Found)")
    except AssertionError as e:
        print(f"❌ Non-existent ID error handling failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Error testing non-existent ID: {e}")
        return False
    
    print("\n" + "="*50)
    print("✅ ALL ROUTE DETAILS ENDPOINT TESTS PASSED")
    print("="*50)
    return True


def test_route_with_multiple_waypoints():
    """Test route with 3+ waypoints to verify cumulative distance calculation"""
    print("\n=== Testing Route with Multiple Waypoints ===")
    
    # Create 3 waypoints forming a triangle
    waypoints_data = [
        {"name": "Point A", "description": "First point", "lat": 37.7749, "lon": -122.4194},
        {"name": "Point B", "description": "Second point", "lat": 37.8044, "lon": -122.4679},
        {"name": "Point C", "description": "Third point", "lat": 37.8199, "lon": -122.4783}
    ]
    
    waypoint_ids = []
    waypoint_coords = []
    
    print("\n--- Creating 3 Waypoints ---")
    for i, wp_data in enumerate(waypoints_data, 1):
        try:
            response = requests.post(f"{BACKEND_URL}/waypoints", json=wp_data, timeout=10)
            assert response.status_code == 200, f"Failed to create waypoint {i}"
            wp = response.json()
            waypoint_ids.append(wp["id"])
            waypoint_coords.append((wp_data["lat"], wp_data["lon"]))
            print(f"✅ Created Waypoint {i}: {wp['name']}")
        except Exception as e:
            print(f"❌ Failed to create waypoint {i}: {e}")
            return False
    
    # Calculate expected total distance
    expected_total = 0.0
    for i in range(len(waypoint_coords) - 1):
        lat1, lon1 = waypoint_coords[i]
        lat2, lon2 = waypoint_coords[i + 1]
        segment_dist = haversine_nm(lat1, lon1, lat2, lon2)
        expected_total += segment_dist
        print(f"  Segment {i+1} distance: {segment_dist:.2f} nm")
    
    print(f"\n📏 Expected total distance: {expected_total:.2f} nm")
    
    # Create route
    print("\n--- Creating Route with 3 Waypoints ---")
    route_data = {
        "name": "Triangle Route",
        "description": "Three-point navigation route",
        "waypoint_ids": waypoint_ids
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/routes", json=route_data, timeout=10)
        assert response.status_code == 200, f"Failed to create route"
        route = response.json()
        route_id = route["id"]
        print(f"✅ Created Route: {route['name']}")
    except Exception as e:
        print(f"❌ Failed to create route: {e}")
        return False
    
    # Fetch and verify route details
    print("\n--- Fetching Route Details ---")
    try:
        response = requests.get(f"{BACKEND_URL}/routes/{route_id}/details", timeout=10)
        assert response.status_code == 200, f"Failed to fetch route details"
        route_details = response.json()
        
        actual_distance = route_details["total_distance_nm"]
        print(f"Expected distance: {expected_total:.4f} nm")
        print(f"Actual distance: {actual_distance:.4f} nm")
        
        distance_diff = abs(actual_distance - expected_total)
        assert distance_diff < 0.01, f"Distance mismatch: {distance_diff:.6f} nm"
        assert len(route_details["waypoints"]) == 3, f"Expected 3 waypoints, got {len(route_details['waypoints'])}"
        
        print("✅ Multi-waypoint route test passed")
        return True
    except Exception as e:
        print(f"❌ Multi-waypoint route test failed: {e}")
        return False


def main():
    """Run all backend tests"""
    print("="*60)
    print("VOYAGETRACK BACKEND API TESTS")
    print("Route Navigation on Chart - Backend Implementation")
    print("="*60)
    
    results = {
        "health_check": False,
        "route_details_endpoint": False,
        "multiple_waypoints": False
    }
    
    # Test 1: Health check
    results["health_check"] = test_health_check()
    
    if not results["health_check"]:
        print("\n❌ Backend is not responding. Cannot proceed with tests.")
        return False
    
    # Test 2: Route details endpoint (main test)
    results["route_details_endpoint"] = test_route_details_endpoint()
    
    # Test 3: Multiple waypoints
    results["multiple_waypoints"] = test_route_with_multiple_waypoints()
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    all_passed = all(results.values())
    print("\n" + "="*60)
    if all_passed:
        print("✅ ALL TESTS PASSED")
    else:
        print("❌ SOME TESTS FAILED")
    print("="*60)
    
    return all_passed


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
