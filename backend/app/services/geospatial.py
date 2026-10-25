import json
from pathlib import Path
from typing import Dict, Any, Optional

# Path resolution: backend/app/services/geospatial.py -> parent.parent.parent.parent is root (since we are in backend/)
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
HOTSPOTS_PATH = ROOT_DIR / "candidate_hotspots_unverified(2).geojson"
WATER_MASKS_PATH = ROOT_DIR / "reservoir_water_mask_research_aligned(1).geojson"

class GeoJSONStore:
    def __init__(self):
        self._hotspots: Optional[Dict[str, Any]] = None
        self._water_masks: Optional[Dict[str, Any]] = None

    def get_hotspots(self) -> Dict[str, Any]:
        if self._hotspots is None:
            if HOTSPOTS_PATH.exists():
                with open(HOTSPOTS_PATH, "r", encoding="utf-8") as f:
                    self._hotspots = json.load(f)
            else:
                self._hotspots = {"type": "FeatureCollection", "features": []}
        return self._hotspots

    def get_water_masks(self) -> Dict[str, Any]:
        if self._water_masks is None:
            if WATER_MASKS_PATH.exists():
                with open(WATER_MASKS_PATH, "r", encoding="utf-8") as f:
                    self._water_masks = json.load(f)
            else:
                self._water_masks = {"type": "FeatureCollection", "features": []}
        return self._water_masks

    def get_study_area_metadata(self) -> Dict[str, Any]:
        hotspots = self.get_hotspots()
        masks = self.get_water_masks()

        return {
            "basin": "Godavari Basin",
            "region": "Maharashtra / Telangana, India",
            "study_area_name": "Godavari Reservoir & Debris Monitoring Zone",
            "crs": "EPSG:4326",
            "bounding_box": {
                "min_lon": 75.19,
                "min_lat": 19.34,
                "max_lon": 75.48,
                "max_lat": 19.58
            },
            "datasets": {
                "hotspots_count": len(hotspots.get("features", [])),
                "water_masks_count": len(masks.get("features", [])),
                "source": "Sentinel-2 Level-2A (Cerra et al., 2025 approach)",
                "status": "unverified_candidate_hotspots"
            }
        }

geojson_store = GeoJSONStore()
