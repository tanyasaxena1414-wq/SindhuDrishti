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
import { useTheme } from '../../context/ThemeContext';

interface MapPageProps {
  currentBasin?: import('../../types').BasinId;
  onSelectBasin?: (basin: import('../../types').BasinId) => void;
}

export const MapPage: React.FC<MapPageProps> = ({
  currentBasin = 'jayakwadi',
  onSelectBasin,
}) => {
  const { isDark } = useTheme();
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
    <div className="flex-1 w-full max-w-[1720px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-4 font-sans">
      {/* Workspace Subheader */}
      <div 
        className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b transition-colors ${
          isDark ? 'border-[#0e2a47]' : 'border-[#cbd5e1]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div 
            className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm ${
              isDark 
                ? 'bg-[#073b55] border-[#18c9e8]/40 text-[#18c9e8]' 
                : 'bg-[#dceaf4] border-[#cbd5e1] text-[#0284c7]'
            }`}
          >
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
              <span>Geospatial Basin Explorer</span>
              <span 
                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                  isDark 
                    ? 'bg-[#051324] text-[#18c9e8] border border-[#18c9e8]/30' 
                    : 'bg-[#edf2f7] text-[#0284c7] border border-[#cbd5e1]'
                }`}
              >
                Sentinel-2 L2A
              </span>
            </h1>
            <p className="text-xs text-zinc-500">
              {studyArea?.study_area_name || 'Jayakwadi Reservoir / Nath Sagar'} · {studyArea?.region || 'Maharashtra, India'} · EPSG:4326 CRS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Basin Switcher Pill */}
          <div 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono shadow-sm ${
              isDark 
                ? 'bg-[#051324] border-[#0e2a47] text-white' 
                : 'bg-white border-[#cbd5e1] text-slate-800'
            }`}
          >
            <span className="text-zinc-500 text-[11px]">Basin:</span>
            <select
              aria-label="Map Target Watershed Basin"
              value={currentBasin}
              onChange={(e) => onSelectBasin && onSelectBasin(e.target.value as import('../../types').BasinId)}
              className={`bg-transparent font-bold focus:outline-none cursor-pointer text-xs ${
                isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]'
              }`}
            >
              <option value="jayakwadi" className={isDark ? 'bg-[#020817] text-white' : 'bg-white text-slate-900'}>
                🌊 Jayakwadi (Godavari)
              </option>
              <option value="hussainsagar" className={isDark ? 'bg-[#020817] text-white' : 'bg-white text-slate-900'}>
                🏙️ Hussain Sagar (Krishna)
              </option>
            </select>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer disabled:opacity-50 ${
              isDark 
                ? 'bg-[#051324] border-[#0e2a47] text-zinc-300 hover:text-white hover:border-[#18c9e8]' 
                : 'bg-white border-[#cbd5e1] text-zinc-700 hover:text-black hover:border-[#0284c7]'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#18c9e8]' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-500">
          <AlertTriangle className="w-4 h-4 shrink-0" />
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
