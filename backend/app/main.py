from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import health, geospatial, reports, dashboard, drift, satellite
from app.database import init_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for SindhuDrishti AI-Assisted Water Pollution Monitoring Platform (Godavari Basin)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(geospatial.router, prefix=settings.API_V1_STR)
app.include_router(satellite.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(drift.router, prefix=settings.API_V1_STR)

@app.get("/", tags=["root"])
async def root():
    return {
        "message": "Welcome to SindhuDrishti API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "basins": f"{settings.API_V1_STR}/basins",
        "study_area": f"{settings.API_V1_STR}/study-area",
        "water_masks": f"{settings.API_V1_STR}/water-masks",
        "hotspots": f"{settings.API_V1_STR}/hotspots",
        "satellite_status": f"{settings.API_V1_STR}/satellite/status",
        "satellite_passes": f"{settings.API_V1_STR}/satellite/passes",
        "reports": f"{settings.API_V1_STR}/reports",
        "dashboard_stats": f"{settings.API_V1_STR}/dashboard/stats",
        "cleanup_priorities": f"{settings.API_V1_STR}/dashboard/cleanup/priorities",
        "drift_simulate": f"{settings.API_V1_STR}/drift/simulate"
    }
