import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models import PollutionReport, ReportStatus
from tests.conftest import TestingSessionLocal


@pytest.mark.anyio
async def test_dashboard_stats_empty_database(client):
    """Test dashboard stats with empty database."""
    response = await client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    data = response.json()

    # Should have satellite data
    assert data["candidate_hotspots"] == 141
    assert data["water_mask_features"] == 2

    # Citizen reports should be zero
    assert data["citizen_reports_total"] == 0
    assert data["citizen_reports_pending"] == 0
    assert data["citizen_reports_verified"] == 0
    assert data["citizen_reports_rejected"] == 0
    assert data["reports_last_7_days"] == 0
    assert data["reports_last_30_days"] == 0


@pytest.mark.anyio
async def test_dashboard_stats_with_reports(client):
    """Test dashboard stats with various report statuses."""
    async with TestingSessionLocal() as session:
        now = datetime.now(timezone.utc)
        reports = [
            PollutionReport(
                report_id="dash-pending-1",
                latitude="19.4567",
                longitude="75.3456",
                description="Pending report one",
                status=ReportStatus.PENDING,
                submitted_at=now - timedelta(days=2),
            ),
            PollutionReport(
                report_id="dash-pending-2",
                latitude="19.5000",
                longitude="75.4000",
                description="Pending report two",
                status=ReportStatus.PENDING,
                submitted_at=now - timedelta(days=5),
            ),
            PollutionReport(
                report_id="dash-verified-1",
                latitude="19.5500",
                longitude="75.4500",
                description="Verified report one",
                status=ReportStatus.VERIFIED,
                submitted_at=now - timedelta(days=10),
            ),
            PollutionReport(
                report_id="dash-rejected-1",
                latitude="19.6000",
                longitude="75.5000",
                description="Rejected report one",
                status=ReportStatus.REJECTED,
                submitted_at=now - timedelta(days=40),  # Outside 30-day window
            ),
        ]
        session.add_all(reports)
        await session.commit()

    response = await client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    data = response.json()

    assert data["citizen_reports_total"] == 4
    assert data["citizen_reports_pending"] == 2
    assert data["citizen_reports_verified"] == 1
    assert data["citizen_reports_rejected"] == 1
    assert data["reports_last_7_days"] == 2  # Two reports within 7 days
    assert data["reports_last_30_days"] == 3  # Three reports within 30 days (excluding 40-day-old)


@pytest.mark.anyio
async def test_cleanup_priorities_empty_database(client):
    """Test cleanup priorities with no citizen reports."""
    response = await client.get("/api/v1/dashboard/cleanup/priorities")
    assert response.status_code == 200
    data = response.json()

    assert data["total"] == 141  # 129 shoreline + 12 open-water pelagic windrows
    assert len(data["priorities"]) == 20  # Default page size
    assert data["page"] == 1
    assert data["page_size"] == 20
    assert data["total_pages"] == 8  # 141 / 20 = 7.05 -> 8 pages

    # Check structure
    first = data["priorities"][0]
    assert "id" in first
    assert first["source"] == "satellite_candidate_hotspot"
    assert "priority_score" in first
    assert isinstance(first["factors"], list)
    assert len(first["factors"]) == 3
    assert "explanation" in first
    assert "raw_data" in first

    # Check methodology and limitations
    assert "methodology" in data
    assert "limitations" in data
    assert isinstance(data["limitations"], list)
    assert len(data["limitations"]) >= 3
    assert any("UNVERIFIED" in lim or "unverified" in lim.lower() for lim in data["limitations"])


