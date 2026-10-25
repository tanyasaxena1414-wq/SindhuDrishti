# SindhuDrishti Backend — Completion Audit

## 1. Actual Implementation Inventory
The backend is built using a modern asynchronous Python web stack:
- **Framework & Routing:** FastAPI (`app/main.py`) with routers for Health (`app/routers/health.py`), Geospatial (`app/routers/geospatial.py`), Citizen Reports (`app/routers/reports.py`), Dashboard & Cleanup Priorities (`app/routers/dashboard.py`), and Drift Simulation (`app/routers/drift.py`).
- **Database & ORM:** SQLAlchemy 2.0 with async engine and `aiosqlite` (`app/database.py`, `app/models.py`), utilizing `greenlet` for async ORM execution.
- **Validation & Serialization:** Pydantic v2 and Pydantic Settings (`app/config.py`, `app/schemas.py`, `app/schemas_dashboard.py`, `app/schemas_drift.py`) with strict coordinate range checking (-90 to 90 lat, -180 to 180 lon) and field validators.
- **Authentication:** Simple API Key authentication header (`X-Reviewer-API-Key`) checking against environment secret `REVIEWER_API_KEY` (`app/auth.py`), failing closed when not configured.
- **Geospatial & Analysis Services:** Lazy-loading `GeoJSONStore` (`app/services/geospatial.py`) reading Sentinel-2 Level-2A unverified candidate hotspots (`candidate_hotspots_unverified(2).geojson`) and reservoir water masks (`reservoir_water_mask_research_aligned(1).geojson`); transparent multi-factor cleanup priority scoring (`app/services/dashboard.py`); and kinematic particle-tracking drift simulation (`app/services/drift.py`).
- **Test Suite:** Comprehensive async pytest suite (`tests/conftest.py`, `tests/test_health.py`, `tests/test_geospatial.py`, `tests/test_reports.py`, `tests/test_dashboard.py`, `tests/test_drift.py`).

---

## 2. Test Results
- **Command Run:** `python -m pytest tests/ -v`
- **Results:** **46 passed, 0 failed, 0 skipped** in 0.64s.

---

## 3. Endpoint-by-Endpoint Audit Table

| Method | Endpoint | Auth Required | Input Validation | HTTP Status Codes | Error Handling | Pagination / Limits | Notes & Security |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | None | None | 200 | Robust | N/A | Root links index |
| `GET` | `/api/v1/health` | None | None | 200 | Robust | N/A | Health check OK |
| `GET` | `/api/v1/study-area` | None | None | 200 | Robust | N/A | Godavari basin bounds & metadata |
| `GET` | `/api/v1/water-masks` | None | None | 200, 404 | Handles empty/missing | N/A | GeoJSON FeatureCollection |
| `GET` | `/api/v1/hotspots` | None | Query params (`min_area`, `status`) | 200 | Robust | N/A | Explicit disclaimer on unverified hotspots |
| `POST` | `/api/v1/reports` | None | Pydantic (`ReportCreate`: lat/lon ranges, desc len) | 201, 400, 422 | Clean validation | N/A | Creates pending report with unique ID |
| `GET` | `/api/v1/reports` | Optional Reviewer Key | Query params (`status`, `page`, `page_size`) | 200, 400, 422 | Robust pagination | Page size 1–100 | Redacts reviewer notes for public users |
| `GET` | `/api/v1/reports/{id}` | Optional Reviewer Key | Path parameter (`report_id`) | 200, 404 | Returns 404 if missing | N/A | Redacts reviewer notes for public users |
| `PATCH` | `/api/v1/reports/{id}/status` | **Required** (`X-Reviewer-API-Key`) | Pydantic (`ReportUpdate`), state transition rules | 200, 401, 403, 404, 400 | Fails closed on missing key | N/A | Enforces strict status transition lifecycle |
| `GET` | `/api/v1/dashboard/stats` | None | None | 200 | Robust | N/A | Aggregates DB counts & GeoJSON feature totals |
| `GET` | `/api/v1/dashboard/cleanup/priorities` | None | Query params (`page`, `page_size`) | 200, 422 | Validates page limits | Page size 1–100 | Combined multi-factor scoring (satellite + citizen) |
| `POST` | `/api/v1/drift/simulate` | None | Pydantic (`DriftSimulateRequest`: velocity, duration, particles) | 200, 400, 422 | Catches simulation errors | Max 100 particles | Illustrative model with explicit disclaimers & bounds |

