# SindhuDrishti Backend

AI-assisted water pollution monitoring platform focused on identifying potential floating debris hotspots in the Godavari basin using Copernicus Sentinel-2 Level-2A imagery (Cerra et al., 2025 approach).

---

## Prerequisites

- Python 3.11 or 3.12 (or compatible Python 3.10+)
- pip & virtualenv

---

## Installation & Setup

1. **Clone and navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   python -m pip install --upgrade pip setuptools wheel
   python -m pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

---

## Running the Application

Start the development server with Uvicorn:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- **API Documentation (Swagger UI):** `http://127.0.0.1:8000/docs`
- **Alternative Documentation (ReDoc):** `http://127.0.0.1:8000/redoc`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Root welcome and service links |
| `GET` | `/api/v1/health` | Health check endpoint |
| `GET` | `/api/v1/study-area` | Godavari basin study area metadata & bounding box |
| `GET` | `/api/v1/water-masks` | Reservoir water masks GeoJSON FeatureCollection |
| `GET` | `/api/v1/hotspots` | Candidate debris hotspots GeoJSON FeatureCollection (supports `min_area` and `status` filters) |

---

## Running Tests

Execute the automated test suite with pytest:
```bash
python -m pytest -v
```
