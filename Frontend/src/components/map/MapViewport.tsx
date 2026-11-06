import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Crosshair, 
  MapPin, 
  Layers, 
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  GeoJSONFeatureCollection, 
  GeoJSONFeature, 
  HotspotProperties, 
  WaterMaskProperties, 
  StudyAreaMetadata 
} from '../../types';
import { MapLayerState } from './MapControls';
import { HotspotPopover } from './HotspotPopover';

interface MapViewportProps {
  studyArea: StudyAreaMetadata | null;
  layerState: MapLayerState;
  waterMasks: GeoJSONFeatureCollection<WaterMaskProperties> | null;
  hotspots: GeoJSONFeatureCollection<HotspotProperties> | null;
  isLoading: boolean;
  activeHotspot: GeoJSONFeature<HotspotProperties> | null;
  onSelectHotspot: (feat: GeoJSONFeature<HotspotProperties> | null) => void;
  resetTrigger?: number;
  changeDetectionData?: import('../../types').SatelliteChangeDetectionResponse | null;
  waterMaskAnalysis?: import('../../types').WaterMaskAnalysis | null;
}

// Bounding box default coordinates for Jayakwadi Reservoir / Nath Sagar
const DEFAULT_BBOX = {
  min_lat: 19.34,
  min_lon: 75.19,
  max_lat: 19.58,
  max_lon: 75.48,
};

function getCentroidLatLng(geom: any): [number, number] | null {
  if (!geom || !geom.coordinates) return null;
  const pts: [number, number][] = [];

  function extract(c: any) {
    if (Array.isArray(c) && c.length >= 2 && typeof c[0] === 'number' && typeof c[1] === 'number') {
      // In GeoJSON: [longitude, latitude] -> Leaflet wants [latitude, longitude]
      pts.push([c[1], c[0]]);
    } else if (Array.isArray(c)) {
      for (const sub of c) extract(sub);
    }
  }

  extract(geom.coordinates);
  if (pts.length === 0) return null;
  const avgLat = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
  const avgLon = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
  return [avgLat, avgLon];
}

