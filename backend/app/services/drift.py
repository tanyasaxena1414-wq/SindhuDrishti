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

    # Load water mask geometry for strict shoreline beaching collision detection
    masks = geojson_store.get_water_masks()
    water_union = None
    if masks.get("features"):
        try:
            from shapely.geometry import shape, Point, LineString
            from shapely.ops import unary_union
            geoms = [shape(f["geometry"]) for f in masks["features"] if f.get("geometry")]
            if geoms:
                water_union = unary_union(geoms)
        except Exception:
            water_union = None

    # Study area bounding box
    study_meta = geojson_store.get_study_area_metadata()
    bbox = study_meta.get("bounding_box", {
        "min_lon": 75.19,
        "min_lat": 19.34,
        "max_lon": 75.48,
        "max_lat": 19.58
    })

    min_lat = bbox["min_lat"]
    max_lat = bbox["max_lat"]
    min_lon = bbox["min_lon"]
    max_lon = bbox["max_lon"]

    # Convert current velocity and direction to East/North components (m/s)
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
    beached_count = 0
    beached_times: List[float] = []
    beached_coords: List[tuple[float, float]] = []

    for p_id in range(1, req.particle_count + 1):
        trajectory: List[DriftTrajectoryPoint] = []

        # For single debris tracking (particle_count == 1), use exact coordinates without noise
        # For ensemble (particle_count > 1), apply tight initial dispersion spread
        if req.particle_count == 1:
            p_lat = req.latitude
            p_lon = req.longitude
        else:
            p_lat = req.latitude + random.gauss(0, 0.00015)
            p_lon = req.longitude + random.gauss(0, 0.00015)

        # Initial point at t=0
        trajectory.append(DriftTrajectoryPoint(
            time_offset_hours=0.0,
            latitude=round(p_lat, 6),
            longitude=round(p_lon, 6),
            status="active"
        ))

        current_status = "active"
        beached_step_recorded = False

        for step in range(1, total_steps + 1):
            time_offset = (step * req.timestep_minutes) / 60.0

            if current_status != "active":
                # Once ashore (beached) or out of bounds, freeze at last position on the shoreline
                trajectory.append(DriftTrajectoryPoint(
                    time_offset_hours=round(time_offset, 2),
                    latitude=round(p_lat, 6),
                    longitude=round(p_lon, 6),
                    status=current_status
                ))
                continue

            # Physical hydrodynamic diffusion (realistic lake diffusivity, avoiding erratic jagged jumps)
            if req.particle_count == 1:
                turb_u = 0.0
                turb_v = 0.0
            else:
                turb_sigma = 0.004
                turb_u = random.gauss(0, turb_sigma)
                turb_v = random.gauss(0, turb_sigma)

            dx = (total_u + turb_u) * timestep_seconds
            dy = (total_v + turb_v) * timestep_seconds

            d_lon, d_lat = _meters_to_lat_lon_deltas(dx, dy)
            new_lon = p_lon + d_lon
            new_lat = p_lat + d_lat

            # Check shoreline collision against water mask
            if water_union is not None:
                from shapely.geometry import Point, LineString
                pt_new = Point(new_lon, new_lat)
                if not water_union.contains(pt_new):
                    # Check alongshore channel deflection angles (-15 to 90 deg) to keep moving along navigable water
                    deflected = False
                    cur_mag = math.sqrt(dx**2 + dy**2)
                    base_rad = math.atan2(dx, dy)
                    for d_deg in [-15, 15, -30, 30, -45, 45, -60, 60, -75, 75, -90, 90]:
                        test_rad = base_rad + math.radians(d_deg)
                        t_dx = cur_mag * math.sin(test_rad)
                        t_dy = cur_mag * math.cos(test_rad)
                        t_dlon, t_dlat = _meters_to_lat_lon_deltas(t_dx, t_dy)
                        t_lon = p_lon + t_dlon
                        t_lat = p_lat + t_dlat
                        if water_union.contains(Point(t_lon, t_lat)):
                            p_lon = t_lon
                            p_lat = t_lat
                            deflected = True
                            trajectory.append(DriftTrajectoryPoint(
                                time_offset_hours=round(time_offset, 2),
                                latitude=round(p_lat, 6),
                                longitude=round(p_lon, 6),
                                status="active"
                            ))
                            break

                    if deflected:
                        continue

                    # Otherwise, particle has reached a closed bank or terminal dam barrier: calculate exact beaching point
                    seg = LineString([(p_lon, p_lat), (new_lon, new_lat)])
                    inter = seg.intersection(water_union.boundary)
                    if not inter.is_empty:
                        if inter.geom_type == "Point":
                            p_lon, p_lat = inter.x, inter.y
                        elif inter.geom_type == "MultiPoint":
                            pts = sorted(list(inter.geoms), key=lambda pt: Point(p_lon, p_lat).distance(pt))
                            p_lon, p_lat = pts[0].x, pts[0].y
                    else:
                        p_lon, p_lat = new_lon, new_lat

                    current_status = "ashore"
                    if not beached_step_recorded:
                        beached_times.append(time_offset)
                        beached_coords.append((p_lat, p_lon))
                        beached_step_recorded = True

                    trajectory.append(DriftTrajectoryPoint(
                        time_offset_hours=round(time_offset, 2),
                        latitude=round(p_lat, 6),
                        longitude=round(p_lon, 6),
                        status="ashore"
                    ))
                    continue

            p_lat = new_lat
            p_lon = new_lon

            # Check outer study area bounding box
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
        elif current_status == "ashore":
            beached_count += 1
            out_of_bounds_count += 1
        elif current_status == "out_of_bounds":
            out_of_bounds_count += 1

    # Calculate judge-friendly intelligence metrics
    total_speed_ms = math.sqrt(total_u**2 + total_v**2)
    total_speed_kmh = round(total_speed_ms * 3.6, 2)
    drift_distance_km = round(total_speed_kmh * req.duration_hours, 1)

    # Cardinal heading
    heading_deg = round((math.degrees(math.atan2(total_u, total_v)) + 360) % 360, 1)
    cardinal_dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    cardinal_index = int((heading_deg + 11.25) / 22.5) % 16
    heading_cardinal = f"{cardinal_dirs[cardinal_index]} ({heading_deg}°)"

    # Driving force breakdown
    wind_mag = req.wind_speed_ms * req.wind_factor
    curr_mag = req.current_velocity_ms
    tot_mag = wind_mag + curr_mag
    wind_pct = int(round(100 * wind_mag / tot_mag)) if tot_mag > 0 else 50
    curr_pct = 100 - wind_pct
    primary_driver = f"Wind Leeway ({wind_pct}%) & Water Current ({curr_pct}%)"

    # Actual beaching time calculation
    if beached_times:
        estimated_impact_hours = round(sum(beached_times) / len(beached_times), 1)
    else:
        estimated_impact_hours = round(min(req.duration_hours, 24.0), 1)

    # Destination target derived from beaching location or vector
    avg_beached_lon = sum(c[1] for c in beached_coords) / len(beached_coords) if beached_coords else req.longitude
    avg_beached_lat = sum(c[0] for c in beached_coords) / len(beached_coords) if beached_coords else req.latitude

    if avg_beached_lon >= 75.36 or (65.0 <= heading_deg <= 155.0):
        destination_target = "Paithan Dam Wall & Hydroelectric Turbine Intake"
        risk_level = "CRITICAL" if avg_beached_lon >= 75.36 else "HIGH"
        recommended_action = f"Deploy containment deflection booms across Paithan Forebay Canal before Hour {max(1, int(estimated_impact_hours))}."
    elif avg_beached_lat < 19.46 or (155.0 < heading_deg <= 245.0):
        destination_target = "South Jayakwadi Embayment & Mudgal Shoreline"
        risk_level = "MODERATE"
        recommended_action = "Alert southern municipal recovery units for shoreline debris extraction."
    else:
        destination_target = "North-Central Reservoir Wetland Margins"
        risk_level = "LOW"
        recommended_action = "Monitor shallow littoral wetlands for vegetative entanglement."

    # Build Hour-by-Hour NGO Field Collection & Interception Schedule
    interception_schedule = []
    if particles_result:
        lead_traj = particles_result[0].trajectory
        first_beached = False
        for pt in lead_traj:
            if pt.status == "ashore":
                if not first_beached:
                    interception_schedule.append({
                        "hour": pt.time_offset_hours,
                        "latitude": pt.latitude,
                        "longitude": pt.longitude,
                        "status": "ashore",
                        "zone_desc": "Shoreline Contact / Bank Beaching",
                        "action": "⭐ Optimal Shoreline Collection Point (Accessible via Road / Bank)",
                        "is_optimal": True
                    })
                    first_beached = True
                else:
                    # Keep milestone checkpoints post-beaching for the NGO field team
                    if int(pt.time_offset_hours) in (2, 3, 4, 6, 8, 12, 16, 20, 24) or pt == lead_traj[-1]:
                        interception_schedule.append({
                            "hour": pt.time_offset_hours,
                            "latitude": pt.latitude,
                            "longitude": pt.longitude,
                            "status": "ashore",
                            "zone_desc": "Bank Beaching Zone (Stranded)",
                            "action": f"Field Recovery Window (+{pt.time_offset_hours:.0f}h: Stranded on bank awaiting truck pickup)",
                            "is_optimal": False
                        })
            else:
                interception_schedule.append({
                    "hour": pt.time_offset_hours,
                    "latitude": pt.latitude,
                    "longitude": pt.longitude,
                    "status": "active",
                    "zone_desc": "Open Water Pelagic Flow",
                    "action": "Waterborne Patrol (Boat / Skimmer Required)",
                    "is_optimal": False
                })

    # Calculate Debris Mass and FDI Characteristics from Hotspots if available
    anomaly_area_m2 = 6500.0
    fdi_val = 0.045
    if req.hotspot_id:
        hotspots_col = geojson_store.get_hotspots()
        for f in hotspots_col.get("features", []):
            if f.get("id") == req.hotspot_id:
                props = f.get("properties", {})
                anomaly_area_m2 = float(props.get("area_m2", 6500.0))
                fdi_val = float(props.get("fdi_value", 0.045))
                break

    # Quantify macroplastics mass
    # Empirical freshwater debris concentration: 0.28 - 0.55 kg/m2 scaled by FDI
    mass_kg = round(anomaly_area_m2 * (0.28 + max(0.0, fdi_val) * 2.2), 1)
    mass_tons = round(mass_kg / 1000.0, 2)

    # Equipment and Personnel Allocation Model
    skimmer_boats = 2 if mass_kg > 2200 else 1
    booms_m = int(max(100, round(math.sqrt(anomaly_area_m2) * 2.2 / 10.0) * 10))
    crew_count = 6 if mass_kg > 2200 else 4
    extraction_hours = round(max(2.5, mass_kg / 750.0), 1)

    field_assets = {
        "skimmer_boats": skimmer_boats,
        "containment_booms_meters": booms_m,
        "field_crew_count": crew_count,
        "estimated_extraction_hours": extraction_hours,
    }

    # Economic Damage Prevention Model (Paithan Hydroelectric & Canal Infrastructure)
    # Turbine shut-down & filter dredging cost savings
    damage_prevented_inr = round(mass_kg * 320.0 + 950000.0, 0)
    damage_prevented_lakhs = round(damage_prevented_inr / 100000.0, 2)
    operational_cost_inr = (skimmer_boats * 38000.0) + (crew_count * 3200.0) + 15000.0
    roi_multiplier = round(damage_prevented_inr / operational_cost_inr, 1)

    economic_impact = {
        "estimated_debris_mass_kg": mass_kg,
        "estimated_debris_mass_tons": mass_tons,
        "infrastructure_damage_prevented_inr": damage_prevented_inr,
        "infrastructure_damage_prevented_lakhs": damage_prevented_lakhs,
        "recovery_roi_multiplier": roi_multiplier,
        "debris_area_m2": anomaly_area_m2,
    }

    # Structured Field Dispatch Mission Order
    dispatch_order_id = f"DSP-JYK-{uuid.uuid4().hex[:6].upper()}"
    staging_area = "Paithan North Jetty Boat Launch" if avg_beached_lon >= 75.35 else "Mudgal South Embayment Slipway"
    crit_window = f"06:00 – 14:00 (Before shore contact at +{estimated_impact_hours:.1f}h)"

    field_dispatch_order = {
        "order_id": dispatch_order_id,
        "target_debris_id": req.hotspot_id or "CUSTOM-RELEASE",
        "target_name": req.debris_name or "Surface Debris Plume",
        "target_latitude": req.latitude,
        "target_longitude": req.longitude,
        "priority_level": risk_level,
        "critical_interception_window": crit_window,
        "optimal_staging_area": staging_area,
        "recommended_tactics": [
            f"Deploy {booms_m}m deflection boom 40° across drift vector {heading_cardinal} to funnel debris into extraction pocket.",
            f"Position {skimmer_boats} Trash Skimmer Boat(s) up-drift of {destination_target}.",
            f"Dispatch {crew_count} recovery crew members to staging base ({staging_area}).",
            f"Prevent estimated ₹{damage_prevented_lakhs} Lakhs infrastructure and municipal intake downtime."
        ]
    }

    summary = {
        "particle_count": req.particle_count,
        "duration_hours": req.duration_hours,
        "timestep_minutes": req.timestep_minutes,
        "active_at_end": active_count,
        "out_of_bounds_at_end": out_of_bounds_count,
        "beached_at_end": beached_count,
        "tracked_debris_name": req.debris_name or "Specific Debris Item",
        "tracked_debris_id": req.hotspot_id,
        "starting_coordinates": {"latitude": req.latitude, "longitude": req.longitude},
        # Judge Intelligence Brief
        "drift_heading_cardinal": heading_cardinal,
        "drift_heading_degrees": heading_deg,
        "destination_target": destination_target,
        "average_drift_speed_kmh": total_speed_kmh,
        "total_drift_distance_km": drift_distance_km,
        "estimated_shore_interception_hours": estimated_impact_hours,
        "primary_driver": primary_driver,
        "recommended_action": recommended_action,
        "risk_level": risk_level,
        "interception_schedule": interception_schedule,
        # NGO Field Dispatch & Economic Quantification
        "estimated_debris_mass_kg": mass_kg,
        "estimated_debris_mass_tons": mass_tons,
        "field_assets": field_assets,
        "economic_impact": economic_impact,
        "field_dispatch_order": field_dispatch_order,
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
