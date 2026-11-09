import React from 'react';
import { Satellite, X, AlertTriangle, Sparkles, Leaf, Activity, CheckCircle2 } from 'lucide-react';
import { GeoJSONFeature, HotspotProperties } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface HotspotPopoverProps {
  hotspot: GeoJSONFeature<HotspotProperties>;
  onClose: () => void;
}

export const HotspotPopover: React.FC<HotspotPopoverProps> = ({ hotspot, onClose }) => {
  const { isDark } = useTheme();
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
    <div 
      className={`absolute bottom-5 right-5 z-40 w-84 sm:w-92 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in space-y-3 font-sans border transition-colors ${
        isDark 
          ? 'bg-[#020817]/95 border-[#18c9e8]/40 text-[#f8fafc]' 
          : 'bg-white/95 border-[#cbd5e1] text-[#0f172a]'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between pb-2.5 border-b ${isDark ? 'border-[#0e2a47]' : 'border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            isOrganic 
              ? isDark ? 'bg-emerald-950/80 border border-emerald-800/60 text-emerald-300' : 'bg-emerald-50 border border-emerald-300 text-emerald-600'
              : isDark ? 'bg-[#073b55] border border-[#18c9e8]/60 text-[#18c9e8]' : 'bg-[#dceaf4] border border-[#cbd5e1] text-[#0284c7]'
          }`}>
            {isOrganic ? <Leaf className="w-3.5 h-3.5" /> : <Satellite className="w-3.5 h-3.5" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-mono font-bold">
                {hotspot.id || `hotspot-${props.candidate_id || props.candidate || '1'}`}
              </h4>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                isOrganic
                  ? isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-emerald-100 text-emerald-700'
                  : isDark ? 'bg-[#051324] text-[#18c9e8] border border-[#18c9e8]/40' : 'bg-sky-100 text-sky-700'
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
          className={`p-1 rounded-lg transition-colors cursor-pointer ${
            isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-black hover:bg-black/5'
          }`}
          aria-label="Close Popover"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Confidence Gauge Strip */}
      <div 
        className={`p-2.5 rounded-xl border space-y-1.5 ${
          isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-slate-50 border-[#cbd5e1]'
        }`}
      >
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-500 flex items-center gap-1">
            <Activity className={`w-3.5 h-3.5 ${isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]'}`} />
            <span>Detection Confidence</span>
          </span>
          <span className={`font-bold ${confidence >= 0.65 ? (isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]') : confidence >= 0.4 ? 'text-amber-500' : 'text-zinc-400'}`}>
            {Math.round(confidence * 100)}%
          </span>
        </div>
        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              isOrganic ? 'bg-emerald-400' : confidence >= 0.65 ? (isDark ? 'bg-[#18c9e8]' : 'bg-[#0284c7]') : 'bg-amber-400'
            }`}
            style={{ width: `${Math.min(confidence * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-zinc-400">
          <span>Biermann FDI Departure</span>
          <span>Multi-pass persistence</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-slate-50 border-[#cbd5e1]'}`}>
          <span className="text-zinc-500 text-[10px] block">Estimated Area</span>
          <span className={`text-xs font-bold ${isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]'}`}>
            {areaM2.toLocaleString()} m²
          </span>
        </div>

        <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-slate-50 border-[#cbd5e1]'}`}>
          <span className="text-zinc-500 text-[10px] block">Persistence</span>
          <span className="text-xs font-bold">
            {count} passes
          </span>
        </div>

        <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-slate-50 border-[#cbd5e1]'}`}>
          <span className="text-zinc-500 text-[10px] block">FDI Index</span>
          <span className={`text-xs font-bold ${isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]'}`}>
            {fdi > 0 ? `+${fdi.toFixed(4)}` : fdi.toFixed(4)}
          </span>
        </div>

        <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-slate-50 border-[#cbd5e1]'}`}>
          <span className="text-zinc-500 text-[10px] block">NDVI Veg</span>
          <span className={`text-xs font-bold ${ndvi > 0.35 ? 'text-emerald-500' : 'text-zinc-500'}`}>
            {ndvi.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Scientific Notice */}
      <div className={`p-2.5 rounded-xl border flex items-start gap-2 text-[10px] leading-tight ${
        isOrganic 
          ? isDark ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : isDark ? 'bg-amber-950/20 border-amber-800/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isOrganic ? 'text-emerald-500' : 'text-amber-500'}`} />
        <span>
          {isOrganic 
            ? 'High NDVI indicates organic aquatic vegetation (water hyacinth). Deprioritized in plastic scoring.'
            : 'Candidate anomaly derived from Sentinel-2 MSI reflectance index departure. Requires ground confirmation.'}
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
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#18c9e8] to-[#0284c7] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-all cursor-pointer shadow-md mt-1"
      >
        <span>Simulate Drift For This Debris 🌊</span>
      </button>
    </div>
  );
};
