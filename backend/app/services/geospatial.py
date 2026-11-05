import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from app.services.detection_pipeline import enrich_hotspot_collection
from app.services.stac_satellite import stac_satellite_service

# Path resolution: backend/app/services/geospatial.py -> root is 4 levels up
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
WATER_MASKS_PATH = ROOT_DIR / "reservoir_water_mask_research_aligned(1).geojson"
BASINS_DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "basins"

BASINS_METADATA: Dict[str, Dict[str, Any]] = {
    "jayakwadi": {
        "id": "jayakwadi",
        "name": "Jayakwadi Reservoir (Nath Sagar)",
        "basin": "Godavari Basin",
        "region": "Maharashtra, India",
        "study_area_name": "Godavari Reservoir & Debris Monitoring Zone",
        "crs": "EPSG:4326",
        "center": [19.495, 75.335],
        "default_zoom": 11,
        "bounding_box": {
            "min_lon": 75.19,
            "min_lat": 19.34,
            "max_lon": 75.48,
            "max_lat": 19.58
        },
        "description": "Primary Deep-Water Reservoir Pilot · 141 Candidate Hotspots · Sentinel-2 MSI L2A",
        "status": "active"
    },
    "hussainsagar": {
        "id": "hussainsagar",
        "name": "Hussain Sagar Lake",
        "basin": "Krishna Basin",
        "region": "Hyderabad, Telangana, India",
        "study_area_name": "Hussain Sagar Urban Freshwater Ecosystem",
        "crs": "EPSG:4326",
        "center": [17.4239, 78.4738],
        "default_zoom": 14,
        "bounding_box": {
            "min_lon": 78.4550,
            "min_lat": 17.4120,
            "max_lon": 78.4880,
            "max_lat": 17.4380
        },
        "description": "Urban Freshwater Pilot · 24 High-Density Municipal Runoff & Hyacinth Traps",
        "status": "active"
    },
    "yamuna": {
        "id": "yamuna",
        "name": "Yamuna River Corridor (Delhi Stretch)",
        "basin": "Ganges Basin",
        "region": "Delhi NCT / Uttar Pradesh, India",
        "study_area_name": "Yamuna Riverine Channel & Barrage Monitoring Zone",
        "crs": "EPSG:4326",
        "center": [28.6289, 77.2495],
        "default_zoom": 12,
        "bounding_box": {
            "min_lon": 77.2150,
            "min_lat": 28.5700,
            "max_lon": 77.2750,
            "max_lat": 28.7100
        },
        "description": "Riverine Channel Pilot · 28 Industrial Sluice Weir Foam & Macroplastic Traps",
        "status": "active"
    }
}


class GeoJSONStore:
    def __init__(self):
        self._hotspots_cache: Dict[str, Dict[str, Any]] = {}
        self._water_masks_cache: Dict[str, Dict[str, Any]] = {}

    def get_available_basins(self) -> List[Dict[str, Any]]:
        return list(BASINS_METADATA.values())

    def normalize_basin(self, basin: Optional[str]) -> str:
        if not basin:
            return "jayakwadi"
        b = str(basin).lower().strip()
        if b in BASINS_METADATA:
            return b
        if "hussain" in b or "krishna" in b:
            return "hussainsagar"
        if "yamuna" in b or "ganges" in b or "ganga" in b or "delhi" in b:
            return "yamuna"
        return "jayakwadi"

    def get_water_masks(self, basin: Optional[str] = "jayakwadi") -> Dict[str, Any]:
        basin_id = self.normalize_basin(basin)
        if basin_id in self._water_masks_cache:
            return self._water_masks_cache[basin_id]

        if basin_id == "jayakwadi":
            if WATER_MASKS_PATH.exists():
                with open(WATER_MASKS_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
            else:
                data = {"type": "FeatureCollection", "features": []}
        else:
            file_path = BASINS_DATA_DIR / basin_id / "water_masks.geojson"
            if file_path.exists():
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            else:
                data = {"type": "FeatureCollection", "features": []}

        self._water_masks_cache[basin_id] = data
        return data

    def get_hotspots(self, basin: Optional[str] = "jayakwadi", force_refresh: bool = False) -> Dict[str, Any]:
        basin_id = self.normalize_basin(basin)
        if not force_refresh and basin_id in self._hotspots_cache:
            return self._hotspots_cache[basin_id]

        if basin_id == "jayakwadi":
            masks = self.get_water_masks("jayakwadi")
            if not masks.get("features"):
                data = {"type": "FeatureCollection", "features": []}
            else:
                data = stac_satellite_service.generate_provider_hotspots(masks)
        else:
            file_path = BASINS_DATA_DIR / basin_id / "hotspots.geojson"
            if file_path.exists():
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            else:
                data = {"type": "FeatureCollection", "features": []}

        self._hotspots_cache[basin_id] = data
        return data

    def get_study_area_metadata(self, basin: Optional[str] = "jayakwadi") -> Dict[str, Any]:
        basin_id = self.normalize_basin(basin)
        info = BASINS_METADATA.get(basin_id, BASINS_METADATA["jayakwadi"])
        hotspots = self.get_hotspots(basin_id)
        masks = self.get_water_masks(basin_id)

        return {
            "basin_id": info["id"],
            "basin": info["basin"],
            "region": info["region"],
            "study_area_name": info["study_area_name"],
            "crs": info["crs"],
            "center": info["center"],
            "default_zoom": info["default_zoom"],
            "bounding_box": info["bounding_box"],
            "description": info["description"],
            "datasets": {
                "hotspots_count": len(hotspots.get("features", [])),
                "water_masks_count": len(masks.get("features", [])),
                "source": "Sentinel-2 Level-2A (Cerra et al., 2025 approach)",
                "status": "unverified_candidate_hotspots",
                "satellite_constellation": "Copernicus Sentinel-2 (MSI L2A)",
                "data_provider": "Microsoft Planetary Computer / ESA Copernicus (100% Free Open Data)",
                "classifier": "Biermann FDI & MARIDA Multi-Spectral Decision Benchmark (Biermann et al., 2020; Kikaki et al., 2022)"
            }
        }


geojson_store = GeoJSONStore()
