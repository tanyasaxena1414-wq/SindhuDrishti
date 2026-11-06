import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { 
  StudyAreaMetadata, 
  GeoJSONFeatureCollection, 
  HotspotProperties, 
  WaterMaskProperties, 
  GeoJSONFeature 
} from '../../types';
import { MapViewport } from './MapViewport';
import { MapControls, MapLayerState } from './MapControls';
import { Compass, RefreshCw, AlertTriangle } from 'lucide-react';

interface MapPageProps {
  currentBasin?: import('../../types').BasinId;
  onSelectBasin?: (basin: import('../../types').BasinId) => void;
}

export const MapPage: React.FC<MapPageProps> = ({
  currentBasin = 'jayakwadi',
  onSelectBasin,
}) => {
  const [studyArea, setStudyArea] = useState<StudyAreaMetadata | null>(null);
  const [waterMasks, setWaterMasks] = useState<GeoJSONFeatureCollection<WaterMaskProperties> | null>(null);
  const [hotspots, setHotspots] = useState<GeoJSONFeatureCollection<HotspotProperties> | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<GeoJSONFeature<HotspotProperties> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [changeDetectionData, setChangeDetectionData] = useState<import('../../types').SatelliteChangeDetectionResponse | null>(null);
  const [waterMaskAnalysis, setWaterMaskAnalysis] = useState<import('../../types').WaterMaskAnalysis | null>(null);

  const [layerState, setLayerState] = useState<MapLayerState>({
    basemap: true,
    basemapOpacity: 0.9,
    waterMasks: true,
    waterAlgorithm: 'mndwi',
    waterThreshold: 0.12,
    hotspots: true,
    studyBoundary: true,
    gridOverlay: true,
    minHotspotArea: 0,
    minConfidence: 0,
    spectralClass: 'all',
    zone: 'all',
    excludeArtifacts: false,
    changeDetectionMode: false,
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const b = currentBasin;
      const [studyRes, masksRes, spotsRes, maskAnalysisRes] = await Promise.all([
        api.getStudyArea(b).catch(() => null),
        api.getWaterMasks(b).catch((err) => {
          console.warn('Failed to load water masks:', err);
          return null;
        }),
        api.getHotspots({
          basin: b,
          water_only: true,
          min_area: layerState.minHotspotArea,
          min_confidence: (layerState.minConfidence && layerState.minConfidence > 0) ? layerState.minConfidence : undefined,
          spectral_class: layerState.spectralClass !== 'all' ? layerState.spectralClass : undefined,
          zone: layerState.zone !== 'all' ? layerState.zone : undefined,
          exclude_artifacts: layerState.excludeArtifacts ? true : undefined,
        }).catch((err) => {
          console.warn('Failed to load hotspots:', err);
          return null;
        }),
        api.getWaterMaskAnalysis({
          basin: b,
          algorithm: layerState.waterAlgorithm || 'mndwi',
          threshold: layerState.waterThreshold !== undefined ? layerState.waterThreshold : 0.12,
        }).catch(() => null),
      ]);

      if (studyRes) setStudyArea(studyRes);
      if (masksRes) setWaterMasks(masksRes);
      if (spotsRes) setHotspots(spotsRes);
      if (maskAnalysisRes) setWaterMaskAnalysis(maskAnalysisRes);
    } catch (err: any) {
      setErrorMessage(err.message || 'Geospatial service connection failed');
    } finally {
      setIsLoading(false);
    }
  }, [
    currentBasin,
    layerState.minHotspotArea, 
    layerState.minConfidence, 
    layerState.spectralClass,
    layerState.zone,
    layerState.excludeArtifacts,
    layerState.waterAlgorithm,
    layerState.waterThreshold
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (layerState.changeDetectionMode && !changeDetectionData) {
      api.getChangeDetection().then(setChangeDetectionData).catch((err) => {
        console.warn('Failed to load change detection data:', err);
      });
    }
  }, [layerState.changeDetectionMode, changeDetectionData]);

  const [resetCount, setResetCount] = useState<number>(0);

  const handleChangeLayerState = (updated: Partial<MapLayerState>) => {
    setLayerState((prev) => ({ ...prev, ...updated }));
  };

  return (
    <div className="flex-1 w-full max-w-[1720px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-4 font-['DM_Sans',sans-serif]">
      {/* Workspace Subheader */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-sky-950/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Geospatial Basin Explorer</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                Sentinel-2 L2A
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              {studyArea?.study_area_name || 'Jayakwadi Reservoir / Nath Sagar'} · {studyArea?.region || 'Maharashtra, India'} · EPSG:4326 CRS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Basin Switcher Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#030919] border border-sky-800/60 text-xs font-mono shadow-[0_0_15px_rgba(56,189,248,0.15)]">
            <span className="text-zinc-500 text-[11px]">Basin:</span>
            <select
              aria-label="Map Target Watershed Basin"
              value={currentBasin}
              onChange={(e) => onSelectBasin && onSelectBasin(e.target.value as import('../../types').BasinId)}
              className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="jayakwadi" className="bg-[#030919] text-white">🌊 Jayakwadi (Godavari)</option>
              <option value="hussainsagar" className="bg-[#030919] text-white">🏙️ Hussain Sagar (Krishna)</option>
            </select>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#030919] border border-sky-900/60 text-xs font-mono text-zinc-300 hover:text-white hover:border-cyan-400 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Map + Controls Layout */}
      <div className="flex-1 flex flex-col-reverse lg:flex-row gap-4 items-stretch min-h-[620px]">
        {/* Left: Map Controls Sidebar */}
        <MapControls
          layerState={layerState}
          onChangeLayerState={handleChangeLayerState}
          studyArea={studyArea}
          totalHotspots={hotspots?.features.length ?? 0}
          filteredHotspotsCount={hotspots?.features.length ?? 0}
          onResetView={() => setResetCount((c) => c + 1)}
          isLoading={isLoading}
          changeDetectionData={changeDetectionData}
          waterMaskAnalysis={waterMaskAnalysis}
        />

        {/* Right: Interactive Viewport */}
        <div className="flex-1 w-full h-[620px] lg:h-auto">
          <MapViewport
            studyArea={studyArea}
            layerState={layerState}
            waterMasks={waterMasks}
            hotspots={hotspots}
            isLoading={isLoading}
            activeHotspot={activeHotspot}
            onSelectHotspot={setActiveHotspot}
            resetTrigger={resetCount}
            changeDetectionData={changeDetectionData}
            waterMaskAnalysis={waterMaskAnalysis}
          />
        </div>
      </div>
    </div>
  );
};
