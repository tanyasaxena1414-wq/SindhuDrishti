from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.geospatial import geojson_store

router = APIRouter(prefix="", tags=["geospatial"])

@router.get("/basins", summary="Get all available monitored watershed basins in the platform")
async def get_basins():
    return {
        "basins": geojson_store.get_available_basins(),
        "total": len(geojson_store.get_available_basins()),
        "active_pilot": "jayakwadi"
    }

@router.get("/study-area", summary="Get watershed basin study area metadata & bounds")
async def get_study_area(
    basin: Optional[str] = Query("jayakwadi", description="Target watershed basin: jayakwadi, hussainsagar, or yamuna")
):
    return geojson_store.get_study_area_metadata(basin=basin)

@router.get("/water-masks", summary="Get reservoir/waterbody water masks GeoJSON FeatureCollection")
async def get_water_masks(
    basin: Optional[str] = Query("jayakwadi", description="Target watershed basin: jayakwadi, hussainsagar, or yamuna")
):
    masks = geojson_store.get_water_masks(basin=basin)
    if not masks or not masks.get("features"):
        raise HTTPException(status_code=404, detail="Water masks dataset not found or empty")
    return masks

@router.get("/water-masks/analysis", summary="Get multi-spectral water detection diagnostics, surface area & calibration")
async def get_water_mask_analysis(
    basin: Optional[str] = Query("jayakwadi", description="Target watershed basin: jayakwadi, hussainsagar, or yamuna"),
    algorithm: Optional[str] = Query("mndwi", description="Spectral index: mndwi, ndwi, or awei"),
    threshold: Optional[float] = Query(0.12, ge=-0.2, le=0.5, description="Index threshold for water extraction")
):
    from app.services.water_mask_service import water_mask_service
    return water_mask_service.get_water_detection_analysis(
        basin=basin or "jayakwadi",
        algorithm=algorithm or "mndwi",
        threshold=threshold if threshold is not None else 0.12
    )


@router.get("/hotspots", summary="Get candidate debris hotspots GeoJSON FeatureCollection with optional filters")
async def get_hotspots(
    basin: Optional[str] = Query("jayakwadi", description="Target watershed basin: jayakwadi, hussainsagar, or yamuna"),
    min_area: Optional[float] = Query(None, description="Minimum area in square meters"),
    status: Optional[str] = Query(None, description="Filter by status (e.g. unverified_candidate)"),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum confidence score (0.0 to 1.0)"),
    spectral_class: Optional[str] = Query(None, description="Filter by spectral class (e.g. candidate_plastic_debris, dense_vegetation_hyacinth)"),
    zone: Optional[str] = Query(None, description="Filter by zone: all, open_water, or shoreline"),
    exclude_artifacts: Optional[bool] = Query(False, description="Exclude shoreline mixed-pixel boundary artifacts (<60m)")
):
    hotspots = geojson_store.get_hotspots(basin=basin)
    features = hotspots.get("features", [])

    if not features:
        return {"type": "FeatureCollection", "features": [], "metadata": {"total_matched": 0}}

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

        # Apply min_confidence filter
        if min_confidence is not None:
            conf = props.get("confidence_score", 0.0)
            if conf < min_confidence:
                continue

        # Apply spectral_class filter
        if spectral_class is not None and spectral_class != "all":
            feat_class = props.get("spectral_class", "")
            if feat_class.lower() != spectral_class.lower():
                continue

        # Apply zone filter (open_water vs shoreline)
        if zone is not None and zone != "all":
            feat_zone = props.get("zone_type", "")
            if zone == "open_water" and "pelagic" not in feat_zone and "open_water" not in feat_zone:
                continue
            if zone == "shoreline" and "shoreline" not in feat_zone:
                continue

        # Apply exclude_artifacts filter
        if exclude_artifacts and props.get("is_shoreline_edge_artifact", False):
            continue

        filtered_features.append(feat)

    return {
        "type": "FeatureCollection",
        "features": filtered_features,
        "metadata": {
            "total_matched": len(filtered_features),
            "basin": geojson_store.normalize_basin(basin),
            "source": "Sentinel-2 Level-2A",
            "pipeline": "Biermann FDI & NDVI Spectral Discrimination v2",
            "disclaimer": "Satellite anomalies are unverified candidate hotspots, not confirmed plastic pollution."
        }
    }
