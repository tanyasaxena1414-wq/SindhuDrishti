import pytest
from app.models import PollutionReport, ReportStatus
from tests.test_reports_helper import TestingSessionLocal


@pytest.mark.anyio
async def test_create_report_success(client):
    """Test successful report creation."""
    response = await client.post(
        "/api/v1/reports",
        json={
            "latitude": "19.4567",
            "longitude": "75.3456",
            "description": "Industrial waste discharge observed near the river bank",
            "photo_reference": "https://example.com/photo1.jpg",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "report_id" in data
    assert data["latitude"] == "19.4567"
    assert data["longitude"] == "75.3456"
    assert data["description"] == "Industrial waste discharge observed near the river bank"
    assert data["photo_reference"] == "https://example.com/photo1.jpg"
    assert data["status"] == "pending"
    assert "submitted_at" in data


@pytest.mark.anyio
async def test_create_report_without_photo(client):
    """Test report creation without optional photo reference."""
    response = await client.post(
        "/api/v1/reports",
        json={
            "latitude": "19.5000",
            "longitude": "75.4000",
            "description": "Plastic debris floating in water",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["photo_reference"] is None


@pytest.mark.anyio
async def test_create_report_invalid_latitude(client):
    """Test report creation with invalid latitude."""
    response = await client.post(
        "/api/v1/reports",
        json={
            "latitude": "95.0",  # Invalid - out of range
            "longitude": "75.3456",
            "description": "Test description for validation",
        },
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_create_report_invalid_longitude(client):
    """Test report creation with invalid longitude."""
    response = await client.post(
        "/api/v1/reports",
        json={
            "latitude": "19.4567",
            "longitude": "200.0",  # Invalid - out of range
            "description": "Test description for validation",
        },
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_create_report_non_numeric_coordinates(client):
    """Test report creation with non-numeric coordinates."""
    response = await client.post(
        "/api/v1/reports",
        json={
            "latitude": "not_a_number",
            "longitude": "75.3456",
            "description": "Test description for validation",
        },
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_create_report_short_description(client):
    """Test report creation with description too short."""
    response = await client.post(
        "/api/v1/reports",
        json={
            "latitude": "19.4567",
            "longitude": "75.3456",
            "description": "Short",  # Less than 10 chars
        },
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_create_report_missing_fields(client):
    """Test report creation with missing required fields."""
    response = await client.post(
        "/api/v1/reports",
        json={
            "latitude": "19.4567",
            # Missing longitude and description
        },
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_list_reports_empty(client):
    """Test listing reports when database is empty."""
    response = await client.get("/api/v1/reports")
    assert response.status_code == 200
    data = response.json()
    assert data["reports"] == []
    assert data["total"] == 0
    assert data["page"] == 1
    assert data["page_size"] == 20
    assert data["total_pages"] == 0


@pytest.mark.anyio
async def test_list_reports_with_data(client):
    """Test listing reports with data."""
    async with TestingSessionLocal() as session:
        reports = [
            PollutionReport(
                report_id=f"test-report-{i}",
                latitude="19.4567",
                longitude="75.3456",
                description=f"Test report {i}",
                status=ReportStatus.PENDING,
            )
            for i in range(3)
        ]
        session.add_all(reports)
        await session.commit()

    response = await client.get("/api/v1/reports")
    assert response.status_code == 200
    data = response.json()
    assert len(data["reports"]) == 3
    assert data["total"] == 3


@pytest.mark.anyio
async def test_list_reports_pagination(client):
    """Test pagination of reports list."""
    async with TestingSessionLocal() as session:
        reports = [
            PollutionReport(
                report_id=f"test-page-{i}",
                latitude="19.4567",
                longitude="75.3456",
                description=f"Test report for pagination {i}",
                status=ReportStatus.PENDING,
            )
            for i in range(5)
        ]
        session.add_all(reports)
        await session.commit()

    response = await client.get("/api/v1/reports?page=1&page_size=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data["reports"]) == 2
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert data["total"] == 5
    assert data["total_pages"] == 3

    response = await client.get("/api/v1/reports?page=2&page_size=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data["reports"]) == 2
    assert data["page"] == 2


@pytest.mark.anyio
async def test_list_reports_status_filter(client):
    """Test filtering reports by status."""
    async with TestingSessionLocal() as session:
        reports = [
            PollutionReport(
                report_id="test-pending-1",
                latitude="19.4567",
                longitude="75.3456",
                description="Pending report 1",
                status=ReportStatus.PENDING,
            ),
            PollutionReport(
                report_id="test-verified-1",
                latitude="19.5000",
                longitude="75.4000",
                description="Verified report 1",
                status=ReportStatus.VERIFIED,
            ),
            PollutionReport(
                report_id="test-rejected-1",
                latitude="19.5500",
                longitude="75.4500",
                description="Rejected report 1",
                status=ReportStatus.REJECTED,
            ),
        ]
        session.add_all(reports)
        await session.commit()

    response = await client.get("/api/v1/reports?status=pending")
    assert response.status_code == 200
    data = response.json()
    assert len(data["reports"]) == 1
    assert data["reports"][0]["status"] == "pending"

    response = await client.get("/api/v1/reports?status=verified")
    assert response.status_code == 200
    data = response.json()
    assert len(data["reports"]) == 1
    assert data["reports"][0]["status"] == "verified"


@pytest.mark.anyio
async def test_get_report_success(client):
    """Test retrieving a specific report by ID."""
    async with TestingSessionLocal() as session:
        report = PollutionReport(
            report_id="test-get-report",
            latitude="19.4567",
            longitude="75.3456",
            description="Test report for retrieval",
            status=ReportStatus.PENDING,
        )
        session.add(report)
        await session.commit()

    response = await client.get("/api/v1/reports/test-get-report")
    assert response.status_code == 200
    data = response.json()
    assert data["report_id"] == "test-get-report"
    assert data["description"] == "Test report for retrieval"


@pytest.mark.anyio
async def test_get_report_not_found(client):
    """Test retrieving a non-existent report."""
    response = await client.get("/api/v1/reports/non-existent-id")
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Report not found"


@pytest.mark.anyio
async def test_update_report_status_unauthorized(client):
    """Test updating report status without authentication."""
    async with TestingSessionLocal() as session:
        report = PollutionReport(
            report_id="test-update-unauthorized",
            latitude="19.4567",
            longitude="75.3456",
            description="Test report for unauthorized update",
            status=ReportStatus.PENDING,
        )
        session.add(report)
        await session.commit()

    response = await client.patch(
        "/api/v1/reports/test-update-unauthorized/status",
        json={"status": "verified", "reviewer_notes": "Looks valid"},
    )
    assert response.status_code == 401


@pytest.mark.anyio
async def test_update_report_status_invalid_key(client):
    """Test updating report status with invalid API key."""
    async with TestingSessionLocal() as session:
        report = PollutionReport(
            report_id="test-update-invalid-key",
            latitude="19.4567",
            longitude="75.3456",
            description="Test report for invalid key update",
            status=ReportStatus.PENDING,
        )
        session.add(report)
        await session.commit()

    response = await client.patch(
        "/api/v1/reports/test-update-invalid-key/status",
        json={"status": "verified", "reviewer_notes": "Looks valid"},
        headers={"X-Reviewer-API-Key": "wrong-key"},
    )
    assert response.status_code == 401


@pytest.mark.anyio
async def test_update_report_status_success(client, reviewer_headers):
    """Test successful report status update by reviewer."""
    async with TestingSessionLocal() as session:
        report = PollutionReport(
            report_id="test-update-success",
            latitude="19.4567",
            longitude="75.3456",
            description="Test report for successful update",
            status=ReportStatus.PENDING,
        )
        session.add(report)
        await session.commit()

    response = await client.patch(
        "/api/v1/reports/test-update-success/status",
        json={"status": "verified", "reviewer_notes": "Confirmed pollution"},
        headers=reviewer_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "verified"
    assert data["reviewer_notes"] == "Confirmed pollution"
    assert data["reviewed_at"] is not None


@pytest.mark.anyio
async def test_update_report_status_to_rejected(client, reviewer_headers):
    """Test updating report status to rejected."""
    async with TestingSessionLocal() as session:
        report = PollutionReport(
            report_id="test-update-rejected",
            latitude="19.4567",
            longitude="75.3456",
            description="Test report for rejection",
            status=ReportStatus.PENDING,
        )
        session.add(report)
        await session.commit()

    response = await client.patch(
        "/api/v1/reports/test-update-rejected/status",
        json={"status": "rejected", "reviewer_notes": "False alarm"},
        headers=reviewer_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "rejected"
    assert data["reviewer_notes"] == "False alarm"


@pytest.mark.anyio
async def test_update_report_status_invalid_transition(client, reviewer_headers):
    """Test invalid status transition (verified -> pending not allowed)."""
    async with TestingSessionLocal() as session:
        report = PollutionReport(
            report_id="test-invalid-transition",
            latitude="19.4567",
            longitude="75.3456",
            description="Test report for invalid transition",
            status=ReportStatus.VERIFIED,
        )
        session.add(report)
        await session.commit()

    response = await client.patch(
        "/api/v1/reports/test-invalid-transition/status",
        json={"status": "pending", "reviewer_notes": "Trying invalid transition"},
        headers=reviewer_headers,
    )
    assert response.status_code == 400
    data = response.json()
    assert "Invalid status transition" in data["detail"]


@pytest.mark.anyio
async def test_update_report_not_found(client, reviewer_headers):
    """Test updating status of non-existent report."""
    response = await client.patch(
        "/api/v1/reports/non-existent/status",
        json={"status": "verified", "reviewer_notes": "Test"},
        headers=reviewer_headers,
    )
    assert response.status_code == 404


@pytest.mark.anyio
async def test_database_persistence(client):
    """Test that reports persist across requests."""
    response = await client.post(
        "/api/v1/reports",
        json={
            "latitude": "19.4567",
            "longitude": "75.3456",
            "description": "Persistent report test",
        },
    )
    assert response.status_code == 201
    report_id = response.json()["report_id"]

    response = await client.get(f"/api/v1/reports/{report_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["report_id"] == report_id
    assert data["description"] == "Persistent report test"


@pytest.mark.anyio
async def test_reviewer_notes_not_exposed_to_public(client, reviewer_headers):
    """Test that reviewer notes are not exposed in public list/detail endpoints."""
    async with TestingSessionLocal() as session:
        report = PollutionReport(
            report_id="test-notes-hidden",
            latitude="19.4567",
            longitude="75.3456",
            description="Test report for notes privacy",
            status=ReportStatus.VERIFIED,
            reviewer_notes="Internal confidential notes",
        )
        session.add(report)
        await session.commit()

    # Public list should not have reviewer_notes
    response = await client.get("/api/v1/reports")
    assert response.status_code == 200
    data = response.json()
    assert "reviewer_notes" not in data["reports"][0]

    # Public detail should not have reviewer_notes
    response = await client.get("/api/v1/reports/test-notes-hidden")
    assert response.status_code == 200
    data = response.json()
    assert "reviewer_notes" not in data

    # Reviewer detail should have reviewer_notes
    response = await client.get(
        "/api/v1/reports/test-notes-hidden",
        headers=reviewer_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["reviewer_notes"] == "Internal confidential notes"


@pytest.mark.anyio
async def test_valid_status_transitions(client, reviewer_headers):
    """Test all valid status transitions."""
    transitions = [
        ("trans-p-v", ReportStatus.PENDING, "verified"),
        ("trans-p-r", ReportStatus.PENDING, "rejected"),
        ("trans-v-r", ReportStatus.VERIFIED, "rejected"),
        ("trans-r-v", ReportStatus.REJECTED, "verified"),
    ]

    for report_id, initial_status, new_status in transitions:
        async with TestingSessionLocal() as session:
            report = PollutionReport(
                report_id=report_id,
                latitude="19.4567",
                longitude="75.3456",
                description="Transition test",
                status=initial_status,
            )
            session.add(report)
            await session.commit()

        response = await client.patch(
            f"/api/v1/reports/{report_id}/status",
            json={"status": new_status},
            headers=reviewer_headers,
        )
        assert response.status_code == 200, f"Failed for {initial_status.value} -> {new_status}"


@pytest.mark.anyio
async def test_invalid_status_transitions_batch(client, reviewer_headers):
    """Test invalid status transitions are rejected."""
    invalid_transitions = [
        ("trans-inv-v-p", ReportStatus.VERIFIED, "pending"),
        ("trans-inv-r-p", ReportStatus.REJECTED, "pending"),
        ("trans-inv-v-v", ReportStatus.VERIFIED, "verified"),
    ]

    for report_id, current_status, new_status in invalid_transitions:
        async with TestingSessionLocal() as session:
            report = PollutionReport(
                report_id=report_id,
                latitude="19.4567",
                longitude="75.3456",
                description="Transition test",
                status=current_status,
            )
            session.add(report)
            await session.commit()

        response = await client.patch(
            f"/api/v1/reports/{report_id}/status",
            json={"status": new_status},
            headers=reviewer_headers,
        )
        assert response.status_code == 400, f"Expected 400 for {current_status.value} -> {new_status}"


@pytest.mark.anyio
async def test_create_report_with_base64_photo(client):
    """Test report creation with a large base64 image data string."""
    large_base64 = "data:image/jpeg;base64," + "A" * 15000
    response = await client.post(
        "/api/v1/reports",
        json={
            "latitude": "19.4567",
            "longitude": "75.3456",
            "description": "User uploaded camera picture of debris windrow",
            "photo_reference": large_base64,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["photo_reference"] == large_base64


@pytest.mark.anyio
async def test_delete_report_success(client):
    """Test deleting a report by ID."""
    # Create report first
    create_res = await client.post(
        "/api/v1/reports",
        json={
            "latitude": "19.4567",
            "longitude": "75.3456",
            "description": "Report to be deleted test",
        },
    )
    assert create_res.status_code == 201
    report_id = create_res.json()["report_id"]

    # Delete report
    delete_res = await client.delete(f"/api/v1/reports/{report_id}")
    assert delete_res.status_code == 200
    assert delete_res.json()["report_id"] == report_id

    # Verify report is gone
    get_res = await client.get(f"/api/v1/reports/{report_id}")
    assert get_res.status_code == 404


@pytest.mark.anyio
async def test_clear_all_reports(client):
    """Test clearing all reports."""
    # Create two reports
    for i in range(2):
        await client.post(
            "/api/v1/reports",
            json={
                "latitude": "19.4567",
                "longitude": "75.3456",
                "description": f"Bulk cleanup report {i} test",
            },
        )

    # Clear all
    clear_res = await client.delete("/api/v1/reports")
    assert clear_res.status_code == 200

    # Verify list is empty
    list_res = await client.get("/api/v1/reports")
    assert list_res.status_code == 200
    assert list_res.json()["total"] == 0