---

## 4. Security and Reliability Findings

### **Medium**
1. **Plaintext SQLite File Storage in Default Config:**
   - *Finding:* `DATABASE_URL` defaults to `sqlite+aiosqlite:///./sindhudrishti.db`.
   - *Risk/Impact:* Suitable for local development and testing, but requires persistent managed storage or PostgreSQL for multi-container production deployments.
   - *Mitigation:* Documented in production readiness notes; easily overridden via environment variables.

### **Low**
1. **`datetime.utcnow()` Deprecation Warnings:**
   - *Finding:* SQLAlchemy schema and models use `datetime.utcnow()`.
   - *Risk/Impact:* Generates Python 3.14 deprecation warnings in test runs, but does not affect correctness or persistence.

---

## 5. Missing Test Coverage
- **Edge cases covered:** Invalid coordinate ranges, non-numeric coordinate strings, missing required fields, short descriptions (<10 chars), unauthorized reviewer API keys, invalid state transitions, empty databases, pagination boundary errors, and out-of-bounds drift particles.
- **Minor gaps:** Explicit test for missing/corrupted GeoJSON files (currently handled gracefully via fallback empty FeatureCollection, but lack direct unit test assertions).

---

## 6. Dataset Provenance and Model Limitations
- **Geospatial Provenance:** Bounding boxes (`min_lon: 75.19`, `min_lat: 19.34`, `max_lon: 75.48`, `max_lat: 19.58`) and coordinate ranges align with Godavari basin reservoir monitoring zones (Sentinel-2 Level-2A / Cerra et al., 2025 workflows). However, without authoritative basin polygon boundary masks in the repo, provenance is classified as unverified study-area context. All endpoints explicitly label features as **unverified candidate hotspots**, *not* confirmed plastic pollution. Source GeoJSON assets remain unmodified.
- **Drift Simulation Limitations:** The drift simulation (`POST /api/v1/drift/simulate`) is an **illustrative kinematic model** combining uniform current vectors, wind leeway, and Gaussian diffusion. It is **not** an operationally calibrated or validated hydrodynamic forecast (due to the absence of continuous river discharge, bathymetry, and flow velocity data).

---

## 7. Prioritized Remediation Checklist
- **P0 (Blockers):** None. All core endpoints, security controls, scoring algorithms, drift simulations, and 46 test cases are fully functional and passing.
- **P1 (Enhancements):** None required for current MVP milestone completion.
- **P2 (Nice-to-Have):** Migrate `datetime.utcnow()` to timezone-aware `datetime.now(timezone.utc)` to eliminate deprecation warnings on Python 3.11+.

---

## 8. Clear Acceptance Criteria for Declaring Backend Complete
1. All automated tests pass successfully (`pytest` 46/46 passed).
2. Reviewer authentication fails closed when `REVIEWER_API_KEY` is missing or invalid.
3. Public endpoints strictly redact confidential reviewer notes.
4. Geospatial and dashboard endpoints correctly aggregate and paginate data.
5. Drift simulation executes deterministically, validates inputs, and includes clear disclaimers.
6. Zero modifications made to frontend code or source GeoJSON assets.

---

## Audit Execution Summary
- **Files Inspected:** All backend application files (`app/**/*.py`), test files (`tests/**/*.py`), configuration files (`requirements.txt`, `pytest.ini`, `.env.example`), and documentation (`README.md`).
- **Commands Run:** `python -m pytest tests/ -v`
- **Actual Test Results:** 46 passed, 0 failed, 0 skipped.
- **Files Changed:** Only `BACKEND_AUDIT.md` was created. No application code, tests, dependencies, or source files were modified.
