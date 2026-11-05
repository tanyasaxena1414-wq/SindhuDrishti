import React from 'react';
import { Satellite, X, AlertTriangle, Sparkles, Leaf, Activity, CheckCircle2 } from 'lucide-react';
import { GeoJSONFeature, HotspotProperties } from '../../types';

interface HotspotPopoverProps {
  hotspot: GeoJSONFeature<HotspotProperties>;
  onClose: () => void;
}

export const HotspotPopover: React.FC<HotspotPopoverProps> = ({ hotspot, onClose }) => {
  const props = hotspot.properties || {};
  const areaM2 = props.area_m2 ? Math.round(props.area_m2) : 0;
  const count = props.count ?? 1;
  const status = props.status || 'unverified_candidate';
  const source = props.satellite_platform || props.source || 'Sentinel-2 MSI';
  
  const spectralClass = props.spectral_class || 'candidate_plastic_debris';
  const confidence = props.confidence_score !== undefined ? props.confidence_score : 0.65;
  const fdi = props.fdi_value !== undefined ? props.fdi_value : 0.024;
  const ndvi = props.ndvi_value !== undefined ? props.ndvi_value : 0.12;
  const isOrganic = props.is_organic_vegetation || ndvi > 0.35 || spectralClass.includes('vegetation');

  return (
    <div className="absolute bottom-5 right-5 z-40 w-84 sm:w-92 bg-[#02071a]/95 border border-cyan-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in space-y-3 font-['DM_Sans',sans-serif]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-sky-950">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            isOrganic 
              ? 'bg-emerald-950/80 border border-emerald-800/60 text-emerald-300' 
              : 'bg-cyan-950/80 border border-cyan-800/60 text-cyan-300'
          }`}>
            {isOrganic ? <Leaf className="w-3.5 h-3.5" /> : <Satellite className="w-3.5 h-3.5" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-mono font-bold text-white">
                {hotspot.id || `hotspot-${props.candidate_id || props.candidate || '1'}`}
              </h4>
              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                isOrganic
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                  : 'bg-cyan-950 text-cyan-300 border border-cyan-800/50'
              }`}>
                {spectralClass.replace(/_/g, ' ')}
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              Candidate #{props.candidate_id ?? props.candidate ?? '1'} · {source}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-sky-950 transition-colors cursor-pointer"
          aria-label="Close Popover"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Confidence Gauge Strip */}
      <div className="p-2.5 rounded-xl bg-[#030919] border border-sky-950 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Detection Confidence</span>
          </span>
          <span className={`font-bold ${confidence >= 0.65 ? 'text-cyan-300' : confidence >= 0.4 ? 'text-amber-300' : 'text-zinc-400'}`}>
            {Math.round(confidence * 100)}%
          </span>
        </div>
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              isOrganic ? 'bg-emerald-400' : confidence >= 0.65 ? 'bg-cyan-400' : 'bg-amber-400'
            }`}
            style={{ width: `${Math.min(confidence * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-zinc-500">
          <span>Biermann FDI Departure</span>
          <span>Multi-pass persistence</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2 rounded-xl bg-[#030919] border border-sky-950">
          <span className="text-zinc-500 text-[10px] block">Estimated Area</span>
          <span className="text-xs font-bold text-cyan-300">
            {areaM2.toLocaleString()} m²
          </span>
        </div>

        <div className="p-2 rounded-xl bg-[#030919] border border-sky-950">
          <span className="text-zinc-500 text-[10px] block">Persistence</span>
          <span className="text-xs font-bold text-sky-200">
            {count} satellite passes
          </span>
        </div>

        <div className="p-2 rounded-xl bg-[#030919] border border-sky-950">
          <span className="text-zinc-500 text-[10px] block">FDI Index (B8/B6/B11)</span>
          <span className="text-xs font-bold text-cyan-300">
            {fdi > 0 ? `+${fdi.toFixed(4)}` : fdi.toFixed(4)}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-[#030919] border border-sky-950">
          <span className="text-zinc-500 text-[10px] block">NDVI Veg Screening</span>
          <span className={`text-xs font-bold ${ndvi > 0.35 ? 'text-emerald-400' : 'text-zinc-300'}`}>
            {ndvi.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Zone & Shoreline Proximity */}
      <div className="p-2 rounded-xl bg-[#030919] border border-sky-950 text-[10px] font-mono flex items-center justify-between">
        <span className="text-zinc-400">Spatial Zone:</span>
        <span className={`font-bold ${props.zone_type === 'pelagic_open_water' ? 'text-cyan-300' : 'text-amber-300'}`}>
          {props.zone_type === 'pelagic_open_water' ? '🌊 Open-Water Pelagic' : '🏖️ Littoral Shoreline'}
        </span>
      </div>

      {props.distance_to_shore_m !== undefined && (
        <div className="flex justify-between items-center text-[10px] font-mono px-2 text-zinc-400">
          <span>Distance to Shore:</span>
          <span className="text-sky-200 font-bold">{Math.round(props.distance_to_shore_m).toLocaleString()} m</span>
        </div>
      )}

      {props.is_shoreline_edge_artifact && (
        <div className="p-2 rounded-xl bg-rose-950/30 border border-rose-800/40 text-[9px] font-mono text-rose-300 leading-tight">
          ⚠️ <strong>Mixed-Pixel Edge Artifact Warning</strong>: Within 60m of land-water boundary; potential spectral contamination from shore soil/mud.
        </div>
      )}

      {/* MARIDA Model Attribution */}
      {props.marida_class && (
        <div className="p-2 rounded-xl bg-[#030919] border border-sky-950 text-[10px] font-mono space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">MARIDA Model:</span>
            <span className="text-cyan-300 font-bold uppercase">{props.marida_class.replace(/_/g, ' ')}</span>
          </div>
          {props.marida_rationale && (
            <p className="text-[9px] text-zinc-400 leading-tight">
              {props.marida_rationale}
            </p>
          )}
        </div>
      )}

      {/* Scientific Notice */}
      <div className={`p-2.5 rounded-xl border flex items-start gap-2 text-[10px] leading-tight ${
        isOrganic 
          ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-200/90'
          : 'bg-amber-950/20 border-amber-800/30 text-amber-200/90'
      }`}>
        <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isOrganic ? 'text-emerald-400' : 'text-amber-400'}`} />
        <span>
          {isOrganic 
            ? 'High NDVI indicates organic aquatic vegetation (water hyacinth or algae bloom). Deprioritized in plastic cleanup scoring.'
            : 'Candidate anomaly derived from Sentinel-2 Level-2A reflectance index departure. Requires in-situ ground confirmation.'}
        </span>
      </div>

      {/* 1-Click Simulate Drift Button */}
      <button
        onClick={() => {
          const coords = (hotspot.geometry as any)?.coordinates;
          let lat = 19.485;
          let lon = 75.340;
          if (hotspot.geometry.type === 'Point') {
            lat = coords[1];
            lon = coords[0];
          } else if (hotspot.geometry.type === 'Polygon' && coords?.[0]?.[0]) {
            const ring = coords[0];
            lat = ring.reduce((s: number, c: number[]) => s + c[1], 0) / ring.length;
            lon = ring.reduce((s: number, c: number[]) => s + c[0], 0) / ring.length;
          }
          const name = props.name || hotspot.id;
          window.location.href = `/drift?lat=${lat.toFixed(5)}&lon=${lon.toFixed(5)}&hotspot_id=${hotspot.id}&name=${encodeURIComponent(name)}`;
        }}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 hover:from-cyan-300 hover:to-sky-400 transition-all cursor-pointer shadow-lg mt-1"
      >
        <span>Simulate Drift For This Debris 🌊</span>
      </button>
    </div>
  );
};
