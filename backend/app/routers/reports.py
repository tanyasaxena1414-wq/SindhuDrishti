from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import PollutionReport, ReportStatus
from app.schemas import (
    ReportCreate,
    ReportUpdate,
    ReportResponse,
    ReportDetailResponse,
    ReportListResponse,
    ErrorResponse,
    ReportStatus as SchemaReportStatus,
)
from app.auth import get_current_reviewer, optional_current_reviewer

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post(
    "",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input"},
        422: {"model": ErrorResponse, "description": "Validation error"},
    },
    summary="Submit a new pollution report",
)
async def create_report(
    report_data: ReportCreate,
    db: AsyncSession = Depends(get_db),
):
    """Submit a new citizen pollution report."""
    # Generate unique report ID
    report_id = str(uuid4())

    report = PollutionReport(
        report_id=report_id,
        latitude=report_data.latitude,
        longitude=report_data.longitude,
        description=report_data.description,
        photo_reference=report_data.photo_reference,
        status=ReportStatus.PENDING,
        submitted_at=datetime.now(timezone.utc),
    )

    db.add(report)
    await db.commit()
    await db.refresh(report)

    return report.to_dict()


@router.get(
    "",
    response_model=ReportListResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid query parameters"},
    },
    summary="List pollution reports with filtering and pagination",
)
async def list_reports(
    status_filter: Optional[SchemaReportStatus] = Query(None, alias="status", description="Filter by report status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of reports per page"),
    db: AsyncSession = Depends(get_db),
    reviewer: Optional[dict] = Depends(optional_current_reviewer),
):
    """Retrieve pollution reports with optional status filter and pagination."""
    # Build query
    query = select(PollutionReport)
    count_query = select(func.count(PollutionReport.id))

    if status_filter:
        query = query.where(PollutionReport.status == ReportStatus(status_filter.value))
        count_query = count_query.where(PollutionReport.status == ReportStatus(status_filter.value))

    # Apply ordering (newest first)
    query = query.order_by(PollutionReport.submitted_at.desc())

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    # Execute queries
    result = await db.execute(query)
    reports = result.scalars().all()

    count_result = await db.execute(count_query)
    total = count_result.scalar()

    total_pages = (total + page_size - 1) // page_size

    # Include reviewer notes only for reviewers
    include_reviewer = reviewer is not None

    return ReportListResponse(
        reports=[report.to_dict(include_reviewer_notes=include_reviewer) for report in reports],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/{report_id}",
    response_model=ReportDetailResponse,
    response_model_exclude_none=True,
    responses={
        404: {"model": ErrorResponse, "description": "Report not found"},
    },
    summary="Get a specific pollution report by ID",
)
async def get_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    reviewer: Optional[dict] = Depends(optional_current_reviewer),
):
    """Retrieve a specific pollution report by ID. Reviewers see confidential notes."""
    result = await db.execute(
        select(PollutionReport).where(PollutionReport.report_id == report_id)
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    include_reviewer = reviewer is not None
    if include_reviewer:
        return ReportDetailResponse.model_validate(report, from_attributes=True)
    return ReportResponse.model_validate(report, from_attributes=True)


@router.patch(
    "/{report_id}/status",
    response_model=ReportDetailResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized - reviewer authentication required"},
        403: {"model": ErrorResponse, "description": "Forbidden - insufficient permissions"},
        404: {"model": ErrorResponse, "description": "Report not found"},
        400: {"model": ErrorResponse, "description": "Invalid status transition"},
    },
    summary="Update report status (reviewer only)",
)
async def update_report_status(
    report_id: str,
    update_data: ReportUpdate,
    db: AsyncSession = Depends(get_db),
    reviewer: dict = Depends(get_current_reviewer),
):
    """Update the status of a pollution report. Only authorized reviewers can access this endpoint."""
    result = await db.execute(
        select(PollutionReport).where(PollutionReport.report_id == report_id)
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Validate status transition
    current_status = report.status
    new_status = ReportStatus(update_data.status.value)

    if not _is_valid_transition(current_status, new_status):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition from {current_status.value} to {new_status.value}",
        )

    # Update report
    report.status = new_status
    report.reviewer_notes = update_data.reviewer_notes
    report.reviewed_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(report)

    return report.to_dict(include_reviewer_notes=True)


def _is_valid_transition(current: ReportStatus, new: ReportStatus) -> bool:
    """Validate allowed status transitions."""
    # From pending, can go to verified or rejected
    if current == ReportStatus.PENDING:
        return new in (ReportStatus.VERIFIED, ReportStatus.REJECTED)
    # From verified, can go to rejected (re-verification)
    if current == ReportStatus.VERIFIED:
        return new == ReportStatus.REJECTED
    # From rejected, can go to verified (appeal)
    if current == ReportStatus.REJECTED:
        return new == ReportStatus.VERIFIED
    return False