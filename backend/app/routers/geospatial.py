from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.geospatial import geojson_store

router = APIRouter(prefix="", tags=["geospatial"])

@router.get("/study-area", summary="Get Godavari basin study area metadata & bounds")
async def get_study_area():
    return geojson_store.get_study_area_metadata()

@router.get("/water-masks", summary="Get reservoir water masks GeoJSON FeatureCollection")
async def get_water_masks():
    masks = geojson_store.get_water_masks()
    if not masks or not masks.get("features"):
        raise HTTPException(status_code=404, detail="Water masks dataset not found or empty")
    return masks

@router.get("/hotspots", summary="Get candidate debris hotspots GeoJSON FeatureCollection with optional filters")
async def get_hotspots(
    min_area: Optional[float] = Query(None, description="Minimum area in square meters"),
    status: Optional[str] = Query(None, description="Filter by status (e.g. unverified_candidate)")
):
    hotspots = geojson_store.get_hotspots()
    features = hotspots.get("features", [])

    if not features:
        return {"type": "FeatureCollection", "features": []}

    filtered_features = []
    for feat in features:
        props = feat.get("properties", {})

        # Apply min_area filter
        if min_area is not None:
            area = props.get("area_m2", 0.0)
            if area < min_area:
                continue

        # Apply status filter
        if status is not None:
            feat_status = props.get("status", "")
            if feat_status.lower() != status.lower():
                continue

        filtered_features.append(feat)

    return {
        "type": "FeatureCollection",
        "features": filtered_features,
        "metadata": {
            "total_matched": len(filtered_features),
            "source": "Sentinel-2 Level-2A",
            "disclaimer": "Satellite anomalies are unverified candidate hotspots, not confirmed plastic pollution."
        }
    }
