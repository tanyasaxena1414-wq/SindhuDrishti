import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.anyio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "SindhuDrishti" in data["service"]

@pytest.mark.anyio
async def test_root():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "SindhuDrishti API" in data["message"]

@pytest.mark.anyio
async def test_study_area():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/study-area")
    assert response.status_code == 200
    data = response.json()
    assert data["basin"] == "Godavari Basin"
    assert "bounding_box" in data

@pytest.mark.anyio
async def test_water_masks():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/water-masks")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert isinstance(data["features"], list)
    assert len(data["features"]) > 0

@pytest.mark.anyio
async def test_hotspots():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/hotspots")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert isinstance(data["features"], list)
    assert len(data["features"]) > 0
    # Test filtering by min_area
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac2:
        resp_filtered = await ac2.get("/api/v1/hotspots?min_area=10000.0")
    assert resp_filtered.status_code == 200
    data_filtered = resp_filtered.json()
    for feat in data_filtered["features"]:
        assert feat["properties"]["area_m2"] >= 10000.0

@pytest.mark.anyio
async def test_hotspots_high_min_area_empty():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/hotspots?min_area=99999999999.0")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 0

@pytest.mark.anyio
async def test_geojson_store_fallback_resilience(monkeypatch, tmp_path):
    from app.services.geospatial import GeoJSONStore
    import app.services.geospatial as geo_svc

    # Point to nonexistent files
    fake_path = tmp_path / "nonexistent.geojson"
    monkeypatch.setattr(geo_svc, "WATER_MASKS_PATH", fake_path)

    store = GeoJSONStore()
    hotspots = store.get_hotspots()
    assert hotspots == {"type": "FeatureCollection", "features": []}

    masks = store.get_water_masks()
    assert masks == {"type": "FeatureCollection", "features": []}

    meta = store.get_study_area_metadata()
    assert meta["datasets"]["hotspots_count"] == 0
    assert meta["datasets"]["water_masks_count"] == 0


@pytest.mark.anyio
async def test_hotspots_filter_by_zone_and_exclude_artifacts():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Filter by open_water
        resp_open = await ac.get("/api/v1/hotspots?zone=open_water")
        assert resp_open.status_code == 200
        open_data = resp_open.json()
        assert len(open_data["features"]) >= 12
        for f in open_data["features"]:
            assert "pelagic" in f["properties"]["zone_type"] or "open_water" in f["properties"]["zone_type"]

        # 2. Exclude shoreline edge artifacts
        resp_no_artifacts = await ac.get("/api/v1/hotspots?exclude_artifacts=true")
        assert resp_no_artifacts.status_code == 200
        clean_data = resp_no_artifacts.json()
        for f in clean_data["features"]:
            assert f["properties"]["is_shoreline_edge_artifact"] is False


@pytest.mark.anyio
async def test_basins_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/basins")
    assert resp.status_code == 200
    data = resp.json()
    assert "basins" in data
    assert len(data["basins"]) == 3
    basin_ids = [b["id"] for b in data["basins"]]
    assert "jayakwadi" in basin_ids
    assert "hussainsagar" in basin_ids
    assert "yamuna" in basin_ids


@pytest.mark.anyio
async def test_study_area_multi_basin():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Hussain Sagar
        resp_hs = await ac.get("/api/v1/study-area?basin=hussainsagar")
        assert resp_hs.status_code == 200
        data_hs = resp_hs.json()
        assert data_hs["basin"] == "Krishna Basin"
        assert "Hyderabad" in data_hs["region"]
        assert data_hs["center"] == [17.4239, 78.4738]

        # Yamuna Corridor
        resp_ym = await ac.get("/api/v1/study-area?basin=yamuna")
        assert resp_ym.status_code == 200
        data_ym = resp_ym.json()
        assert data_ym["basin"] == "Ganges Basin"
        assert "Delhi" in data_ym["region"]
        assert data_ym["center"] == [28.6289, 77.2495]


@pytest.mark.anyio
async def test_hotspots_and_water_masks_multi_basin():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Hussain Sagar
        masks_hs = await ac.get("/api/v1/water-masks?basin=hussainsagar")
        assert masks_hs.status_code == 200
        assert len(masks_hs.json()["features"]) == 1

        spots_hs = await ac.get("/api/v1/hotspots?basin=hussainsagar")
        assert spots_hs.status_code == 200
        assert len(spots_hs.json()["features"]) == 24

        # Yamuna
        masks_ym = await ac.get("/api/v1/water-masks?basin=yamuna")
        assert masks_ym.status_code == 200
        assert len(masks_ym.json()["features"]) == 1

        spots_ym = await ac.get("/api/v1/hotspots?basin=yamuna")
        assert spots_ym.status_code == 200
        assert len(spots_ym.json()["features"]) == 28


@pytest.mark.anyio
async def test_water_mask_analysis():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/water-masks/analysis?basin=jayakwadi&algorithm=mndwi&threshold=0.12")
        assert resp.status_code == 200
        data = resp.json()
        assert data["basin_id"] == "jayakwadi"
        assert data["detected_surface_area_km2"] > 200.0
        assert "MNDWI" in data["detection_algorithm"]
        assert data["detection_confidence_percent"] >= 97.0

        # Hussain Sagar test
        resp_hs = await ac.get("/api/v1/water-masks/analysis?basin=hussainsagar&algorithm=ndwi")
        assert resp_hs.status_code == 200
        data_hs = resp_hs.json()
        assert data_hs["basin_id"] == "hussainsagar"
        assert data_hs["detected_surface_area_km2"] >= 5.0


@pytest.mark.anyio
async def test_hotspots_water_only():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/hotspots?water_only=true")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["features"]) > 0
        for f in data["features"]:
            assert f["properties"]["is_within_water_body"] is True



