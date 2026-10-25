from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.dashboard import get_dashboard_stats, get_cleanup_priorities
from app.schemas_dashboard import DashboardStats, CleanupPriorityResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get(
    "/stats",
    response_model=DashboardStats,
    summary="Get dashboard summary statistics",
)
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    """
    Return summary statistics for the dashboard.

    Includes counts for:
    - Satellite candidate hotspots and water masks
    - Citizen reports by status (pending, verified, rejected)
    - Recent report activity (7-day and 30-day windows)
    """
    return await get_dashboard_stats(db)


@router.get(
    "/cleanup/priorities",
    response_model=CleanupPriorityResponse,
    summary="Get cleanup priority rankings",
)
async def cleanup_priorities(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Results per page"),
    db: AsyncSession = Depends(get_db),
):
    """
    Return combined cleanup priorities from satellite hotspots and citizen reports.

    Each entry includes:
    - Priority score (0-1, higher = higher priority)
    - Contributing factors with weights and explanations
    - Overall explanation of the score
    - Raw data for transparency

    Methodology and limitations are included in the response.
    Supports pagination.
    """
    return await get_cleanup_priorities(db, page=page, page_size=page_size)