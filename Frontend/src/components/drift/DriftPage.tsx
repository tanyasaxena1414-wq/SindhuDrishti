import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { 
  DriftSimulateRequest, 
  DriftSimulateResponse, 
  GeoJSONFeatureCollection, 
  WaterMaskProperties, 
  HotspotProperties 
} from '../../types';
import { DriftControls } from './DriftControls';
import { DriftCanvas } from './DriftCanvas';
import { DriftSummary } from './DriftSummary';
import { Wind, Activity, AlertTriangle, RefreshCw, Crosshair } from 'lucide-react';

export const DriftPage: React.FC = () => {
  const [params, setParams] = useState<DriftSimulateRequest>(() => {
    // Check if query params were passed from the map popover
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const qLat = parseFloat(urlParams.get('lat') || '');
      const qLon = parseFloat(urlParams.get('lon') || '');
      const qId = urlParams.get('hotspot_id') || undefined;
      const qName = urlParams.get('name') || undefined;
      if (!isNaN(qLat) && !isNaN(qLon)) {
        return {
          latitude: qLat,
          longitude: qLon,
          duration_hours: 24,
          timestep_minutes: 60,
          particle_count: 1, // Single debris focused track
          current_velocity_ms: 0.22,
          current_direction_deg: 85, // Main Godavari channel flow towards Paithan Dam
          wind_factor: 0.02,
          wind_speed_ms: 3.2,
          wind_direction_deg: 80,
          random_seed: 42,
          hotspot_id: qId,
          debris_name: qName,
        };
      }
    }

    return {
      latitude: 19.495,
      longitude: 75.335,
      duration_hours: 24,
      timestep_minutes: 60,
      particle_count: 1, // Single debris focused track by default
      current_velocity_ms: 0.22,
      current_direction_deg: 85, // Main Godavari channel flow towards Paithan Dam
      wind_factor: 0.02,
      wind_speed_ms: 3.2,
      wind_direction_deg: 80,
      random_seed: 42,
      hotspot_id: 'pelagic-windrow-1',
      debris_name: 'Central Inflow Convergence Windrow Alpha',
    };
  });

  const [simulation, setSimulation] = useState<DriftSimulateResponse | null>(null);
  const [waterMasks, setWaterMasks] = useState<GeoJSONFeatureCollection<WaterMaskProperties> | null>(null);
  const [hotspots, setHotspots] = useState<GeoJSONFeatureCollection<HotspotProperties> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    api.getWaterMasks().then(setWaterMasks).catch((err) => {
      console.warn('Could not load water masks for drift map', err);
    });
    api.getHotspots().then(setHotspots).catch((err) => {
      console.warn('Could not load hotspots for drift map', err);
    });
  }, []);

  const handleExecute = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.simulateDrift(params);
      setSimulation(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Drift simulation failed to execute');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    handleExecute();
  }, [params.latitude, params.longitude, params.particle_count]);

  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const maxSteps = simulation?.particles?.[0]?.trajectory?.length || 0;

  // Single-source-of-truth playback loop (zero stale closures)
  useEffect(() => {
    if (!isPlaying || maxSteps <= 1) return;
    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= maxSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [isPlaying, maxSteps]);

  // Sync reset when simulation changes
  useEffect(() => {
    setStepIndex(0);
    setIsPlaying(false);
  }, [simulation?.simulation_id]);

  const currentStepHour = simulation?.particles?.[0]?.trajectory?.[stepIndex]?.time_offset_hours ?? 0;

  const handleSelectHour = (targetHour: number) => {
    setIsPlaying(false);
    if (!simulation?.particles?.[0]?.trajectory) return;
    const traj = simulation.particles[0].trajectory;
    const matchIdx = traj.findIndex((pt) => Math.abs(pt.time_offset_hours - targetHour) < 0.1);
    if (matchIdx >= 0) {
      setStepIndex(matchIdx);
    }
  };

  const handleTogglePlay = () => {
    if (stepIndex >= maxSteps - 1) {
      setStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const handleResetPlay = () => {
    setIsPlaying(false);
    setStepIndex(0);
  };

  const handleStepChange = (newIdx: number) => {
    setIsPlaying(false);
    setStepIndex(newIdx);
  };

  const handleChangeParams = (updated: Partial<DriftSimulateRequest>) => {
    setParams((prev) => ({ ...prev, ...updated }));
  };

  const handleSelectHotspotFromMap = (hotspotId: string) => {
    if (!hotspots?.features) return;
    const feat = hotspots.features.find((f) => f.id === hotspotId);
    if (!feat) return;

    const coords = (feat.geometry as any)?.coordinates;
    let lat = 19.485;
    let lon = 75.340;
    if (feat.geometry.type === 'Point') {
      lat = coords[1];
      lon = coords[0];
    } else if (feat.geometry.type === 'Polygon' && coords?.[0]?.[0]) {
      const ring = coords[0];
      lat = ring.reduce((s: number, c: number[]) => s + c[1], 0) / ring.length;
      lon = ring.reduce((s: number, c: number[]) => s + c[0], 0) / ring.length;
    }

    setParams((prev) => ({
      ...prev,
      latitude: parseFloat(lat.toFixed(5)),
      longitude: parseFloat(lon.toFixed(5)),
      hotspot_id: feat.id,
      debris_name: feat.properties?.name || feat.id,
    }));
  };

  const handleSelectCustomLocation = (lat: number, lon: number) => {
    setParams((prev) => ({
      ...prev,
      latitude: parseFloat(lat.toFixed(5)),
      longitude: parseFloat(lon.toFixed(5)),
      hotspot_id: 'custom-release',
      debris_name: `Custom Release Point (${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`,
      particle_count: 1,
    }));
  };

  return (
    <div className="flex-1 w-full max-w-[1720px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 font-['DM_Sans',sans-serif]">
      {/* Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-sky-950/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>NGO Field Recovery & Drift Hub</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">
                AUTO-HYDRODYNAMICS
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              Select detected debris anomalies and follow the hour-by-hour field collection schedule
            </p>
          </div>
        </div>

        <button
          onClick={handleExecute}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#030919] border border-sky-900/60 text-xs font-mono text-zinc-300 hover:text-white hover:border-cyan-400 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Re-Simulate Flow</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col-reverse lg:flex-row gap-5 items-stretch min-h-[600px]">
        {/* Left: NGO Field Dispatch Hub */}
        <DriftControls
          params={params}
          simulation={simulation}
          hotspots={hotspots}
          currentStepHour={currentStepHour}
          onSelectHour={handleSelectHour}
          onChangeParams={handleChangeParams}
          onExecute={handleExecute}
          isLoading={isLoading}
        />

        {/* Center & Right: Canvas + Output Summary */}
        <div className="flex-1 flex flex-col gap-5">
          <div className="flex-1 min-h-[480px]">
            <DriftCanvas 
              simulation={simulation} 
              waterMasks={waterMasks} 
              hotspots={hotspots}
              onSelectHotspot={handleSelectHotspotFromMap}
              onSelectCustomLocation={handleSelectCustomLocation}
              stepIndex={stepIndex}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onResetPlay={handleResetPlay}
              onStepChange={handleStepChange}
              isLoading={isLoading} 
            />
          </div>

          <DriftSummary simulation={simulation} />
        </div>
      </div>
    </div>
  );
};
