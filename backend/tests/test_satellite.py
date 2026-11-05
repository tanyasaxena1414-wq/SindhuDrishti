"""
Unit and integration tests for Satellite STAC Service and MARIDA Supervised Classifier (Tiers 3 & 4)
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.marida_classifier import (
    compute_fdi,
    compute_ndvi,
    compute_plastic_index,
    compute_red_edge_slope,
    extract_features,
    marida_classifier,
)
from app.services.stac_satellite import stac_satellite_service


@pytest.mark.anyio
async def test_spectral_formula_calculations():
    # Synthetic reflectance: B4=0.04, B6=0.07, B8=0.18, B11=0.10
    fdi = compute_fdi(b8_nir=0.18, b6_red2=0.07, b11_swir1=0.10)
    assert fdi > 0.05  # Strong positive FDI departure

    ndvi = compute_ndvi(b8_nir=0.18, b4_red=0.04)
    assert round(ndvi, 2) == 0.64

    pi = compute_plastic_index(b8_nir=0.18, b4_red=0.04)
    assert round(pi, 2) == 0.82

    re_slope = compute_red_edge_slope(b8_nir=0.18, b6_red2=0.07)
    assert round(re_slope, 2) == 0.44


@pytest.mark.anyio
async def test_marida_plastic_debris_classification():
    # Synthetic plastic debris signature: positive FDI, moderate NIR, flat Red-Edge slope, NDVI < 0.35
    features = extract_features(
        b2=0.04, b3=0.05, b4=0.07, b6=0.09, b8=0.13, b11=0.08
    )
    result = marida_classifier.classify(features)

    assert result.predicted_class == "candidate_plastic_debris"
    assert result.confidence > 0.60
    assert "candidate_plastic_debris" in result.class_probabilities
    assert result.class_probabilities["candidate_plastic_debris"] > result.class_probabilities["dense_vegetation_hyacinth"]
    assert "polymer" in result.rationale or "FDI" in result.rationale


@pytest.mark.anyio
async def test_marida_hyacinth_vegetation_classification():
    # Water hyacinth signature: Very high NIR (0.35), steep Red-Edge jump (B6=0.14 -> B8=0.35), high NDVI
    features = extract_features(
        b2=0.02, b3=0.05, b4=0.03, b6=0.14, b8=0.35, b11=0.08
    )
    result = marida_classifier.classify(features)

    assert result.predicted_class == "dense_vegetation_hyacinth"
    assert result.confidence > 0.60
    assert result.indices["ndvi"] >= 0.35
    assert "hyacinth" in result.rationale or "chlorophyll" in result.rationale


@pytest.mark.anyio
async def test_marida_sediment_classification():
    # Sediment signature: High visible reflection (B3=0.08, B4=0.07), low NIR (0.04), negative/zero FDI
    features = extract_features(
        b2=0.05, b3=0.08, b4=0.07, b6=0.05, b8=0.04, b11=0.015
    )
    result = marida_classifier.classify(features)

    assert result.predicted_class == "turbid_water_sediment"
    assert "sediment" in result.rationale or "visible" in result.rationale


@pytest.mark.anyio
async def test_stac_service_status_and_cached_passes():
    status = stac_satellite_service.get_status()
    assert status.status == "operational"
    assert status.satellite_constellation == "Copernicus Sentinel-2 (MSI L2A)"
    assert "Free" in status.cost_tier
    assert status.bounding_box == [75.19, 19.34, 75.48, 19.58]
    assert status.latest_pass is not None
    assert "43QEB" in status.latest_pass.tile_id


@pytest.mark.anyio
async def test_satellite_api_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Test status
        status_res = await ac.get("/api/v1/satellite/status")
        assert status_res.status_code == 200
        status_data = status_res.json()
        assert status_data["cost_tier"] == "100% Free Public Open Data"
        assert status_data["study_area"] == "Godavari Basin / Jayakwadi Reservoir"

        # 2. Test passes list
        passes_res = await ac.get("/api/v1/satellite/passes?limit=3")
        assert passes_res.status_code == 200
        passes_data = passes_res.json()
        assert passes_data["total"] >= 1
        assert len(passes_data["passes"]) >= 1

        # 3. Test sync
        sync_res = await ac.post("/api/v1/satellite/sync")
        assert sync_res.status_code == 200
        sync_data = sync_res.json()
        assert sync_data["success"] is True
        assert sync_data["hotspots_evaluated"] > 0
        assert "Sentinel-2" in sync_data["message"]

        # 4. Test interactive pixel classification
        pixel_res = await ac.post(
            "/api/v1/satellite/classify-pixel",
            params={
                "b2_blue": 0.04,
                "b3_green": 0.05,
                "b4_red": 0.07,
                "b6_red_edge": 0.09,
                "b8_nir": 0.13,
                "b11_swir1": 0.08
            }
        )
        assert pixel_res.status_code == 200
        pixel_data = pixel_res.json()
        assert pixel_data["predicted_class"] == "candidate_plastic_debris"
        assert pixel_data["confidence"] > 0.5

        # 5. Test multi-pass change detection
        chg_res = await ac.get("/api/v1/satellite/change-detection")
        assert chg_res.status_code == 200
        chg_data = chg_res.json()
        assert "baseline_pass" in chg_data
        assert "comparison_pass" in chg_data
        assert "accumulating_zones" in chg_data
        assert "persistent_zones" in chg_data
        assert "cleared_zones" in chg_data
        assert chg_data["accumulating_zones"]["count"] > 0
        assert len(chg_data["features"]) > 0


@pytest.mark.anyio
async def test_citizen_vision_classifier():
    from app.services.vision_classifier import classify_citizen_evidence

    res = classify_citizen_evidence(
        photo_reference="/assets/sample.png",
        description="Massive consolidated windrow of plastic bottles and fishing nets near Paithan Dam",
        latitude=19.4935,
        longitude=75.3850,
    )
    assert res["severity_grade"] >= 4
    assert len(res["polymer_breakdown"]) == 4
    assert res["is_satellite_correlated"] is True
    assert res["satellite_correlation"]["matched_hotspot_id"] is not None

