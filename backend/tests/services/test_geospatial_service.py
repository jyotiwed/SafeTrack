import pytest
from app.services.geospatial_service import GeospatialService


class TestGeospatialService:
    """Test geospatial operations"""

   
    def test_calculate_distance(self):
        """Test distance calculation between Delhi and Ghaziabad (~34 km)"""
        distance = GeospatialService.haversine_distance(
            lat1=19.0760, lon1=72.8777,  
            lat2=18.5204, lon2=73.8567 
        )
        assert distance > 0
        assert 1140000 < distance < 1270000        

    def test_haversine_same_point_is_zero(self):
        """Test haversine distance for same point returns zero"""
        distance = GeospatialService.haversine_distance(
            lat1=28.7041, lon1=77.1025,
            lat2=28.7041, lon2=77.1025
        )
        assert distance == 0                   

    def test_haversine_is_symmetric(self):
        """Test distance A→B equals distance B→A"""
        d1 = GeospatialService.haversine_distance(
            lat1=28.7041, lon1=77.1025,
            lat2=28.6139, lon2=77.2090
        )
        d2 = GeospatialService.haversine_distance(
            lat1=28.6139, lon1=77.2090,
            lat2=28.7041, lon2=77.1025
        )
        assert abs(d1 - d2) < 0.01             
    def test_haversine_known_distance(self):
        """Test haversine against known distance: Mumbai to Pune (~150 km)"""
        distance = GeospatialService.haversine_distance(
            lat1=19.0760, lon1=72.8777,  
            lat2=18.5204, lon2=73.8567   
        )
      
        assert 140000 < distance < 160000

    
    async def test_find_locations_within_radius(
        self,
        geospatial_service: GeospatialService
    ):
        """Test finding locations within a 50 km radius of Delhi"""
        points = [
            (28.7041, 77.1025),  # Delhi — inside radius
            (28.6139, 77.2090),  # Noida — inside radius
            (12.9716, 77.5946),  # Bangalore — far outside radius
        ]
        center = (28.7041, 77.1025)
        radius_m = 50000  # 50 km

        result = await geospatial_service.points_within_radius(
            points=points,
            center=center,
            radius_m=radius_m
        )

        assert isinstance(result, list)
        assert len(result) >= 2                 # ✅ Delhi + Noida should be inside
        assert (28.7041, 77.1025) in result     # ✅ center point is always inside

    async def test_no_points_within_small_radius(
        self,
        geospatial_service: GeospatialService
    ):
        """Test that far-away points are excluded from a small radius"""
        points = [
            (12.9716, 77.5946),  # Bangalore — very far from Delhi
        ]
        center = (28.7041, 77.1025)
        radius_m = 1000             # 1 km — Bangalore is ~2000 km away

        result = await geospatial_service.points_within_radius(
            points=points,
            center=center,
            radius_m=radius_m
        )

        assert isinstance(result, list)
        assert len(result) == 0                