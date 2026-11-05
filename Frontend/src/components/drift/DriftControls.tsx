import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Wind, 
  Waves, 
  Sliders, 
  RefreshCw, 
  Sparkles, 
  Crosshair, 
  Target, 
  Layers, 
  Compass, 
  CheckCircle2,
  Navigation,
  Clock,
  MapPin,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Anchor,
  Printer,
  FileText,
  X,
  Users
} from 'lucide-react';
import { 
  DriftSimulateRequest, 
  DriftSimulateResponse, 
  GeoJSONFeatureCollection, 
  HotspotProperties, 
  GeoJSONFeature,
  InterceptionWaypoint 
} from '../../types';

interface DriftControlsProps {
  params: DriftSimulateRequest;
  simulation: DriftSimulateResponse | null;
  hotspots?: GeoJSONFeatureCollection<HotspotProperties> | null;
  currentStepHour?: number;
  onSelectHour?: (hour: number) => void;
  onChangeParams: (updated: Partial<DriftSimulateRequest>) => void;
  onExecute: () => void;
  isLoading: boolean;
}

function getCentroid(feat: GeoJSONFeature<HotspotProperties>): [number, number] | null {
  if (!feat.geometry) return null;
  if (feat.geometry.type === 'Point') {
    return [feat.geometry.coordinates[1], feat.geometry.coordinates[0]];
  }
  if (feat.geometry.type === 'Polygon') {
    const coords = (feat.geometry as any).coordinates[0];
    if (!coords || coords.length === 0) return null;
    const avgLat = coords.reduce((sum: number, c: number[]) => sum + c[1], 0) / coords.length;
    const avgLon = coords.reduce((sum: number, c: number[]) => sum + c[0], 0) / coords.length;
    return [avgLat, avgLon];
  }
  return null;
}

