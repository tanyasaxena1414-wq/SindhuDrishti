import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.detection_pipeline import (
    compute_fdi,
    compute_ndvi,
    evaluate_spectral_properties,
    enrich_hotspot_collection,
)

@pytest.mark.anyio
async def test_compute_fdi():
    # Test typical plastic debris reflectance: elevated NIR above Red2/SWIR1 baseline
    fdi = compute_fdi(r_nir=0.22, r_red2=0.08, r_swir1=0.12)
    assert isinstance(fdi, float)
    assert fdi > 0.0

@pytest.mark.anyio
async def test_compute_ndvi():
    # Test organic vegetation vs non-vegetation
    ndvi_veg = compute_ndvi(r_nir=0.45, r_red=0.05)
    assert ndvi_veg > 0.7

    ndvi_water = compute_ndvi(r_nir=0.02, r_red=0.03)
    assert ndvi_water < 0.0

@pytest.mark.anyio
async def test_evaluate_spectral_properties():
    props = evaluate_spectral_properties(area_m2=25000.0, count=15, feature_index=2)
    assert "fdi_value" in props
    assert "ndvi_value" in props
    assert "spectral_class" in props
    assert "confidence_score" in props
    assert 0.0 <= props["confidence_score"] <= 1.0
    assert props["spectral_class"] in (
        "candidate_plastic_debris",
        "sparse_macro_debris",
        "dense_vegetation_hyacinth",
    )

@pytest.mark.anyio
async def test_enrich_hotspot_collection():
    raw_col = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [75.34, 19.46]},
                "properties": {"area_m2": 15000.0, "count": 10}
            }
        ]
    }
    enriched = enrich_hotspot_collection(raw_col)
    assert len(enriched["features"]) == 1
    p = enriched["features"][0]["properties"]
    assert "confidence_score" in p
    assert "spectral_class" in p
    assert "fdi_value" in p
    assert "id" in p

@pytest.mark.anyio
async def test_hotspots_filter_by_confidence(client):
    response = await client.get("/api/v1/hotspots?min_confidence=0.5")
    assert response.status_code == 200
    data = response.json()
    for feat in data["features"]:
        assert feat["properties"]["confidence_score"] >= 0.5

@pytest.mark.anyio
async def test_hotspots_filter_by_spectral_class(client):
    response = await client.get("/api/v1/hotspots?spectral_class=candidate_plastic_debris")
    assert response.status_code == 200
    data = response.json()
    for feat in data["features"]:
        assert feat["properties"]["spectral_class"] == "candidate_plastic_debris"
