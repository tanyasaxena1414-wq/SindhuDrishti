from fastapi import APIRouter, HTTPException
from app.schemas_drift import DriftSimulateRequest, DriftSimulateResponse
from app.services.drift import run_drift_simulation

router = APIRouter(prefix="/drift", tags=["drift"])


@router.post(
    "/simulate",
    response_model=DriftSimulateResponse,
    summary="Run an illustrative particle drift simulation",
)
async def simulate_drift(req: DriftSimulateRequest):
    """
    Execute an illustrative kinematic particle drift simulation for debris or pollutant tracking.

    - Accepts starting coordinates, duration, timestep, particle count, and environmental vectors (currents, wind).
    - Returns deterministic particle trajectories, timestamps, final statuses, metadata, and scientific disclaimers.
    - Uses a reproducible random seed.
    """
    try:
        result = run_drift_simulation(req)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Simulation failed: {str(e)}")
