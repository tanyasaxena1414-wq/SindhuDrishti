import math
import random
from datetime import datetime, timezone
from typing import Dict, Any, List
import uuid

from app.schemas_drift import (
    DriftSimulateRequest,
    DriftSimulateResponse,
    ParticleTrajectory,
    DriftTrajectoryPoint,
)
from app.services.geospatial import geojson_store

# Approximate conversion factors at latitude ~19.45° N
# 1 degree latitude ≈ 111,132 meters
# 1 degree longitude ≈ 111,132 * cos(lat) meters ≈ 104,800 meters
METERS_PER_DEG_LAT = 111132.0
METERS_PER_DEG_LON = 104800.0


def _meters_to_lat_lon_deltas(dx_meters: float, dy_meters: float) -> tuple[float, float]:
    """Convert East (dx) and North (dy) offsets in meters to delta longitude and delta latitude."""
    d_lat = dy_meters / METERS_PER_DEG_LAT
    d_lon = dx_meters / METERS_PER_DEG_LON
    return d_lon, d_lat


def run_drift_simulation(req: DriftSimulateRequest) -> DriftSimulateResponse:
    """
    Execute a reproducible particle-based illustrative drift simulation.

    Model Mechanics:
    - Combines base water current vector and wind leeway vector.
    - Applies Gaussian random dispersion at each timestep using a fixed random seed.
    - Checks bounding box and water mask domain limits.
    """
    # Initialize random seed for reproducibility
    if req.random_seed is not None:
        random.seed(req.random_seed)

    # Get study area bounding box for out_of_bounds checking
    study_meta = geojson_store.get_study_area_metadata()
    bbox = study_meta.get("bounding_box", {
        "min_lon": 75.19,
        "min_lat": 19.34,
        "max_lon": 75.48,
        "max_lat": 19.58
    })

    min_lat = bbox["min_lat"] - 0.05  # slightly padded buffer
    max_lat = bbox["max_lat"] + 0.05
    min_lon = bbox["min_lon"] - 0.05
    max_lon = bbox["max_lon"] + 0.05

    # Convert current velocity and direction to East/North components (m/s)
    # Direction in degrees (0 = North, 90 = East, 180 = South, 270 = West)
    curr_dir_rad = math.radians(req.current_direction_deg)
    curr_u = req.current_velocity_ms * math.sin(curr_dir_rad)  # East component
    curr_v = req.current_velocity_ms * math.cos(curr_dir_rad)  # North component

    # Convert wind velocity and direction to East/North components (m/s)
    wind_dir_rad = math.radians(req.wind_direction_deg)
    wind_u = req.wind_speed_ms * math.sin(wind_dir_rad)
    wind_v = req.wind_speed_ms * math.cos(wind_dir_rad)

    # Effective leeway velocity from wind
    wind_drift_u = wind_u * req.wind_factor
    wind_drift_v = wind_v * req.wind_factor

    total_u = curr_u + wind_drift_u
    total_v = curr_v + wind_drift_v

    timestep_seconds = req.timestep_minutes * 60.0
    total_steps = int((req.duration_hours * 3600.0) / timestep_seconds)

    particles_result: List[ParticleTrajectory] = []
    active_count = 0
    out_of_bounds_count = 0

    for p_id in range(1, req.particle_count + 1):
        trajectory: List[DriftTrajectoryPoint] = []

        # Add small initial random perturbation to ensemble particles (dispersion spread)
        p_lat = req.latitude + random.gauss(0, 0.0005)
        p_lon = req.longitude + random.gauss(0, 0.0005)

        # Initial point at t=0
        trajectory.append(DriftTrajectoryPoint(
            time_offset_hours=0.0,
            latitude=round(p_lat, 6),
            longitude=round(p_lon, 6),
            status="active"
        ))

        current_status = "active"

        for step in range(1, total_steps + 1):
            time_offset = (step * req.timestep_minutes) / 60.0

            if current_status != "active":
                # Once out of bounds or ashore, freeze at last position
                trajectory.append(DriftTrajectoryPoint(
                    time_offset_hours=round(time_offset, 2),
                    latitude=round(p_lat, 6),
                    longitude=round(p_lon, 6),
                    status=current_status
                ))
                continue

            # Distance moved in this timestep (meters)
            # Add stochastic turbulence / random walk component (diffusion)
            turb_u = random.gauss(0, 0.05) * math.sqrt(req.timestep_minutes)
            turb_v = random.gauss(0, 0.05) * math.sqrt(req.timestep_minutes)

            dx = (total_u + turb_u) * timestep_seconds
            dy = (total_v + turb_v) * timestep_seconds

            d_lon, d_lat = _meters_to_lat_lon_deltas(dx, dy)

            p_lat += d_lat
            p_lon += d_lon

            # Check boundary conditions
            if not (min_lat <= p_lat <= max_lat and min_lon <= p_lon <= max_lon):
                current_status = "out_of_bounds"

            trajectory.append(DriftTrajectoryPoint(
                time_offset_hours=round(time_offset, 2),
                latitude=round(p_lat, 6),
                longitude=round(p_lon, 6),
                status=current_status
            ))

        particles_result.append(ParticleTrajectory(
            particle_id=p_id,
            trajectory=trajectory,
            final_status=current_status
        ))

        if current_status == "active":
            active_count += 1
        elif current_status == "out_of_bounds":
            out_of_bounds_count += 1

    summary = {
        "particle_count": req.particle_count,
        "duration_hours": req.duration_hours,
        "timestep_minutes": req.timestep_minutes,
        "active_at_end": active_count,
        "out_of_bounds_at_end": out_of_bounds_count,
        "starting_coordinates": {"latitude": req.latitude, "longitude": req.longitude},
    }

    disclaimer = (
        "ILLUSTRATIVE SIMULATION ONLY. Results are computed using a simplified kinematic particle-tracking "
        "model with configurable water current and wind leeway vectors. This simulation is NOT calibrated or "
        "validated for operational prediction, and measured hydrodynamic current, discharge, and bathymetry data are unavailable."
    )

    limitations = [
        "Model uses uniform simplified velocity and wind vectors without spatial hydrodynamic flow fields or bathymetric steering.",
        "Particles crossing study area bounds are flagged as out_of_bounds; landmass masking is simplified.",
        "Satellite candidate hotspots represent unverified anomaly locations, not confirmed debris sources.",
        "Not validated for emergency response or operational drift forecasting.",
    ]

    return DriftSimulateResponse(
        simulation_id=f"drift-sim-{uuid.uuid4().hex[:8]}",
        timestamp=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        parameters=req.model_dump(),
        particles=particles_result,
        summary=summary,
        disclaimer=disclaimer,
        limitations=limitations,
    )
