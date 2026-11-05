from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict


class DriftSimulateRequest(BaseModel):
    latitude: float = Field(..., description="Starting latitude (e.g. 19.4567)")
    longitude: float = Field(..., description="Starting longitude (e.g. 75.3456)")
    duration_hours: float = Field(24.0, gt=0, le=168, description="Simulation duration in hours (max 7 days)")
    timestep_minutes: float = Field(60.0, gt=0, le=360, description="Timestep size in minutes")
    particle_count: int = Field(20, ge=1, le=100, description="Number of ensemble particles")
    current_velocity_ms: float = Field(0.2, ge=0.0, le=2.0, description="Base current velocity in m/s")
    current_direction_deg: float = Field(135.0, ge=0.0, le=360.0, description="Current flow direction in degrees (0=North, 90=East)")
    wind_factor: float = Field(0.02, ge=0.0, le=0.1, description="Wind leeway factor")
    wind_speed_ms: float = Field(2.0, ge=0.0, le=20.0, description="Wind speed in m/s")
    wind_direction_deg: float = Field(90.0, ge=0.0, le=360.0, description="Wind direction in degrees")
    random_seed: Optional[int] = Field(42, description="Random seed for reproducibility")
    hotspot_id: Optional[str] = Field(None, description="Optional ID of specific detected debris hotspot to track")
    debris_name: Optional[str] = Field(None, description="Optional name of specific detected debris hotspot")

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: float) -> float:
        if not (-90 <= v <= 90):
            raise ValueError("Latitude must be between -90 and 90")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: float) -> float:
        if not (-180 <= v <= 180):
            raise ValueError("Longitude must be between -180 and 180")
        return v


class DriftTrajectoryPoint(BaseModel):
    time_offset_hours: float
    latitude: float
    longitude: float
    status: str = Field("active", description="Particle status: active, out_of_bounds, ashore")


class ParticleTrajectory(BaseModel):
    particle_id: int
    trajectory: List[DriftTrajectoryPoint]
    final_status: str


class FieldAssetRequirement(BaseModel):
    skimmer_boats: int = Field(..., description="Number of trash skimmer catamarans required")
    containment_booms_meters: int = Field(..., description="Meters of heavy-duty deflection boom required")
    field_crew_count: int = Field(..., description="Trained NGO/municipal recovery personnel")
    estimated_extraction_hours: float = Field(..., description="Estimated operational hours needed for collection")


class EconomicImpact(BaseModel):
    estimated_debris_mass_kg: float = Field(..., description="Estimated debris weight in kg")
    estimated_debris_mass_tons: float = Field(..., description="Estimated debris weight in metric tons")
    infrastructure_damage_prevented_inr: float = Field(..., description="Estimated INR saved in turbine/canal damage")
    infrastructure_damage_prevented_lakhs: float = Field(..., description="Estimated Lakhs INR saved")
    recovery_roi_multiplier: float = Field(..., description="Economic prevention benefit vs extraction cost")


class FieldDispatchOrder(BaseModel):
    order_id: str
    target_debris_id: Optional[str]
    target_name: str
    target_latitude: float
    target_longitude: float
    priority_level: str
    critical_interception_window: str
    optimal_staging_area: str
    recommended_tactics: List[str]


class DriftSimulateResponse(BaseModel):
    simulation_id: str
    timestamp: str
    parameters: Dict[str, Any]
    particles: List[ParticleTrajectory]
    summary: Dict[str, Any]
    disclaimer: str
    limitations: List[str]

    model_config = ConfigDict(from_attributes=True)
