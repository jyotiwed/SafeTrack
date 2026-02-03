from typing import List, Tuple
from math import floor

from app.schemas.geospatial import MapPoint, Cluster


def _cluster_key(lat: float, lon: float, zoom: int) -> Tuple[int, int]:
    """
    Very simple grid-based clustering: bucket lat/lon into a grid depending on zoom.
    For early version only; you can replace with Supercluster later.
    """
    # grid size shrinks as zoom increases
    base = max(1, 18 - zoom)
    lat_bucket = floor(lat * base)
    lon_bucket = floor(lon * base)
    return lat_bucket, lon_bucket


def cluster_points(points: List[MapPoint], zoom: int = 10) -> List[Cluster]:
    buckets = {}
    for p in points:
        key = _cluster_key(p.latitude, p.longitude, zoom)
        if key not in buckets:
            buckets[key] = {
                "count": 0,
                "sum_lat": 0.0,
                "sum_lon": 0.0,
                "points": [],
            }
        b = buckets[key]
        b["count"] += 1
        b["sum_lat"] += p.latitude
        b["sum_lon"] += p.longitude
        b["points"].append(p)

    clusters: List[Cluster] = []
    cid = 1
    for b in buckets.values():
        lat_center = b["sum_lat"] / b["count"]
        lon_center = b["sum_lon"] / b["count"]
        clusters.append(
            Cluster(
                id=cid,
                latitude=lat_center,
                longitude=lon_center,
                count=b["count"],
                points=b["points"] if b["count"] <= 10 else None,
            )
        )
        cid += 1
    return clusters
