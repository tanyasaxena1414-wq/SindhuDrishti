from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, String, DateTime, Text, Enum as SQLEnum, Index
from sqlalchemy.dialects.sqlite import INTEGER
from app.database import Base


class ReportStatus(str, PyEnum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class PollutionReport(Base):
    __tablename__ = "pollution_reports"

    id = Column(INTEGER, primary_key=True, autoincrement=True)
    report_id = Column(String(36), unique=True, nullable=False, index=True)
    latitude = Column(String(50), nullable=False)  # Store as string to preserve precision
    longitude = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    photo_reference = Column(Text, nullable=True)
    status = Column(SQLEnum(ReportStatus), default=ReportStatus.PENDING, nullable=False)
    reviewer_notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)

    # Indexes for common queries
    __table_args__ = (
        Index("ix_pollution_reports_status", "status"),
        Index("ix_pollution_reports_submitted_at", "submitted_at"),
    )

    def to_dict(self, include_reviewer_notes: bool = False) -> dict:
        result = {
            "report_id": self.report_id,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "description": self.description,
            "photo_reference": self.photo_reference,
            "status": self.status.value,
            "submitted_at": self.submitted_at.isoformat() + "Z" if self.submitted_at else None,
        }
        try:
            from app.services.vision_classifier import classify_citizen_evidence
            lat_f = float(self.latitude)
            lon_f = float(self.longitude)
            result["ai_vision_analysis"] = classify_citizen_evidence(
                self.photo_reference,
                self.description,
                lat_f,
                lon_f
            )
        except Exception:
            result["ai_vision_analysis"] = None

        if include_reviewer_notes:
            result["reviewer_notes"] = self.reviewer_notes
            result["reviewed_at"] = self.reviewed_at.isoformat() + "Z" if self.reviewed_at else None
        return result