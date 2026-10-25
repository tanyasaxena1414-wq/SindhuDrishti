from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import PollutionReport, ReportStatus
from app.services.geospatial import geojson_store
from app.schemas_dashboard import (
    DashboardStats,
    CleanupPriorityResponse,
    CleanupPriorityItem,
    CleanupPriorityFactor,
    DataSource,
)


async def get_dashboard_stats(db: AsyncSession) -> DashboardStats:
    """Compute dashboard statistics from actual data."""
    # Get geospatial counts
    hotspots = geojson_store.get_hotspots()
    hotspot_count = len(hotspots.get("features", []))

    water_masks = geojson_store.get_water_masks()
    water_mask_count = len(water_masks.get("features", []))

    # Get citizen report counts
    total_result = await db.execute(select(func.count(PollutionReport.id)))
    total_reports = total_result.scalar() or 0

    pending_result = await db.execute(
        select(func.count(PollutionReport.id)).where(PollutionReport.status == ReportStatus.PENDING)
    )
    pending_reports = pending_result.scalar() or 0

    verified_result = await db.execute(
        select(func.count(PollutionReport.id)).where(PollutionReport.status == ReportStatus.VERIFIED)
    )
    verified_reports = verified_result.scalar() or 0

    rejected_result = await db.execute(
        select(func.count(PollutionReport.id)).where(PollutionReport.status == ReportStatus.REJECTED)
    )
    rejected_reports = rejected_result.scalar() or 0

    # Reports in last 7 days
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_7_result = await db.execute(
        select(func.count(PollutionReport.id)).where(PollutionReport.submitted_at >= seven_days_ago)
    )
    reports_last_7_days = recent_7_result.scalar() or 0

    # Reports in last 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_30_result = await db.execute(
        select(func.count(PollutionReport.id)).where(PollutionReport.submitted_at >= thirty_days_ago)
    )
    reports_last_30_days = recent_30_result.scalar() or 0

    return DashboardStats(
        candidate_hotspots=hotspot_count,
        water_mask_features=water_mask_count,
        citizen_reports_total=total_reports,
        citizen_reports_pending=pending_reports,
        citizen_reports_verified=verified_reports,
        citizen_reports_rejected=rejected_reports,
        reports_last_7_days=reports_last_7_days,
        reports_last_30_days=reports_last_30_days,
    )


def _compute_hotspot_priority(feat: Dict[str, Any]) -> CleanupPriorityItem:
    """Compute priority score for a satellite candidate hotspot."""
    props = feat.get("properties", {})
    geom = feat.get("geometry", {})

    # Extract coordinates (centroid of first ring for Polygon)
    coords = geom.get("coordinates", [])
    centroid_lon, centroid_lat = 0.0, 0.0
    if coords and len(coords) > 0:
        ring = coords[0]
        if ring and isinstance(ring, list) and len(ring) > 0:
            valid_pts = []
            for pt in ring:
                if isinstance(pt, list) and len(pt) >= 2:
                    try:
                        valid_pts.append((float(pt[0]), float(pt[1])))
                    except (ValueError, TypeError):
                        pass
            if valid_pts:
                centroid_lon = sum(pt[0] for pt in valid_pts) / len(valid_pts)
                centroid_lat = sum(pt[1] for pt in valid_pts) / len(valid_pts)

    area_m2 = props.get("area_m2", 0.0)
    count = props.get("count", 0)
    status = props.get("status", "unverified_candidate")

    # Transparent scoring factors
    factors = []

    # Factor 1: Area (larger anomalies may indicate more debris)
    # Normalize: log10(area) / log10(max_expected_area) - capped at 1.0
    import math
    max_area = 100000.0  # 100,000 m² as reference max
    area_score = min(math.log10(area_m2 + 1) / math.log10(max_area + 1), 1.0) if area_m2 > 0 else 0.0
    factors.append(CleanupPriorityFactor(
        name="anomaly_area_m2",
        value=area_m2,
        weight=0.4,
        description="Larger anomaly area may indicate more debris accumulation",
    ))

    # Factor 2: Detection count (more detections = more persistent)
    max_count = 50.0
    count_score = min(count / max_count, 1.0) if count > 0 else 0.0
    factors.append(CleanupPriorityFactor(
        name="detection_count",
        value=float(count),
        weight=0.3,
        description="Number of times anomaly was detected in satellite imagery",
    ))

    # Factor 3: Status confidence (unverified_candidate = base, could be extended)
    status_score = 0.5  # Base for unverified candidates
    if status == "verified":
        status_score = 1.0
    elif status == "rejected":
        status_score = 0.0
    factors.append(CleanupPriorityFactor(
        name="verification_status",
        value=status_score,
        weight=0.3,
        description="Verification status from satellite analysis pipeline",
    ))

    # Weighted composite score
    priority_score = (
        area_score * 0.4 +
        count_score * 0.3 +
        status_score * 0.3
    )

    explanation = (
        f"Satellite-derived candidate hotspot (unverified). "
        f"Area: {area_m2:.1f} m², Detection count: {count}. "
        f"Score derived from: anomaly area (40%), detection persistence (30%), "
        f"verification status (30%). NOT confirmed plastic pollution."
    )

    return CleanupPriorityItem(
        id=f"hotspot-{props.get('candidate', 'unknown')}",
        source=DataSource.SATELLITE,
        latitude=centroid_lat,
        longitude=centroid_lon,
        priority_score=round(priority_score, 3),
        factors=factors,
        explanation=explanation,
        raw_data=props,
    )


