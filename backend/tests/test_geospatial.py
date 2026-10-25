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