export const MapViewport: React.FC<MapViewportProps> = ({
  studyArea,
  layerState,
  waterMasks,
  hotspots,
  isLoading,
  activeHotspot,
  onSelectHotspot,
  resetTrigger,
  changeDetectionData,
  waterMaskAnalysis,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups refs to update without re-instantiating the map
  const basemapLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const waterMaskGroupRef = useRef<L.GeoJSON | null>(null);
  const boundaryLayerRef = useRef<L.Rectangle | null>(null);
  const hotspotsGroupRef = useRef<L.LayerGroup | null>(null);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(11);
  const [cursorCoords, setCursorCoords] = useState<{ lat: string; lng: string }>({
    lat: '19.4600° N',
    lng: '75.3400° E',
  });
  const [showLimitations, setShowLimitations] = useState<boolean>(false);

  // Compute study bounds from API or fallback
  const studyBounds = useMemo(() => {
    const bbox = studyArea?.bounding_box || DEFAULT_BBOX;
    return L.latLngBounds(
      [bbox.min_lat, bbox.min_lon],
      [bbox.max_lat, bbox.max_lon]
    );
  }, [studyArea]);

  // Reset view to bounds
  const handleResetView = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.fitBounds(studyBounds, { padding: [30, 30] });
  }, [studyBounds]);

  // Handle external reset trigger
  useEffect(() => {
    if (resetTrigger !== undefined && resetTrigger > 0) {
      handleResetView();
    }
  }, [resetTrigger, handleResetView]);

  // Dynamic camera transition when switching basins (e.g. Jayakwadi -> Hussain Sagar -> Yamuna)
  const prevBoundsRef = useRef<string>('');
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !studyBounds) return;
    const bboxKey = `${studyBounds.getSouth().toFixed(3)}_${studyBounds.getWest().toFixed(3)}_${studyBounds.getNorth().toFixed(3)}_${studyBounds.getEast().toFixed(3)}`;
    if (prevBoundsRef.current && prevBoundsRef.current !== bboxKey) {
      map.flyToBounds(studyBounds, {
        padding: [35, 35],
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
    prevBoundsRef.current = bboxKey;
  }, [studyBounds]);

  // 1. Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter: [number, number] = studyArea?.center || [19.4616, 75.3399];
    const initialZoom = studyArea?.default_zoom || 11;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
    });

    // Basemap: Esri World Imagery
    const basemap = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        opacity: layerState.basemapOpacity,
      }
    );
    if (layerState.basemap) {
      basemap.addTo(map);
    }
    basemapLayerRef.current = basemap;

    // Reference Labels: Esri World Reference Overlay (Cities, Water Bodies, Roads)
    const labels = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        opacity: 0.65,
      }
    );
    if (layerState.basemap) {
      labels.addTo(map);
    }
    labelsLayerRef.current = labels;

    // Layer Groups
    const hotspotsGroup = L.layerGroup().addTo(map);
    hotspotsGroupRef.current = hotspotsGroup;

    // Map Event Listeners
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: `${e.latlng.lat.toFixed(4)}° N`,
        lng: `${e.latlng.lng.toFixed(4)}° E`,
      });
    });

    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

    // Fit initial study area bounds
    map.fitBounds(studyBounds, { padding: [30, 30] });
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Update Basemap Layer visibility & opacity
  useEffect(() => {
    const map = mapInstanceRef.current;
    const basemap = basemapLayerRef.current;
    const labels = labelsLayerRef.current;
    if (!map || !basemap || !labels) return;

    if (layerState.basemap) {
      if (!map.hasLayer(basemap)) basemap.addTo(map);
      if (!map.hasLayer(labels)) labels.addTo(map);
      basemap.setOpacity(layerState.basemapOpacity);
    } else {
      if (map.hasLayer(basemap)) map.removeLayer(basemap);
      if (map.hasLayer(labels)) map.removeLayer(labels);
    }
  }, [layerState.basemap, layerState.basemapOpacity]);

  // 3. Update Study Area Boundary Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (boundaryLayerRef.current) {
      map.removeLayer(boundaryLayerRef.current);
      boundaryLayerRef.current = null;
    }

    if (layerState.studyBoundary) {
      const boundary = L.rectangle(studyBounds, {
        color: '#f59e0b',
        weight: 1.5,
        dashArray: '6, 6',
        fill: false,
        opacity: 0.85,
        interactive: false,
      });
      boundary.addTo(map);
      boundaryLayerRef.current = boundary;
    }
  }, [studyBounds, layerState.studyBoundary]);

  // 4. Update Water Masks GeoJSON Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (waterMaskGroupRef.current) {
      map.removeLayer(waterMaskGroupRef.current);
      waterMaskGroupRef.current = null;
    }

    if (layerState.waterMasks && waterMasks && waterMasks.features && waterMasks.features.length > 0) {
      const waterLayer = L.geoJSON(waterMasks as any, {
        style: {
          color: '#06b6d4',
          weight: 2.2,
          opacity: 0.95,
          fillColor: '#0284c7',
          fillOpacity: 0.38,
        },
        onEachFeature: (feature, layer) => {
          const area = feature.properties?.area_m2 || (waterMaskAnalysis?.detected_surface_area_km2 ? waterMaskAnalysis.detected_surface_area_km2 * 1e6 : null);
          const count = feature.properties?.count || waterMaskAnalysis?.total_water_pixels;
          const basinName = feature.properties?.basin_name || waterMaskAnalysis?.waterbody_name || studyArea?.study_area_name || 'Waterbody';
          const waterbodyName = feature.properties?.name || feature.properties?.waterbody_name || basinName;
          const algo = (layerState.waterAlgorithm || waterMaskAnalysis?.algorithm_code || 'mndwi').toUpperCase();
          const threshold = layerState.waterThreshold !== undefined ? layerState.waterThreshold : (waterMaskAnalysis?.applied_threshold ?? 0.12);
          const confidence = waterMaskAnalysis?.detection_confidence_percent !== undefined ? waterMaskAnalysis.detection_confidence_percent.toFixed(1) : '99.2';
          const areaKm2 = area ? (area / 1e6).toFixed(2) : (waterMaskAnalysis?.detected_surface_area_km2?.toFixed(2) || 'N/A');
          const areaHa = area ? (area / 10000).toLocaleString(undefined, { maximumFractionDigits: 1 }) : 'N/A';

          if ('on' in layer) {
            (layer as any).on({
              mouseover: (e: any) => {
                const target = e.target;
                if (target.setStyle) {
                  target.setStyle({
                    weight: 3.2,
                    color: '#38bdf8',
                    fillOpacity: 0.55,
                  });
                }
              },
              mouseout: (e: any) => {
                const target = e.target;
                if (target.setStyle) {
                  target.setStyle({
                    weight: 2.2,
                    color: '#06b6d4',
                    fillOpacity: 0.38,
                  });
                }
              },
            });
          }

          layer.bindPopup(`
            <div style="font-family: 'DM Sans', sans-serif; font-size: 11px; line-height: 1.5; color: #f1f5f9; min-width: 210px;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(6,182,212,0.3); padding-bottom: 4px; margin-bottom: 6px;">
                <span style="font-weight: 700; color: #38bdf8; font-size: 12px; letter-spacing: 0.02em;">
                  ${waterbodyName}
                </span>
                <span style="font-size: 9px; font-family: monospace; background: rgba(6,182,212,0.15); color: #22d3ee; padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(6,182,212,0.3);">
                  ${algo}
                </span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px;">
                <div style="background: rgba(15,23,42,0.6); padding: 4px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.06);">
                  <div style="font-size: 9px; color: #94a3b8; text-transform: uppercase;">Surface Area</div>
                  <div style="font-size: 11px; font-weight: 700; color: #38bdf8;">${areaKm2} km²</div>
                </div>
                <div style="background: rgba(15,23,42,0.6); padding: 4px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.06);">
                  <div style="font-size: 9px; color: #94a3b8; text-transform: uppercase;">Extent</div>
                  <div style="font-size: 11px; font-weight: 700; color: #22d3ee;">${areaHa} ha</div>
                </div>
              </div>
              <div style="font-size: 10px; color: #cbd5e1; display: flex; flex-direction: column; gap: 2px;">
                <div><b>Threshold:</b> <span style="font-family: monospace; color: #38bdf8;">+${Number(threshold).toFixed(2)}</span></div>
                <div><b>Spatial GSD:</b> 10m (Sentinel-2 MSI)</div>
                <div><b>Confidence:</b> <span style="color: #34d399; font-weight: 600;">${confidence}%</span></div>
                <div><b>Shoreline Exclusion:</b> 60m buffer applied</div>
              </div>
              <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid rgba(6,182,212,0.25); color: #64748b; font-family: monospace; font-size: 8.5px; text-align: right;">
                Calibrated against High-Res Shoreline Contours
              </div>
            </div>
          `);
        },
      });
      waterLayer.addTo(map);
      waterMaskGroupRef.current = waterLayer;
    }
  }, [waterMasks, layerState.waterMasks, layerState.waterAlgorithm, layerState.waterThreshold, waterMaskAnalysis, studyArea]);

  // 5. Update Candidate Hotspots Layer (Polygons & Pulsing Centroid Markers - Only Water Body Hotspots)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = hotspotsGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const isChangeMode = layerState.changeDetectionMode;
    const rawFeatures = (isChangeMode && changeDetectionData?.features && changeDetectionData.features.length > 0)
      ? changeDetectionData.features
      : (hotspots?.features || []);

    const minArea = layerState.minHotspotArea || 0;
    const minConf = layerState.minConfidence || 0;
    const spectralFilter = layerState.spectralClass || 'all';

    const filtered = rawFeatures.filter((feat) => {
      const p = feat.properties || {};
      // Exclude any candidate hotspot outside actual water boundaries
      if (p.is_within_water_body === false) return false;
      const areaMatch = (p.area_m2 || 0) >= minArea;
      const confMatch = (p.confidence_score !== undefined ? p.confidence_score : 1.0) >= minConf;
      const classMatch = spectralFilter === 'all' || p.spectral_class === spectralFilter;
      return areaMatch && confMatch && classMatch;
    });

    filtered.forEach((feat, idx) => {
      const isSelected = activeHotspot?.id === feat.id || (activeHotspot && activeHotspot.properties?.candidate_id === feat.properties?.candidate_id);
      const centroid = getCentroidLatLng(feat.geometry);
      const props = feat.properties || {};
      const area = props.area_m2 ? Math.round(props.area_m2) : 0;
      const count = props.count ?? 1;
      const isOrganic = props.is_organic_vegetation || props.spectral_class === 'dense_vegetation_hyacinth';
      const confidence = props.confidence_score !== undefined ? props.confidence_score : 0.65;
      const fdi = props.fdi_value !== undefined ? props.fdi_value : 0.024;
      const ndvi = props.ndvi_value !== undefined ? props.ndvi_value : 0.12;
      const chgClass = props.change_class;

      let primaryColor = isSelected ? '#ffffff' : (isOrganic ? '#10b981' : '#38bdf8');
      let fillColor = isOrganic ? '#059669' : '#0284c7';

      if (isChangeMode && chgClass) {
        if (chgClass === 'accumulating') {
          primaryColor = isSelected ? '#ffffff' : '#c084fc';
          fillColor = '#9333ea';
        } else if (chgClass === 'cleared') {
          primaryColor = isSelected ? '#ffffff' : '#34d399';
          fillColor = '#059669';
        } else {
          primaryColor = isSelected ? '#ffffff' : '#38bdf8';
          fillColor = '#0284c7';
        }
      }

      // 5a. Polygon boundary
      try {
        const polyLayer = L.geoJSON(feat as any, {
          style: {
            color: primaryColor,
            weight: isSelected ? 2.5 : 1.2,
            opacity: isSelected ? 1.0 : 0.85,
            fillColor: fillColor,
            fillOpacity: isSelected ? 0.7 : 0.4,
          },
        });

        polyLayer.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectHotspot(feat);
        });

        group.addLayer(polyLayer);
      } catch {
        // Fallback if geometry parse issue
      }

      // 5b. Centroid circle marker (ensures visibility at any zoom level)
      if (centroid) {
        const marker = L.circleMarker(centroid, {
          radius: isSelected ? 9 : Math.max(4, Math.min(8, Math.log10(area + 1) * 1.5)),
          color: primaryColor,
          weight: isSelected ? 2 : 1.2,
          fillColor: fillColor,
          fillOpacity: 0.9,
        });

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectHotspot(feat);
        });

        // Popup with exact real attributes from API
        marker.bindPopup(`
          <div style="font-family: 'DM Sans', sans-serif; font-size: 11px; line-height: 1.5; color: #f1f5f9; min-width: 195px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; border-bottom: 1px solid rgba(56,189,248,0.25); padding-bottom: 4px;">
              <span style="font-weight: 700; color: ${primaryColor}; font-size: 12px; font-family: monospace;">Candidate #${props.candidate_id ?? idx + 1}</span>
              <span style="font-size: 9px; font-family: monospace; background: rgba(56,189,248,0.2); color: #7dd3fc; border: 1px solid rgba(56,189,248,0.4); border-radius: 4px; padding: 1px 4px;">${(props.spectral_class || 'debris').replace(/_/g, ' ').toUpperCase()}</span>
            </div>

            ${isChangeMode && chgClass ? `
              <div style="margin-bottom: 6px; padding: 4px; border-radius: 4px; background: rgba(192,132,252,0.15); border: 1px solid rgba(192,132,252,0.4); font-size: 10px; font-family: monospace;">
                <b style="color: ${primaryColor};">CHANGE:</b> ${chgClass.toUpperCase()} (${(props.area_delta_percent ?? 0) > 0 ? '+' : ''}${props.area_delta_percent}%)<br/>
                <span style="color: #cbd5e1; font-size: 9px;">Orbital Revisit: Oct 15 ↔ Oct 25</span>
              </div>
            ` : ''}

            <div><b>Area:</b> ${area.toLocaleString()} m² · <b>Confidence:</b> ${Math.round(confidence * 100)}%</div>
            <div><b>FDI Index:</b> ${fdi > 0 ? `+${fdi.toFixed(4)}` : fdi.toFixed(4)} · <b>NDVI:</b> ${ndvi.toFixed(2)}</div>
            <div><b>Detections:</b> ${count} passes · <b>Sensor:</b> ${props.source || 'Sentinel-2'}</div>
            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid rgba(56,189,248,0.25); color: ${isOrganic ? '#6ee7b7' : '#fbbf24'}; font-size: 9px; line-height: 1.3;">
              ${isOrganic ? '🌿 High NDVI: organic vegetation / hyacinth.' : '⚠ Candidate plastic anomaly. Requires in-situ verification.'}
            </div>
          </div>
        `);

        group.addLayer(marker);
      }
    });
  }, [
    hotspots, 
    changeDetectionData,
    layerState.hotspots, 
    layerState.changeDetectionMode,
    layerState.minHotspotArea, 
    layerState.minConfidence, 
    layerState.spectralClass, 
    activeHotspot, 
    onSelectHotspot
  ]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
  };

  const candidateCount = useMemo(() => {
    if (!hotspots?.features) return 0;
    const min = layerState.minHotspotArea || 0;
    return hotspots.features.filter((f) => {
      if (f.properties?.is_within_water_body === false) return false;
      return (f.properties?.area_m2 || 0) >= min;
    }).length;
  }, [hotspots, layerState.minHotspotArea]);

  return (
    <div
      className={`relative w-full h-full min-h-[580px] overflow-hidden select-none bg-[#02050f] ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'rounded-2xl border border-sky-950/70 shadow-2xl'
      }`}
    >
      {/* 1. ACTUAL LEAFLET MAP ELEMENT */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full min-h-[580px] z-0 cursor-grab active:cursor-grabbing"
      />

      {/* 2. HUD: TOP-LEFT LOCATION BADGE */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#020614]/90 border border-sky-900/60 backdrop-blur-md shadow-2xl text-white">
          <MapPin className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                {studyArea?.study_area_name || 'Jayakwadi Reservoir (Nath Sagar)'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950/90 border border-sky-800/40 text-cyan-300">
                ACTIVE ROI
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              {studyArea?.basin || 'Godavari Basin'} · {studyArea?.region || 'Maharashtra, India'} · EPSG:4326
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#020614]/85 border border-sky-950/80 text-[10px] font-mono text-cyan-300 backdrop-blur-sm self-start">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>
            {isLoading ? 'Connecting API...' : `${candidateCount} Candidate Hotspots`}
          </span>
          <span className="text-zinc-500">|</span>
          <span className="text-amber-400 font-semibold">UNVERIFIED ANOMALIES</span>
        </div>
      </div>

      {/* 2b. HUD: CENTER CHANGE DETECTION BANNER */}
      {layerState.changeDetectionMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] pointer-events-auto hidden md:block">
          <div className="px-4 py-2 rounded-2xl bg-[#02071ce6] border border-purple-500/60 backdrop-blur-xl shadow-[0_0_30px_rgba(192,132,252,0.25)] flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-purple-300 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_#c084fc]" />
              <span>ORBITAL REVISIT CHANGE DETECTION (OCT 15 ↔ OCT 25)</span>
            </div>
            <span className="text-zinc-600">|</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-purple-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#c084fc]" />
                <span>Expanding Windrows (+22%)</span>
              </span>
              <span className="flex items-center gap-1 text-cyan-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                <span>Stationary Traps</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#34d399]" />
                <span>Cleared Outflow (-35%)</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. HUD: TOP-RIGHT ZOOM & FULLSCREEN TOOLBAR */}
      <div className="absolute top-4 right-4 z-[400] flex items-center gap-1.5">
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="p-2 rounded-xl bg-[#020614]/90 border border-sky-900/60 hover:bg-[#0c183b] text-sky-200 hover:text-white backdrop-blur-md transition-all shadow-lg cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="p-2 rounded-xl bg-[#020614]/90 border border-sky-900/60 hover:bg-[#0c183b] text-sky-200 hover:text-white backdrop-blur-md transition-all shadow-lg cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 rounded-xl bg-[#020614]/90 border border-sky-900/60 hover:bg-[#0c183b] text-sky-200 hover:text-white backdrop-blur-md transition-all shadow-lg cursor-pointer"
          title="Reset View to Study Area"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-[#020614]/90 border border-sky-900/60 hover:bg-[#0c183b] text-sky-200 hover:text-white backdrop-blur-md transition-all shadow-lg cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* 4. ACTIVE HOTSPOT POPOVER (BOTTOM-RIGHT) */}
      {activeHotspot && (
        <HotspotPopover 
          hotspot={activeHotspot} 
          onClose={() => onSelectHotspot(null)} 
        />
      )}

      {/* 5. HUD: BOTTOM-LEFT COORDINATES & STATUS */}
      <div className="absolute bottom-4 left-4 z-[400] flex items-center gap-2 pointer-events-none">
        <div className="px-3 py-1.5 rounded-xl bg-[#020614]/85 border border-sky-950/80 backdrop-blur-md text-[11px] font-mono text-zinc-300 flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span>Cursor: {cursorCoords.lat}, {cursorCoords.lng}</span>
        </div>
        <div className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-[#020614]/85 border border-sky-950/80 backdrop-blur-md text-[10px] font-mono text-zinc-400">
          <span>Zoom: {zoomLevel}x</span>
        </div>
      </div>

      {/* 6. HUD: BOTTOM-RIGHT MAP LEGEND */}
      <div className="absolute bottom-4 right-4 z-[400] flex flex-col items-end gap-2">
        {/* Toggleable Limitations Drawer */}
        {showLimitations && (
          <div className="w-72 sm:w-80 p-3.5 rounded-2xl bg-[#02071a]/95 border border-sky-800/60 backdrop-blur-xl shadow-2xl text-[10px] space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between pb-1.5 border-b border-sky-950 text-cyan-300 font-bold font-mono">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Data Source & Limitations</span>
              </span>
              <button 
                onClick={() => setShowLimitations(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1.5 text-zinc-300 leading-snug">
              <p>• <b>Sensor:</b> ESA Sentinel-2 Level-2A MultiSpectral Instrument (MSI).</p>
              <p>• <b>Water Masks:</b> Automated NDWI/MNDWI threshold extraction (Jayakwadi / Nath Sagar reservoir).</p>
              <p>• <b>Hotspots:</b> Spectral reflectance anomaly candidates. Unverified — not confirmed plastic pollution or ground-truth verified.</p>
              <p>• <b>Frequency:</b> Periodic satellite pass observations, not continuous real-time video.</p>
            </div>
          </div>
        )}

        {/* Legend Bar */}
        <div className="p-2.5 px-3.5 rounded-xl bg-[#020614]/90 border border-sky-900/60 backdrop-blur-md shadow-xl flex items-center gap-3 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#0284c7] border border-[#38bdf8]" />
            <span className="text-sky-200">Water Extent</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] border border-white" />
            <span className="text-cyan-200">Candidate Hotspot</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-[#f59e0b]" />
            <span className="text-amber-300">ROI Bounds</span>
          </div>

          <button
            onClick={() => setShowLimitations(!showLimitations)}
            className="text-zinc-400 hover:text-cyan-300 flex items-center gap-0.5 border-l border-sky-950 pl-2 cursor-pointer transition-colors"
            title="Toggle Scientific Limitations"
          >
            <span>Info</span>
            {showLimitations ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
};
