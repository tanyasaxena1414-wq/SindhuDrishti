from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field, field_validator, ConfigDict
from enum import Enum


class ReportStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class ReportCreate(BaseModel):
    latitude: str = Field(..., description="Latitude as string (e.g., '19.4567')")
    longitude: str = Field(..., description="Longitude as string (e.g., '75.3456')")
    description: str = Field(..., min_length=10, max_length=2000, description="Description of the pollution incident")
    photo_reference: Optional[str] = Field(None, max_length=255, description="Optional photo reference/URL")

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: str) -> str:
        try:
            lat = float(v)
            if not (-90 <= lat <= 90):
                raise ValueError("Latitude must be between -90 and 90")
        except ValueError:
            raise ValueError("Latitude must be a valid number")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: str) -> str:
        try:
            lon = float(v)
            if not (-180 <= lon <= 180):
                raise ValueError("Longitude must be between -180 and 180")
        except ValueError:
            raise ValueError("Longitude must be a valid number")
        return v


class ReportUpdate(BaseModel):
    status: ReportStatus = Field(..., description="New status for the report")
    reviewer_notes: Optional[str] = Field(None, max_length=2000, description="Internal reviewer notes")


class ReportResponse(BaseModel):
    report_id: str
    latitude: str
    longitude: str
    description: str
    photo_reference: Optional[str] = None
    status: ReportStatus
    submitted_at: str

    @field_validator("submitted_at", mode="before")
    @classmethod
    def format_submitted_at(cls, v):
        if hasattr(v, "isoformat"):
            return v.isoformat() + "Z"
        return v

    model_config = ConfigDict(from_attributes=True)


class ReportDetailResponse(ReportResponse):
    reviewer_notes: Optional[str] = None
    reviewed_at: Optional[str] = None

    @field_validator("reviewed_at", mode="before")
    @classmethod
    def format_reviewed_at(cls, v):
        if v is not None and hasattr(v, "isoformat"):
            return v.isoformat() + "Z"
        return v


class ReportListResponse(BaseModel):
    reports: list[ReportResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ErrorResponse(BaseModel):
    detail: str