def _compute_report_priority(report: PollutionReport) -> CleanupPriorityItem:
    """Compute priority score for a citizen report."""
    factors = []

    # Factor 1: Report status (verified > pending > rejected)
    status_score = 0.5  # pending
    if report.status == ReportStatus.VERIFIED:
        status_score = 1.0
    elif report.status == ReportStatus.REJECTED:
        status_score = 0.0
    factors.append(CleanupPriorityFactor(
        name="report_status",
        value=status_score,
        weight=0.5,
        description="Verification status from human reviewers",
    ))

    # Factor 2: Recency (more recent = higher priority)
    from datetime import datetime, timezone
    days_old = 0.0
    if report.submitted_at:
        delta = datetime.now(timezone.utc) - report.submitted_at.replace(tzinfo=timezone.utc)
        days_old = delta.total_seconds() / 86400.0
    recency_score = max(1.0 - (days_old / 30.0), 0.0)  # Decay over 30 days
    factors.append(CleanupPriorityFactor(
        name="recency_days",
        value=days_old,
        weight=0.3,
        description="More recent reports prioritized (decays over 30 days)",
    ))

    # Factor 3: Description length as proxy for detail/confidence
    desc_len = len(report.description) if report.description else 0
    detail_score = min(desc_len / 500.0, 1.0)
    factors.append(CleanupPriorityFactor(
        name="description_detail",
        value=float(desc_len),
        weight=0.2,
        description="Longer descriptions may indicate more detailed observations",
    ))

    priority_score = (
        status_score * 0.5 +
        recency_score * 0.3 +
        detail_score * 0.2
    )

    explanation = (
        f"Citizen pollution report ({report.status.value}). "
        f"Submitted {days_old:.1f} days ago. "
        f"Score derived from: verification status (50%), recency (30%), "
        f"description detail (20%)."
    )

    return CleanupPriorityItem(
        id=f"report-{report.report_id}",
        source=DataSource.CITIZEN,
        latitude=float(report.latitude),
        longitude=float(report.longitude),
        priority_score=round(priority_score, 3),
        factors=factors,
        explanation=explanation,
        raw_data={
            "description": report.description,
            "photo_reference": report.photo_reference,
            "status": report.status.value,
            "submitted_at": report.submitted_at.isoformat() + "Z" if report.submitted_at else None,
        },
    )


async def get_cleanup_priorities(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
) -> CleanupPriorityResponse:
    """Get combined cleanup priorities from satellite hotspots and citizen reports."""

    # Get all satellite hotspots
    hotspots_data = geojson_store.get_hotspots()
    hotspot_features = hotspots_data.get("features", [])

    # Get all citizen reports
    reports_result = await db.execute(
        select(PollutionReport).order_by(PollutionReport.submitted_at.desc())
    )
    reports = reports_result.scalars().all()

    # Compute priorities for all items
    all_priorities = []

    for feat in hotspot_features:
        priority = _compute_hotspot_priority(feat)
        all_priorities.append(priority)

    for report in reports:
        priority = _compute_report_priority(report)
        all_priorities.append(priority)

    # Sort by priority score descending
    all_priorities.sort(key=lambda x: x.priority_score, reverse=True)

    # Paginate
    total = len(all_priorities)
    offset = (page - 1) * page_size
    paginated = all_priorities[offset:offset + page_size]
    total_pages = (total + page_size - 1) // page_size

    methodology = (
        "Transparent multi-factor scoring. Satellite hotspots: area (40%), "
        "detection count (30%), verification status (30%). Citizen reports: "
        "verification status (50%), recency (30%), description detail (20%). "
        "Scores are relative rankings, not absolute risk assessments."
    )

    limitations = [
        "Satellite hotspots are UNVERIFIED candidate anomalies, not confirmed plastic pollution.",
        "Citizen reports are self-reported and vary in reliability.",
        "Scoring weights are heuristic and not calibrated to ground truth.",
        "No population exposure, ecological sensitivity, or hydrological modeling included.",
        "Results should inform field verification, not direct cleanup deployment.",
    ]

    return CleanupPriorityResponse(
        priorities=paginated,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        methodology=methodology,
        limitations=limitations,
    )