import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.anyio
async def test_drift_simulation_success(client):
    """Test successful drift simulation execution with default parameters."""
    response = await client.post(
        "/api/v1/drift/simulate",
        json={
            "latitude": 19.4567,
            "longitude": 75.3456,
            "duration_hours": 12.0,
            "timestep_minutes": 60.0,
            "particle_count": 5,
            "random_seed": 42,
            "debris_type": "rigid_plastic",
        },
    )
    assert response.status_code == 200
    data = response.json()

    assert "simulation_id" in data
    assert data["simulation_id"].startswith("drift-sim-")
    assert "timestamp" in data
    assert "parameters" in data
    assert "particles" in data
    assert len(data["particles"]) == 5
    assert "summary" in data
    assert data["summary"]["particle_count"] == 5
    # Scientific drift intelligence
    assert "drift_heading_cardinal" in data["summary"]
    assert "destination_target" in data["summary"]
    assert "average_drift_speed_kmh" in data["summary"]
    assert "total_drift_distance_km" in data["summary"]
    assert "recommended_action" in data["summary"]
    assert "risk_level" in data["summary"]
    assert "disclaimer" in data
    assert "HYDRODYNAMIC" in data["disclaimer"] or "SIMULATION" in data["disclaimer"]
    assert "limitations" in data
    assert isinstance(data["limitations"], list)

    # Check particle trajectory structure
    first_particle = data["particles"][0]
    assert "particle_id" in first_particle
    assert first_particle["particle_id"] == 1
    assert "trajectory" in first_particle
    assert len(first_particle["trajectory"]) > 0

    first_point = first_particle["trajectory"][0]
    assert first_point["time_offset_hours"] == 0.0
    assert "latitude" in first_point
    assert "longitude" in first_point
    assert first_point["status"] == "active"


@pytest.mark.anyio
async def test_drift_simulation_deterministic(client):
    """Test that same random seed produces identical trajectories."""
    payload = {
        "latitude": 19.4567,
        "longitude": 75.3456,
        "duration_hours": 6.0,
        "timestep_minutes": 60.0,
        "particle_count": 3,
        "random_seed": 123,
    }

    res1 = await client.post("/api/v1/drift/simulate", json=payload)
    res2 = await client.post("/api/v1/drift/simulate", json=payload)

    assert res1.status_code == 200
    assert res2.status_code == 200

    data1 = res1.json()
    data2 = res2.json()

    # Compare particle 1 final lat/lon
    p1_lat = data1["particles"][0]["trajectory"][-1]["latitude"]
    p2_lat = data2["particles"][0]["trajectory"][-1]["latitude"]
    assert p1_lat == p2_lat


@pytest.mark.anyio
async def test_drift_simulation_validation_errors(client):
    """Test validation errors for invalid request parameters."""
    # Invalid latitude out of range
    response = await client.post(
        "/api/v1/drift/simulate",
        json={
            "latitude": 95.0,  # Invalid (>90)
            "longitude": 75.3456,
        },
    )
    assert response.status_code == 422

    # Invalid particle count (too high)
    response = await client.post(
        "/api/v1/drift/simulate",
        json={
            "latitude": 19.4567,
            "longitude": 75.3456,
            "particle_count": 500,  # Max is 100
        },
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_debris_typology_leeway_physics(client):
    """Test that rigid plastics (high windage) drift differently from submerged ghost nets."""
    base_payload = {
        "latitude": 19.495,
        "longitude": 75.335,
        "duration_hours": 12.0,
        "timestep_minutes": 60.0,
        "particle_count": 1,
        "wind_speed_ms": 6.0,
        "wind_direction_deg": 90.0,
        "use_live_weather": False,
        "random_seed": 42,
    }

    # 1. Rigid plastic
    resp_rigid = await client.post(
        "/api/v1/drift/simulate",
        json={**base_payload, "debris_type": "rigid_plastic"}
    )
    # 2. Submerged ghost net
    resp_net = await client.post(
        "/api/v1/drift/simulate",
        json={**base_payload, "debris_type": "ghost_net"}
    )

    assert resp_rigid.status_code == 200
    assert resp_net.status_code == 200

    data_rigid = resp_rigid.json()
    data_net = resp_net.json()

    # Rigid plastic should have higher leeway factor and greater total displacement under strong wind
    assert data_rigid["summary"]["downwind_leeway_factor"] > data_net["summary"]["downwind_leeway_factor"]
    rigid_end = data_rigid["particles"][0]["trajectory"][-1]
    net_end = data_net["particles"][0]["trajectory"][-1]

    # Trajectories must diverge due to differing physical windage
    assert (rigid_end["latitude"], rigid_end["longitude"]) != (net_end["latitude"], net_end["longitude"])


@pytest.mark.anyio
async def test_auto_debris_classification_and_defaults(client):
    """Test automated typology determination from hotspot metadata, default profile fallback, and overrides."""
    # 1. Auto classification for known pelagic windrow (candidate plastic)
    res_auto = await client.post(
        "/api/v1/drift/simulate",
        json={
            "latitude": 19.495,
            "longitude": 75.335,
            "duration_hours": 6.0,
            "timestep_minutes": 60.0,
            "particle_count": 1,
            "hotspot_id": "pelagic-windrow-1",
            "debris_type": "auto",
        },
    )
    assert res_auto.status_code == 200
    data_auto = res_auto.json()
    meta_auto = data_auto["summary"]["classification_metadata"]
    assert meta_auto["is_auto_classified"] is True
    assert "scientific_caveat" in meta_auto
    assert meta_auto["downwind_leeway_factor"] > 0

    # 2. Custom release without hotspot metadata falls back cleanly to default profile
    res_custom = await client.post(
        "/api/v1/drift/simulate",
        json={
            "latitude": 19.495,
            "longitude": 75.335,
            "duration_hours": 6.0,
            "timestep_minutes": 60.0,
            "particle_count": 1,
            "hotspot_id": "custom-release",
            "debris_type": "auto",
        },
    )
    assert res_custom.status_code == 200
    data_custom = res_custom.json()
    meta_custom = data_custom["summary"]["classification_metadata"]
    assert meta_custom["is_default_profile"] is True
    assert meta_custom["category_id"] == "unclassified_debris"
    assert "Default Profile" in meta_custom["category_label"]

    # 3. Manual override overrides auto-detection and flags is_auto_classified=False
    res_override = await client.post(
        "/api/v1/drift/simulate",
        json={
            "latitude": 19.495,
            "longitude": 75.335,
            "duration_hours": 6.0,
            "timestep_minutes": 60.0,
            "particle_count": 1,
            "hotspot_id": "pelagic-windrow-1",
            "debris_type": "ghost_net",
        },
    )
    assert res_override.status_code == 200
    data_override = res_override.json()
    meta_override = data_override["summary"]["classification_metadata"]
    assert meta_override["is_auto_classified"] is False
    assert meta_override["category_id"] == "ghost_net"


@pytest.mark.anyio
async def test_drift_gpx_export(client):
    """Test standard GPX 1.1 file export endpoint."""
    response = await client.post(
        "/api/v1/drift/export/gpx",
        json={
            "latitude": 19.495,
            "longitude": 75.335,
            "duration_hours": 6.0,
            "timestep_minutes": 60.0,
            "particle_count": 1,
            "debris_name": "Test Hotspot",
        },
    )
    assert response.status_code == 200
    assert "application/gpx+xml" in response.headers["content-type"]
    text = response.text
    assert "<?xml version" in text
    assert "<gpx" in text
    assert "<wpt" in text
    assert "<rte" in text
    assert "</gpx>" in text
