from fastapi import APIRouter, HTTPException, Response
from app.schemas_drift import DriftSimulateRequest, DriftSimulateResponse
from app.services.drift import run_drift_simulation, generate_gpx_content

router = APIRouter(prefix="/drift", tags=["drift"])


@router.post(
    "/simulate",
    response_model=DriftSimulateResponse,
    summary="Run calibrated Eulerian-Lagrangian hydrodynamic drift simulation",
)
async def simulate_drift(req: DriftSimulateRequest):
    """
    Execute a calibrated Eulerian-Lagrangian hydrodynamic drift simulation for debris tracking.

    - 2D Depth-averaged reservoir flow field along Godavari thalweg.
    - Dynamic hourly atmospheric wind forcing from Open-Meteo ECMWF/GFS forecast.
    - Allen & Plourde leeway dynamics for specific debris classes (bottles, hyacinth, film, nets).
    - Okubo horizontal turbulent diffusion with confidence bounds.
    """
    try:
        result = run_drift_simulation(req)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Simulation failed: {str(e)}")


@router.post(
    "/export/gpx",
    summary="Export drift simulation trajectory and waypoints as standard GPX for GPS navigation",
)
async def export_drift_gpx(req: DriftSimulateRequest):
    """Generate and download a standard GPX 1.1 file for handheld GPS and smartphone navigation."""
    try:
        sim = run_drift_simulation(req)
        lead_traj = sim.particles[0].trajectory if sim.particles else []
        schedule = sim.summary.get("interception_schedule", [])
        target_name = req.debris_name or req.hotspot_id or "Surface Debris"

        gpx_xml = generate_gpx_content(
            simulation_id=sim.simulation_id,
            target_name=target_name,
            lead_trajectory=lead_traj,
            schedule_waypoints=schedule,
        )

        filename = f"sindhudrishti_{sim.simulation_id}.gpx"
        return Response(
            content=gpx_xml,
            media_type="application/gpx+xml",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"GPX export failed: {str(e)}")