@pytest.mark.anyio
async def test_cleanup_priorities_with_reports(client):
    """Test cleanup priorities with citizen reports mixed in."""
    async with TestingSessionLocal() as session:
        now = datetime.now(timezone.utc)
        reports = [
            PollutionReport(
                report_id="priority-verified-recent",
                latitude="19.4567",
                longitude="75.3456",
                description="Verified recent report with detailed description of pollution",
                status=ReportStatus.VERIFIED,
                submitted_at=now - timedelta(days=1),
            ),
            PollutionReport(
                report_id="priority-pending-old",
                latitude="19.5000",
                longitude="75.4000",
                description="Short",
                status=ReportStatus.PENDING,
                submitted_at=now - timedelta(days=60),
            ),
        ]
        session.add_all(reports)
        await session.commit()

    response = await client.get("/api/v1/dashboard/cleanup/priorities?page_size=100")
    assert response.status_code == 200
    data = response.json()

    assert data["total"] == 143  # 141 hotspots + 2 reports
    sources = [p["source"] for p in data["priorities"]]
    assert "citizen_report" in sources


@pytest.mark.anyio
async def test_cleanup_priorities_pagination(client):
    """Test cleanup priorities pagination."""
    response = await client.get("/api/v1/dashboard/cleanup/priorities?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert len(data["priorities"]) == 10
    assert data["total_pages"] == 15  # 141 / 10 = 14.1 -> 15

    response = await client.get("/api/v1/dashboard/cleanup/priorities?page=2&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 2
    assert data["page_size"] == 10


@pytest.mark.anyio
async def test_cleanup_priorities_invalid_page(client):
    """Test cleanup priorities with invalid page parameters."""
    response = await client.get("/api/v1/dashboard/cleanup/priorities?page=0")
    assert response.status_code == 422

    response = await client.get("/api/v1/dashboard/cleanup/priorities?page_size=0")
    assert response.status_code == 422

    response = await client.get("/api/v1/dashboard/cleanup/priorities?page_size=101")
    assert response.status_code == 422


@pytest.mark.anyio
async def test_cleanup_priorities_score_range(client):
    """Test that priority scores are in valid range."""
    response = await client.get("/api/v1/dashboard/cleanup/priorities?page_size=50")
    assert response.status_code == 200
    data = response.json()

    for item in data["priorities"]:
        assert 0.0 <= item["priority_score"] <= 1.0
        # Each item should have 3 factors
        assert len(item["factors"]) == 3
        for factor in item["factors"]:
            assert "name" in factor
            assert "value" in factor
            assert "weight" in factor
            assert "description" in factor
            assert 0.0 <= factor["weight"] <= 1.0


@pytest.mark.anyio
async def test_cleanup_priorities_satellite_distinction(client):
    """Test that satellite vs citizen sources are clearly distinguished."""
    response = await client.get("/api/v1/dashboard/cleanup/priorities")
    assert response.status_code == 200
    data = response.json()

    for item in data["priorities"]:
        assert item["source"] in ("satellite_candidate_hotspot", "citizen_report")
        if item["source"] == "satellite_candidate_hotspot":
            assert "NOT confirmed plastic pollution" in item["explanation"]
            assert "unverified" in item["explanation"].lower()
        elif item["source"] == "citizen_report":
            assert "citizen" in item["explanation"].lower() or "report" in item["explanation"].lower()


@pytest.mark.anyio
async def test_dashboard_stats_structure(client):
    """Test dashboard stats response has all required fields."""
    response = await client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    data = response.json()

    required_fields = [
        "candidate_hotspots",
        "water_mask_features",
        "citizen_reports_total",
        "citizen_reports_pending",
        "citizen_reports_verified",
        "citizen_reports_rejected",
        "reports_last_7_days",
        "reports_last_30_days",
    ]
    for field in required_fields:
        assert field in data
        assert isinstance(data[field], int)
        assert data[field] >= 0


@pytest.mark.anyio
async def test_cleanup_priorities_raw_data_included(client):
    """Test that raw_data is included for transparency."""
    response = await client.get("/api/v1/dashboard/cleanup/priorities?page_size=5")
    assert response.status_code == 200
    data = response.json()

    for item in data["priorities"]:
        assert "raw_data" in item
        assert isinstance(item["raw_data"], dict)

        if item["source"] == "satellite_candidate_hotspot":
            # Should have original hotspot properties
            assert "area_m2" in item["raw_data"] or "candidate" in item["raw_data"]
        elif item["source"] == "citizen_report":
            # Should have original report fields
            assert "description" in item["raw_data"]
            assert "status" in item["raw_data"]