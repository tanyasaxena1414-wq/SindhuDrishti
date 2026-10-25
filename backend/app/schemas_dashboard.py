from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class DataSource(str, Enum):
    SATELLITE = "satellite_candidate_hotspot"
    CITIZEN = "citizen_report"


class DashboardStats(BaseModel):
    """Dashboard summary statistics."""
    candidate_hotspots: int = Field(..., description="Total candidate debris hotspots from satellite analysis")
    water_mask_features: int = Field(..., description="Total water mask features from satellite analysis")
    citizen_reports_total: int = Field(..., description="Total citizen pollution reports submitted")
    citizen_reports_pending: int = Field(..., description="Citizen reports awaiting review")
    citizen_reports_verified: int = Field(..., description="Citizen reports verified by reviewers")
    citizen_reports_rejected: int = Field(..., description="Citizen reports rejected by reviewers")
    reports_last_7_days: int = Field(..., description="Reports submitted in the last 7 days")
    reports_last_30_days: int = Field(..., description="Reports submitted in the last 30 days")

    model_config = ConfigDict(from_attributes=True)


class CleanupPriorityFactor(BaseModel):
    """Individual factor contributing to cleanup priority score."""
    name: str
    value: float
    weight: float
    description: str


class CleanupPriorityItem(BaseModel):
    """A single cleanup priority entry."""
    id: str
    source: DataSource
    latitude: float
    longitude: float
    priority_score: float
    factors: List[CleanupPriorityFactor]
    explanation: str
    raw_data: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class CleanupPriorityResponse(BaseModel):
    """Cleanup priorities paginated response."""
    priorities: List[CleanupPriorityItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    methodology: str
    limitations: List[str]

    model_config = ConfigDict(from_attributes=True)


class DashboardTimeSeriesPoint(BaseModel):
    """Time series data point for dashboard charts."""
    date: str
    count: int


class DashboardTimeSeries(BaseModel):
    """Time series data for reports."""
    daily: List[DashboardTimeSeriesPoint]
    weekly: List[DashboardTimeSeriesPoint]