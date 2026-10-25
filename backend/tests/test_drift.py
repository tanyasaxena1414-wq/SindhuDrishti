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
    assert "disclaimer" in data
    assert "ILLUSTRATIVE SIMULATION" in data["disclaimer"]
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
            "particle_count": 500,  # Max allowed is 100
        },
    )
    assert response.status_code == 422

    # Invalid duration (<= 0)
    response = await client.post(
        "/api/v1/drift/simulate",
        json={
            "latitude": 19.4567,
            "longitude": 75.3456,
            "duration_hours": 0.0,
        },
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_drift_simulation_boundary_conditions(client):
    """Test boundary conditions for particles drifting out of study area bounds."""
    # Start near edge with high velocity pointing outwards
    response = await client.post(
        "/api/v1/drift/simulate",
        json={
            "latitude": 19.58,  # Near northern bound
            "longitude": 75.48,  # Near eastern bound
            "duration_hours": 48.0,  # Long duration
            "timestep_minutes": 60.0,
            "particle_count": 5,
            "current_velocity_ms": 1.5,  # High current
            "current_direction_deg": 45.0,  # Northeast (out of bounds)
            "random_seed": 42,
        },
    )
    assert response.status_code == 200
    data = response.json()

    # Verify out_of_bounds status appears for at least some particles
    statuses = [p["final_status"] for p in data["particles"]]
    assert "out_of_bounds" in statuses or any(
        pt["status"] == "out_of_bounds" for p in data["particles"] for pt in p["trajectory"]
    )


@pytest.mark.anyio
async def test_drift_simulation_zero_velocity(client):
    """Test drift simulation with zero current and wind velocity (stationary particles with minor diffusion)."""
    response = await client.post(
        "/api/v1/drift/simulate",
        json={
            "latitude": 19.4567,
            "longitude": 75.3456,
            "duration_hours": 6.0,
            "timestep_minutes": 60.0,
            "particle_count": 3,
            "current_velocity_ms": 0.0,
            "wind_speed_ms": 0.0,
            "random_seed": 42,
        },
    )
    assert response.status_code == 200
    data = response.json()

    for p in data["particles"]:
        for pt in p["trajectory"]:
            # Should remain very close to starting coordinates (within ~0.01 deg due to minor random diffusion)
            assert abs(pt["latitude"] - 19.4567) < 0.05
            assert abs(pt["longitude"] - 75.3456) < 0.05
            assert pt["status"] == "active"


@pytest.mark.anyio
async def test_drift_simulation_short_duration(client):
    """Test drift simulation with short duration and high timestep resolution."""
    response = await client.post(
        "/api/v1/drift/simulate",
        json={
            "latitude": 19.4567,
            "longitude": 75.3456,
            "duration_hours": 1.0,
            "timestep_minutes": 10.0,
            "particle_count": 2,
            "random_seed": 42,
        },
    )
    assert response.status_code == 200
    data = response.json()

    # 1 hour / 10 mins = 6 steps + initial point (t=0) = 7 trajectory points
    for p in data["particles"]:
        assert len(p["trajectory"]) == 7
        assert p["trajectory"][0]["time_offset_hours"] == 0.0
        assert p["trajectory"][-1]["time_offset_hours"] == 1.0
        assert p["final_status"] == "active"
