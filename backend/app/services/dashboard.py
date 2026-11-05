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


def _compute_hotspot_priority(feat: Dict[str, Any], index: int = 0) -> CleanupPriorityItem:
    """Compute priority score for a satellite candidate hotspot."""
    props = feat.get("properties", {})
    geom = feat.get("geometry", {})

    # Extract coordinates recursively for both Polygon and MultiPolygon
    coords = geom.get("coordinates", [])
    valid_pts: List[tuple[float, float]] = []

    def _extract_pts(c: Any) -> None:
        if isinstance(c, (list, tuple)) and len(c) >= 2 and isinstance(c[0], (int, float)) and isinstance(c[1], (int, float)):
            valid_pts.append((float(c[0]), float(c[1])))
        elif isinstance(c, (list, tuple)):
            for sub in c:
                _extract_pts(sub)

    _extract_pts(coords)
    centroid_lon, centroid_lat = 0.0, 0.0
    if valid_pts:
        centroid_lon = round(sum(pt[0] for pt in valid_pts) / len(valid_pts), 6)
        centroid_lat = round(sum(pt[1] for pt in valid_pts) / len(valid_pts), 6)

    area_m2 = props.get("area_m2", 0.0)
    count = props.get("count", 0)
    status = props.get("status", "unverified_candidate")

    # Transparent scoring factors
    factors = []

    # Factor 1: Surface Area Accumulation (scaled across 5,000 to 50,000 m² range)
    area_score = min(max((area_m2 - 5000.0) / 45000.0, 0.1), 1.0) if area_m2 > 0 else 0.1
    factors.append(CleanupPriorityFactor(
        name="anomaly_area_m2",
        value=area_m2,
        weight=0.4,
        description="Accumulated surface area from multi-spectral footprint",
    ))

    # Factor 2: Detection Persistence (scaled across 15 to 80 passes)
    count_score = min(max((count - 15.0) / 65.0, 0.15), 1.0) if count > 0 else 0.15
    factors.append(CleanupPriorityFactor(
        name="detection_count",
        value=float(count),
        weight=0.3,
        description="Multi-pass temporal persistence across satellite acquisitions",
    ))

    # Factor 3: Spectral Discrimination & Verification Confidence
    spectral_class = props.get("spectral_class", "candidate_plastic_debris")
    fdi_val = props.get("fdi_value", 0.04)
    conf = props.get("confidence_score", 0.8)

    # Dynamic spectral confidence reflecting FDI departure above baseline
    fdi_norm = min(max(fdi_val / 0.075, 0.2), 1.0)
    spectral_score = round((conf * 0.6) + (fdi_norm * 0.4), 3)

    if status == "verified":
        spectral_score = 1.0
    elif status == "rejected":
        spectral_score = 0.0

    factors.append(CleanupPriorityFactor(
        name="spectral_confidence",
        value=spectral_score,
        weight=0.3,
        description=f"Spectral discrimination ({spectral_class.replace('_', ' ')}, FDI: {fdi_val:+.4f}) & validation",
    ))

    # Weighted composite score
    priority_score = (
        area_score * 0.4 +
        count_score * 0.3 +
        spectral_score * 0.3
    )

    explanation = (
        f"Satellite candidate hotspot (unverified: {spectral_class.replace('_', ' ')}). "
        f"Area: {area_m2:.1f} m², Detection count: {count}, FDI: {fdi_val:+.4f}. "
        f"Score derived from: anomaly area (40%), detection persistence (30%), "
        f"spectral confidence (30%). NOT confirmed plastic pollution."
    )

    hotspot_id = props.get("id") or f"hotspot-{index + 1}"

    return CleanupPriorityItem(
        id=str(hotspot_id),
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

    for i, feat in enumerate(hotspot_features):
        priority = _compute_hotspot_priority(feat, index=i)
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