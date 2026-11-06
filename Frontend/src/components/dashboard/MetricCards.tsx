import React, { useState } from 'react';
import { 
  Satellite, 
  Layers, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  Activity,
  ChevronDown,
  ChevronUp,
  Radio,
  FileCheck2
} from 'lucide-react';
import { DashboardStats } from '../../types';

interface MetricCardsProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ stats, isLoading }) => {
  const [isEarthObsExpanded, setIsEarthObsExpanded] = useState<boolean>(true);
  const [isCommunityExpanded, setIsCommunityExpanded] = useState<boolean>(true);

  return (
    <div className="space-y-4">
      {/* Group 1: Earth Observation & Remote Sensing Telemetry */}
      <div className="rounded-2xl bg-[#02071a]/90 border border-sky-950/80 backdrop-blur-xl shadow-xl overflow-hidden transition-all duration-200">
        <div 
          onClick={() => setIsEarthObsExpanded(!isEarthObsExpanded)}
          className="p-3.5 sm:p-4 bg-gradient-to-r from-[#030e29] to-[#02081d] border-b border-sky-950/70 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Satellite className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Earth Observation & Remote Sensing Telemetry
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/40 hidden sm:inline">
                  Sentinel-2 MSI Level-2A
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Automated multi-spectral anomaly detection & reservoir surface masking
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-sky-950/60 transition-colors"
            aria-label={isEarthObsExpanded ? 'Collapse section' : 'Expand section'}
          >
            {isEarthObsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isEarthObsExpanded && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Satellite Anomalies */}
            <div className="p-4 rounded-xl bg-[#03091e]/80 border border-sky-900/40 relative overflow-hidden group hover:border-cyan-500/50 transition-all shadow-md">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors" />
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-medium">Candidate Debris Hotspots</span>
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              </div>
              <div className="text-3xl font-bold font-mono text-white mb-1">
                {isLoading ? '—' : (stats?.candidate_hotspots !== undefined ? stats.candidate_hotspots : '—')}
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                High-confidence floating debris signatures across Godavari Basin
              </p>
              <div className="mt-3 pt-2 border-t border-sky-950 flex items-center justify-between text-[10px] font-mono text-cyan-300/90">
                <span>Status: Candidate</span>
                <span>FDI &gt; 0.03 Index</span>
              </div>
            </div>

            {/* Card 2: Water Mask Features */}
            <div className="p-4 rounded-xl bg-[#03091e]/80 border border-sky-900/40 relative overflow-hidden group hover:border-sky-500/50 transition-all shadow-md">
              <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-colors" />
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-medium">Reservoir Water Masks</span>
                <Layers className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-white mb-1">
                {isLoading ? '—' : (stats?.water_mask_features !== undefined ? stats.water_mask_features : '—')}
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                MNDWI calibrated reservoir surface area (~232 km² boundary)
              </p>
              <div className="mt-3 pt-2 border-t border-sky-950 flex items-center justify-between text-[10px] font-mono text-sky-300/90">
                <span>Jayakwadi Reservoir</span>
                <span>Polygon Extent</span>
              </div>
            </div>

            {/* Card 3: Satellite Telemetry Health */}
            <div className="p-4 rounded-xl bg-[#03091e]/80 border border-sky-900/40 relative overflow-hidden group hover:border-emerald-500/50 transition-all shadow-md sm:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-medium">Constellation Pipeline</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold font-mono text-white mb-1 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <span>Sentinel-2 Orbit Active</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Planetary Computer STAC feed syncing multi-spectral reflectance bands
              </p>
              <div className="mt-3 pt-2 border-t border-sky-950 flex items-center justify-between text-[10px] font-mono text-emerald-300/90">
                <span>Cloud Cover &lt; 1%</span>
                <span>Tile 43QEB</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Group 2: Ground-Truth & Community Verification Pipeline */}
      <div className="rounded-2xl bg-[#02071a]/90 border border-sky-950/80 backdrop-blur-xl shadow-xl overflow-hidden transition-all duration-200">
        <div 
          onClick={() => setIsCommunityExpanded(!isCommunityExpanded)}
          className="p-3.5 sm:p-4 bg-gradient-to-r from-[#030e29] to-[#02081d] border-b border-sky-950/70 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Ground-Truth & Citizen Verification Pipeline
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/40 hidden sm:inline">
                  SQLite Verified Store
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Community pollution logs, field inspector triage, and AI computer vision
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-sky-950/60 transition-colors"
            aria-label={isCommunityExpanded ? 'Collapse section' : 'Expand section'}
          >
            {isCommunityExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isCommunityExpanded && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 4: Total Citizen Reports */}
            <div className="p-4 rounded-xl bg-[#03091e]/80 border border-sky-900/40 relative overflow-hidden group hover:border-blue-500/50 transition-all shadow-md">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-medium">Total Citizen Reports</span>
                <FileCheck2 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-white mb-1">
                {isLoading ? '—' : (stats?.citizen_reports_total !== undefined ? stats.citizen_reports_total : '—')}
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Community submissions collected for ground-truth satellite validation
              </p>
              <div className="mt-3 pt-2 border-t border-sky-950 flex items-center justify-between text-[10px] font-mono text-blue-300/90">
                <span>Recent (7d): {stats?.reports_last_7_days ?? 0}</span>
                <span>(30d): {stats?.reports_last_30_days ?? 0}</span>
              </div>
            </div>

            {/* Card 5: Review Pipeline Breakdown */}
            <div className="p-4 rounded-xl bg-[#03091e]/80 border border-sky-900/40 relative overflow-hidden group hover:border-cyan-500/50 transition-all shadow-md sm:col-span-2 lg:col-span-2">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-medium">Reviewer Triage Distribution</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="grid grid-cols-3 gap-2 my-2">
                <div className="p-2.5 rounded-lg bg-[#020614] border border-amber-900/40 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold font-mono">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
                    <span>{isLoading ? '—' : (stats?.citizen_reports_pending ?? 0)}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono mt-0.5">Pending</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#020614] border border-emerald-900/40 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                    <span>{isLoading ? '—' : (stats?.citizen_reports_verified ?? 0)}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono mt-0.5">Verified</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#020614] border border-rose-900/40 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1.5 text-xs text-rose-300 font-bold font-mono">
                    <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_6px_#f43f5e]" />
                    <span>{isLoading ? '—' : (stats?.citizen_reports_rejected ?? 0)}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono mt-0.5">Rejected</span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Triage stages authenticated with Reviewer API Key (<code className="text-cyan-300">sindhu-reviewer-2026</code>)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