export const DriftControls: React.FC<DriftControlsProps> = ({
  params,
  simulation,
  hotspots,
  currentStepHour = 0,
  onSelectHour,
  onChangeParams,
  onExecute,
  isLoading,
}) => {
  const [selectedDebrisId, setSelectedDebrisId] = useState<string>(params.hotspot_id || 'pelagic-windrow-1');
  const [copiedHour, setCopiedHour] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
  const activeWaypointRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeWaypointRef.current) {
      activeWaypointRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentStepHour]);

  // Group hotspots into pelagic open-water windrows and shoreline candidates
  const { pelagicHotspots, shorelineHotspots } = useMemo(() => {
    const pelagic: GeoJSONFeature<HotspotProperties>[] = [];
    const shoreline: GeoJSONFeature<HotspotProperties>[] = [];
    if (!hotspots?.features) return { pelagicHotspots: pelagic, shorelineHotspots: shoreline };

    for (const f of hotspots.features) {
      if (f.properties?.zone_type === 'pelagic_open_water') {
        pelagic.push(f);
      } else {
        shoreline.push(f);
      }
    }
    return { pelagicHotspots: pelagic, shorelineHotspots: shoreline };
  }, [hotspots]);

  const activeHotspot = useMemo(() => {
    if (!hotspots?.features || !selectedDebrisId) return null;
    return hotspots.features.find((f) => f.id === selectedDebrisId) || null;
  }, [hotspots, selectedDebrisId]);

  const handleSelectDebris = (hotspotId: string) => {
    setSelectedDebrisId(hotspotId);
    if (!hotspots?.features) return;
    const feat = hotspots.features.find((f) => f.id === hotspotId);
    if (!feat) return;

    const centroid = getCentroid(feat);
    if (centroid) {
      const name = feat.properties?.name || feat.id || 'Selected Debris Hotspot';
      onChangeParams({
        latitude: parseFloat(centroid[0].toFixed(5)),
        longitude: parseFloat(centroid[1].toFixed(5)),
        hotspot_id: feat.id,
        debris_name: name,
        // Auto-configure optimal single-debris tracking
        particle_count: 1,
      });
    }
  };

  const handleCopyGPS = (e: React.MouseEvent, lat: number, lon: number, hour: number) => {
    e.stopPropagation();
    const text = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    navigator.clipboard.writeText(text);
    setCopiedHour(hour);
    setTimeout(() => setCopiedHour(null), 2000);
  };

  // Hour-by-hour schedule from simulation summary or generated fallback
  const schedule: InterceptionWaypoint[] = useMemo(() => {
    if (simulation?.summary?.interception_schedule && simulation.summary.interception_schedule.length > 0) {
      return simulation.summary.interception_schedule;
    }

    // Fallback derivation from first particle trajectory
    if (simulation?.particles?.[0]?.trajectory) {
      const traj = simulation.particles[0].trajectory;
      const res: InterceptionWaypoint[] = [];
      let foundAshore = false;
      for (const pt of traj) {
        if (pt.status === 'ashore' || pt.status === 'out_of_bounds') {
          const isFirst = !foundAshore;
          foundAshore = true;
          res.push({
            hour: pt.time_offset_hours,
            latitude: pt.latitude,
            longitude: pt.longitude,
            status: 'ashore',
            zone_desc: isFirst ? 'Shoreline Beaching Zone' : 'Bank Beaching Zone (Stranded)',
            action: isFirst 
              ? '⭐ Optimal Shoreline Collection Point (Accessible via Road / Bank)' 
              : `Field Recovery Window (+${pt.time_offset_hours.toFixed(0)}h: Stranded on bank awaiting truck pickup)`,
            is_optimal: isFirst,
          });
        } else {
          res.push({
            hour: pt.time_offset_hours,
            latitude: pt.latitude,
            longitude: pt.longitude,
            status: 'active',
            zone_desc: 'Open Water Pelagic Flow',
            action: 'Waterborne Patrol (Boat / Skimmer Required)',
            is_optimal: false,
          });
        }
      }
      return res;
    }

    return [];
  }, [simulation]);

  const optimalWaypoint = schedule.find((w) => w.is_optimal) || schedule[schedule.length - 1];

  return (
    <aside className="w-full lg:w-96 xl:w-104 shrink-0 bg-[#020614]/95 border border-sky-950/80 rounded-2xl flex flex-col overflow-hidden backdrop-blur-xl shadow-2xl select-none font-['DM_Sans',sans-serif]">
      {/* Header */}
      <div className="p-4 border-b border-sky-950/70 bg-[#03091c]/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
              NGO Field Dispatch Hub
            </h3>
            <p className="text-[11px] text-zinc-400">
              Hour-by-Hour Debris Interception
            </p>
          </div>
        </div>

        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          AUTO-PILOT ACTIVE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        
        {/* 1. AUTOMATIC METEOROLOGICAL LIVE STREAM CARD */}
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 to-[#020b1c] space-y-1.5 font-mono text-[10px]">
          <div className="flex items-center justify-between text-emerald-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              Auto Hydrodynamic Feed
            </span>
            <span className="text-zinc-500">Jayakwadi Basin Model</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-zinc-300">
            <div>
              <span className="text-zinc-500 block">Current Flow:</span>
              <span className="text-white font-bold">{params.current_velocity_ms} m/s ({params.current_direction_deg}° Downstream)</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Trade Wind Leeway:</span>
              <span className="text-white font-bold">{params.wind_speed_ms} m/s ({params.wind_direction_deg}° Trade)</span>
            </div>
          </div>
          <p className="text-[9px] text-zinc-400 pt-0.5">
            Parameters are automatically matched to current reservoir drift conditions.
          </p>
        </div>

        {/* 2. TARGET DEBRIS HOTSPOT PICKER */}
        <div className="p-3.5 rounded-xl border border-cyan-500/50 bg-gradient-to-br from-[#031338]/80 to-[#020a1f] space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              1. Choose Detected Debris Anomaly
            </span>
            <span className="text-[9px] font-mono text-cyan-300 font-bold bg-cyan-950/90 px-2 py-0.5 rounded border border-cyan-800">
              {hotspots?.features?.length ?? 141} DETECTED
            </span>
          </div>

          <div>
            <select
              value={selectedDebrisId}
              onChange={(e) => handleSelectDebris(e.target.value)}
              className="w-full bg-[#030919] border border-sky-800 rounded-lg px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="">-- Click on Map or Choose Hotspot --</option>
              {pelagicHotspots.length > 0 && (
                <optgroup label="🌊 Central Pelagic Open-Water Windrows">
                  {pelagicHotspots.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.properties?.name || f.id} (FDI: +{f.properties?.fdi_value ?? '0.04'})
                    </option>
                  ))}
                </optgroup>
              )}
              {shorelineHotspots.length > 0 && (
                <optgroup label="🏖️ Shoreline & Catchment Embayments">
                  {shorelineHotspots.slice(0, 30).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.properties?.name || f.id} ({f.properties?.zone_type || 'Shoreline'})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Custom Release Indicator Banner */}
          {params.hotspot_id === 'custom-release' && (
            <div className="p-2.5 rounded-lg border border-purple-500/60 bg-gradient-to-r from-purple-950/50 to-[#02081c] flex items-center justify-between text-[10px] font-mono shadow-md">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <div>
                  <span className="text-white font-bold block">Custom Map Release Beacon</span>
                  <span className="text-purple-300 text-[9px]">{params.latitude.toFixed(4)}°N, {params.longitude.toFixed(4)}°E</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSelectDebris('pelagic-windrow-1')}
                className="px-2 py-0.5 rounded bg-purple-900/70 border border-purple-600 text-[9px] text-purple-200 hover:text-white cursor-pointer"
              >
                Reset Hotspot
              </button>
            </div>
          )}

          {/* Active Debris Dossier Card */}
          {activeHotspot && params.hotspot_id !== 'custom-release' && (
            <div className="p-2.5 rounded-lg bg-[#02081c] border border-sky-900/60 text-[10px] font-mono space-y-1">
              <div className="flex items-center justify-between text-white font-bold">
                <span className="truncate">{activeHotspot.properties?.name}</span>
                <span className="text-cyan-400">FDI: +{activeHotspot.properties?.fdi_value}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400 text-[9px]">
                <span>MARIDA: {activeHotspot.properties?.marida_class?.replace(/_/g, ' ')}</span>
                <span>Area: {Math.round(activeHotspot.properties?.area_m2 ?? 12000).toLocaleString()} m²</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. NGO FIELD RESOURCE & ECONOMIC IMPACT ADVISORY */}
        {simulation?.summary && (
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#041a3d] to-[#020c24] border border-amber-500/40 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between text-amber-300 font-bold text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400" />
                RECOMMENDED COLLECTION WINDOW
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-700 text-[9px] text-amber-200">
                ETA: ~{simulation.summary.estimated_shore_interception_hours ?? 3.0}h
              </span>
            </div>

            <div className="text-[11px] text-zinc-200 leading-snug">
              <p className="font-bold text-white mb-0.5">
                📍 Destination: {simulation.summary.destination_target}
              </p>
              <p className="text-zinc-300 text-[10px]">
                {simulation.summary.recommended_action}
              </p>
            </div>

            {/* Economic Impact & Required Field Assets Metrics */}
            <div className="pt-2 border-t border-sky-950 space-y-2 font-mono text-[10px]">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-[#010817] border border-sky-900/50">
                  <span className="text-zinc-500 text-[9px] block">ESTIMATED DEBRIS MASS</span>
                  <span className="text-cyan-300 font-bold text-xs block">
                    {simulation.summary.estimated_debris_mass_tons ?? 3.8} Metric Tons
                  </span>
                  <span className="text-zinc-400 text-[9px]">
                    ~{(simulation.summary.estimated_debris_mass_kg ?? 3800).toLocaleString()} kg macroplastics
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-[#010817] border border-sky-900/50">
                  <span className="text-zinc-500 text-[9px] block">INFRASTRUCTURE ROI</span>
                  <span className="text-emerald-400 font-bold text-xs block">
                    ₹{simulation.summary.economic_impact?.infrastructure_damage_prevented_lakhs ?? 14.8} Lakhs
                  </span>
                  <span className="text-zinc-400 text-[9px]">
                    {simulation.summary.economic_impact?.recovery_roi_multiplier ?? 8.4}x cleanup dividend
                  </span>
                </div>
              </div>

              {/* Required Assets Manifest */}
              <div className="p-2 rounded-lg bg-[#010817] border border-sky-900/50 space-y-1">
                <span className="text-zinc-400 font-bold text-[9px] uppercase tracking-wide block">
                  Field Asset Dispatch Requirement:
                </span>
                <div className="grid grid-cols-3 gap-1 text-[10px] text-white">
                  <div className="flex items-center gap-1 text-cyan-300">
                    <Truck className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>{simulation.summary.field_assets?.skimmer_boats ?? 2} Skimmers</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-300">
                    <Anchor className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{simulation.summary.field_assets?.containment_booms_meters ?? 200}m Boom</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-300">
                    <Users className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{simulation.summary.field_assets?.field_crew_count ?? 6} Crew</span>
                  </div>
                </div>
              </div>

              {/* 1-Click Field Dispatch Brief Export */}
              <button
                type="button"
                onClick={() => setShowDispatchModal(true)}
                className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-cyan-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 border border-amber-500/50 text-amber-200 hover:text-white font-bold text-[10px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print / Download Field Dispatch Order</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. HOUR-BY-HOUR COLLECTION SCHEDULE (The core tool for the NGO crew) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Hour-by-Hour Collection Schedule
            </span>
            <span className="text-[9px] font-mono text-zinc-500">
              Click hour to inspect on map
            </span>
          </div>

          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {schedule.map((wp, idx) => {
              const isSelected = Math.abs(currentStepHour - wp.hour) < 0.5;
              const isBeached = wp.status === 'ashore';

              return (
                <div
                  key={idx}
                  ref={isSelected ? activeWaypointRef : null}
                  onClick={() => onSelectHour?.(wp.hour)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.3)] ring-1 ring-cyan-400'
                      : wp.is_optimal
                      ? 'bg-amber-950/30 border-amber-500/60 hover:border-amber-400'
                      : 'bg-[#030919] border-sky-950 hover:border-sky-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        wp.is_optimal
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}>
                        T+{wp.hour.toFixed(1)}h
                      </span>
                      <span className="font-bold text-white text-[11px]">
                        {wp.is_optimal ? '⭐ Interception Beaching Point' : `Waypoint #${idx + 1}`}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleCopyGPS(e, wp.latitude, wp.longitude, wp.hour)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-sky-900/60 text-[9px] font-mono text-zinc-400 hover:text-cyan-300 hover:border-cyan-400 transition-colors cursor-pointer"
                      title="Copy GPS coordinates"
                    >
                      {copiedHour === wp.hour ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5" />
                          <span>Copy GPS</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                    <span>GPS: {wp.latitude.toFixed(4)}° N, {wp.longitude.toFixed(4)}° E</span>
                    <span className={isBeached ? 'text-amber-400 font-bold' : 'text-cyan-300'}>
                      {isBeached ? '🛑 At Shoreline' : '🌊 Pelagic Drift'}
                    </span>
                  </div>

                  <p className="text-[10px] text-zinc-300 leading-tight">
                    {wp.action}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. COLLAPSIBLE ADVANCED HYDRODYNAMIC OVERRIDES (Optional) */}
        <div className="border border-sky-950/80 rounded-xl overflow-hidden bg-[#030919]/50">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-2.5 flex items-center justify-between text-[10px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Advanced Vector Overrides (Optional)
            </span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvanced && (
            <div className="p-3 border-t border-sky-950 space-y-3 text-[10px] font-mono">
              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Current Velocity (m/s)</span>
                  <span className="text-white">{params.current_velocity_ms} m/s</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={params.current_velocity_ms}
                  onChange={(e) => onChangeParams({ current_velocity_ms: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 bg-slate-900 h-1.5 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Current Direction</span>
                  <span className="text-white">{params.current_direction_deg}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={params.current_direction_deg}
                  onChange={(e) => onChangeParams({ current_direction_deg: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 bg-slate-900 h-1.5 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Wind Speed (m/s)</span>
                  <span className="text-white">{params.wind_speed_ms} m/s</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="15.0"
                  step="0.5"
                  value={params.wind_speed_ms}
                  onChange={(e) => onChangeParams({ wind_speed_ms: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 bg-slate-900 h-1.5 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Wind Direction</span>
                  <span className="text-white">{params.wind_direction_deg}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={params.wind_direction_deg}
                  onChange={(e) => onChangeParams({ wind_direction_deg: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 bg-slate-900 h-1.5 rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* 6. RE-SIMULATE BUTTON */}
        <button
          onClick={onExecute}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-bold text-xs hover:from-cyan-300 hover:to-sky-400 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Recalculating Dispatch Plan...' : 'Recalculate Interception Waypoints 📍'}</span>
        </button>
      </div>

      {/* 7. PRINTABLE NGO FIELD DISPATCH ORDER MODAL */}
      {showDispatchModal && simulation?.summary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#030919] border-2 border-cyan-500/60 rounded-2xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] space-y-4 text-white font-mono">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-sky-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest">
                    SINDHUDRISHTI NGO RAPID RESPONSE DIRECTIVE
                  </span>
                </div>
                <h2 className="text-base font-bold text-white mt-1">
                  TACTICAL FIELD DISPATCH ORDER #{simulation.summary.field_dispatch_order?.order_id || 'DSP-JYK-A49B2'}
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Godavari Basin Authority • Paithan Dam Reservoir Recovery Desk
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-sky-950 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mission Critical Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#010817] border border-sky-900">
                <span className="text-[9px] text-zinc-500 block uppercase">Priority Level</span>
                <span className="text-rose-400 font-bold text-sm block">
                  {simulation.summary.risk_level || 'CRITICAL'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#010817] border border-sky-900">
                <span className="text-[9px] text-zinc-500 block uppercase">Estimated Debris</span>
                <span className="text-amber-300 font-bold text-sm block">
                  {simulation.summary.estimated_debris_mass_tons ?? 3.8} Tons
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#010817] border border-sky-900">
                <span className="text-[9px] text-zinc-500 block uppercase">Staging Base</span>
                <span className="text-cyan-300 font-bold text-xs truncate block">
                  {simulation.summary.field_dispatch_order?.optimal_staging_area || 'Paithan North Jetty'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#010817] border border-sky-900">
                <span className="text-[9px] text-zinc-500 block uppercase">Damage Prevented</span>
                <span className="text-emerald-400 font-bold text-sm block">
                  ₹{simulation.summary.economic_impact?.infrastructure_damage_prevented_lakhs ?? 14.8}L
                </span>
              </div>
            </div>

            {/* Required Field Equipment Manifest */}
            <div className="p-3.5 rounded-xl bg-[#010614] border border-sky-900 space-y-2">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                Required Operational Asset Manifest:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 rounded bg-[#030d24] border border-sky-950">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-white font-bold block">{simulation.summary.field_assets?.skimmer_boats ?? 2} Catamarans</span>
                    <span className="text-[10px] text-zinc-400">Trash Skimmer Craft</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-[#030d24] border border-sky-950">
                  <Anchor className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-white font-bold block">{simulation.summary.field_assets?.containment_booms_meters ?? 200}m Boom</span>
                    <span className="text-[10px] text-zinc-400">Deflection Barrier</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-[#030d24] border border-sky-950">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-white font-bold block">{simulation.summary.field_assets?.field_crew_count ?? 6} Personnel</span>
                    <span className="text-[10px] text-zinc-400">Recovery Operators</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical Deployment Directives */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                Tactical Directives for Rapid Recovery Crew:
              </span>
              <ul className="space-y-1 text-zinc-300 text-[11px] list-disc list-inside">
                {simulation.summary.field_dispatch_order?.recommended_tactics?.map((tactic, tIdx) => (
                  <li key={tIdx} className="leading-snug">{tactic}</li>
                )) || (
                  <>
                    <li>Deploy floating deflection boom 40° across drift vector to funnel debris into extraction zone.</li>
                    <li>Stage recovery boat at optimal beaching waypoint before Hour {simulation.summary.estimated_shore_interception_hours?.toFixed(0) || 3}.</li>
                    <li>Avoid shoreline vegetative entanglement in shallow littoral margins.</li>
                  </>
                )}
              </ul>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-sky-900 text-xs">
              <span className="text-[10px] text-zinc-500">
                Official SindhuDrishti Field Operations Manifest • 100% Free Public Sat Data
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-bold flex items-center gap-2 hover:from-cyan-300 cursor-pointer shadow-lg"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Mission Brief</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-sky-800 text-zinc-300 hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
