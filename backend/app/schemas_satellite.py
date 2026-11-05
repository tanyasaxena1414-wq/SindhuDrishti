"""
SindhuDrishti Satellite & MARIDA Classification Schemas
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SatellitePassInfo(BaseModel):
    id: str = Field(..., description="Sentinel-2 product ID")
    datetime: str = Field(..., description="Acquisition ISO datetime")
    platform: str = Field(..., description="Satellite platform (e.g. Sentinel-2B)")
    tile_id: str = Field(..., description="MGRS Tile identifier (e.g. 43QEB)")
    cloud_cover_percent: float = Field(..., description="Scene cloud cover percentage")
    thumbnail_url: Optional[str] = Field(None, description="Preview thumbnail URL")
    stac_asset_href: Optional[str] = Field(None, description="STAC asset reference URL")


class SatelliteStatusResponse(BaseModel):
    status: str = Field("operational", description="Satellite feed operational status")
    satellite_constellation: str = Field("Copernicus Sentinel-2 (MSI L2A)", description="Constellation name")
    data_provider: str = Field("Microsoft Planetary Computer / ESA Copernicus", description="Data provider")
    cost_tier: str = Field("100% Free Public Open Data", description="Cost tier")
    study_area: str = Field("Godavari Basin / Jayakwadi Reservoir", description="Monitored study area")
    bounding_box: List[float] = Field(..., description="[min_lon, min_lat, max_lon, max_lat]")
    latest_pass: Optional[SatellitePassInfo] = Field(None, description="Most recent satellite pass metadata")
    total_cached_passes: int = Field(0, description="Number of passes recorded")


class SatellitePassListResponse(BaseModel):
    passes: List[SatellitePassInfo] = Field(..., description="List of recent satellite passes")
    total: int = Field(..., description="Total count of passes returned")
    latest: Optional[SatellitePassInfo] = Field(None, description="Most recent pass")


class MARIDAFeatureVector(BaseModel):
    b2_blue: float
    b3_green: float
    b4_red: float
    b6_red_edge: float
    b8_nir: float
    b11_swir1: float
    fdi: float
    ndvi: float
    plastic_index: float
    red_edge_slope: float


class MARIDAClassificationResult(BaseModel):
    predicted_class: str = Field(..., description="candidate_plastic_debris | dense_vegetation_hyacinth | turbid_water_sediment | clean_water")
    confidence: float = Field(..., description="Classification confidence (0.0 to 1.0)")
    class_probabilities: Dict[str, float] = Field(..., description="Probability distribution across classes")
    rationale: str = Field(..., description="Scientific feature rationale")
    indices: Dict[str, float] = Field(..., description="Calculated spectral indices")


class SatelliteSyncResponse(BaseModel):
    success: bool = True
    message: str
    latest_pass: Optional[SatellitePassInfo] = None
    hotspots_evaluated: int = 0
    candidate_debris_count: int = 0
    vegetation_hyacinth_count: int = 0
    sync_timestamp: str


class ChangeDetectionZoneSummary(BaseModel):
    count: int
    area_m2: float
    description: str


class SatelliteChangeDetectionResponse(BaseModel):
    baseline_pass: SatellitePassInfo
    comparison_pass: SatellitePassInfo
    days_elapsed: int
    accumulating_zones: ChangeDetectionZoneSummary
    persistent_zones: ChangeDetectionZoneSummary
    cleared_zones: ChangeDetectionZoneSummary
    net_area_change_percent: float
    net_debris_growth_status: str
    features: List[Dict[str, Any]]
