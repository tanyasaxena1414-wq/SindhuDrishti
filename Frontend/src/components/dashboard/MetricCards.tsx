import React, { useState } from 'react';
import { 
  Satellite, 
  Layers, 
  ShieldCheck, 
  Clock, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Radio, 
  FileCheck2 
} from 'lucide-react';
import { DashboardStats } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface MetricCardsProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ stats, isLoading }) => {
  const { isDark } = useTheme();
  const [isEarthObsExpanded, setIsEarthObsExpanded] = useState<boolean>(true);
  const [isCommunityExpanded, setIsCommunityExpanded] = useState<boolean>(true);

  return (
    <div className="space-y-4">
      {/* Group 1: Earth Observation & Remote Sensing Telemetry */}
      <div 
        className={`rounded-2xl border backdrop-blur-xl shadow-md overflow-hidden transition-all duration-200 ${
          isDark ? 'bg-[#071a2e]/60 border-[#0e2a47]' : 'bg-white/95 border-[#cddce9] shadow-[0_4px_20px_rgba(9,30,58,0.05)]'
        }`}
      >
        <div 
          onClick={() => setIsEarthObsExpanded(!isEarthObsExpanded)}
          className={`p-3.5 sm:p-4 border-b flex items-center justify-between cursor-pointer select-none ${
            isDark 
              ? 'bg-[#051324] border-[#0e2a47]' 
              : 'bg-[#edf4fa] border-[#cddce9] text-[#071d3d]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div 
              className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                isDark 
                  ? 'bg-[#073b55] border-[#18c9e8]/40 text-[#18c9e8]' 
                  : 'bg-[#dceaf4] border-[#cbd5e1] text-[#0284c7]'
              }`}
            >
              <Satellite className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
                  Earth Observation & Remote Sensing Telemetry
                </h3>
                <span 
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full hidden sm:inline ${
                    isDark ? 'bg-[#071a2e] text-[#18c9e8] border border-[#18c9e8]/30' : 'bg-sky-50 text-[#0284c7] border border-sky-200 shadow-xs'
                  }`}
                >
                  Sentinel-2 MSI L2A
                </span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-[#486581]'}`}>
                Automated multi-spectral anomaly detection & reservoir surface masking
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className={`p-1 rounded-lg transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-[#06152b]'}`}
            aria-label={isEarthObsExpanded ? 'Collapse section' : 'Expand section'}
          >
            {isEarthObsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isEarthObsExpanded && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Satellite Anomalies */}
            <div 
              className={`p-4 rounded-xl border relative overflow-hidden transition-all shadow-sm ${
                isDark ? 'bg-[#051324]/60 border-[#0e2a47]' : 'bg-gradient-to-br from-white to-[#f4f8fc] border-[#d2e1ee] hover:border-[#0284c7]/40 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between text-zinc-500 mb-2">
                <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>Candidate Debris Hotspots</span>
                <Radio className={`w-4 h-4 ${isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]'} animate-pulse`} />
              </div>
              <div className={`text-3xl font-bold font-display mb-1 ${isDark ? 'text-white' : 'text-[#071d3d]'}`}>
                {isLoading ? '—' : (stats?.candidate_hotspots !== undefined ? stats.candidate_hotspots : '—')}
              </div>
              <p className={`text-[11px] leading-tight ${isDark ? 'text-zinc-500' : 'text-[#486581]'}`}>
                High-confidence floating debris signatures across Godavari Basin
              </p>
              <div className="mt-3 pt-2 border-t border-zinc-500/20 flex items-center justify-between text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                <span>Status: Candidate</span>
                <span>FDI &gt; 0.03 Index</span>
              </div>
            </div>

            {/* Card 2: Water Mask Features */}
            <div 
              className={`p-4 rounded-xl border relative overflow-hidden transition-all shadow-sm ${
                isDark ? 'bg-[#051324]/60 border-[#0e2a47]' : 'bg-gradient-to-br from-white to-[#f4f8fc] border-[#d2e1ee] hover:border-[#0284c7]/40 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between text-zinc-500 mb-2">
                <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>Reservoir Water Masks</span>
                <Layers className={`w-4 h-4 ${isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]'}`} />
              </div>
              <div className={`text-3xl font-bold font-display mb-1 ${isDark ? 'text-white' : 'text-[#071d3d]'}`}>
                {isLoading ? '—' : (stats?.water_mask_features !== undefined ? stats.water_mask_features : '—')}
              </div>
              <p className={`text-[11px] leading-tight ${isDark ? 'text-zinc-500' : 'text-[#486581]'}`}>
                MNDWI calibrated reservoir surface area (~350 km² boundary)
              </p>
              <div className="mt-3 pt-2 border-t border-zinc-500/20 flex items-center justify-between text-[10px] font-mono text-sky-600 dark:text-sky-400 font-semibold">
                <span>Jayakwadi Reservoir</span>
                <span>Polygon Extent</span>
              </div>
            </div>

            {/* Card 3: Satellite Telemetry Health */}
            <div 
              className={`p-4 rounded-xl border relative overflow-hidden transition-all shadow-sm sm:col-span-2 lg:col-span-1 ${
                isDark ? 'bg-[#051324]/60 border-[#0e2a47]' : 'bg-gradient-to-br from-white to-[#f4f8fc] border-[#d2e1ee] hover:border-[#0284c7]/40 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between text-zinc-500 mb-2">
                <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>Constellation Pipeline</span>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <div className={`text-xl font-bold font-display mb-1 flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#071d3d]'}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Sentinel-2 Active</span>
              </div>
              <p className={`text-[11px] leading-tight ${isDark ? 'text-zinc-500' : 'text-[#486581]'}`}>
                Planetary Computer STAC feed syncing multi-spectral reflectance
              </p>
              <div className="mt-3 pt-2 border-t border-zinc-500/20 flex items-center justify-between text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Cloud &lt; 1%</span>
                <span>Tile 43QEB</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Group 2: Ground-Truth & Community Verification Pipeline */}
      <div 
        className={`rounded-2xl border backdrop-blur-xl shadow-md overflow-hidden transition-all duration-200 ${
          isDark ? 'bg-[#071a2e]/60 border-[#0e2a47]' : 'bg-white/95 border-[#cddce9] shadow-[0_4px_20px_rgba(9,30,58,0.05)]'
        }`}
      >
        <div 
          onClick={() => setIsCommunityExpanded(!isCommunityExpanded)}
          className={`p-3.5 sm:p-4 border-b flex items-center justify-between cursor-pointer select-none ${
            isDark 
              ? 'bg-[#051324] border-[#0e2a47]' 
              : 'bg-[#edf4fa] border-[#cddce9] text-[#071d3d]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div 
              className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                isDark 
                  ? 'bg-[#073b55] border-[#18c9e8]/40 text-[#18c9e8]' 
                  : 'bg-[#dceaf4] border-[#cbd5e1] text-[#0284c7]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
                  Ground-Truth & Citizen Verification Pipeline
                </h3>
                <span 
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full hidden sm:inline ${
                    isDark ? 'bg-[#071a2e] text-[#18c9e8] border border-[#18c9e8]/30' : 'bg-sky-50 text-[#0284c7] border border-sky-200 shadow-xs'
                  }`}
                >
                  Verified Store
                </span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-[#486581]'}`}>
                Community pollution logs, field inspector triage, and AI computer vision
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className={`p-1 rounded-lg transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-[#06152b]'}`}
            aria-label={isCommunityExpanded ? 'Collapse section' : 'Expand section'}
          >
            {isCommunityExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isCommunityExpanded && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 4: Total Citizen Reports */}
            <div 
              className={`p-4 rounded-xl border relative overflow-hidden transition-all shadow-sm ${
                isDark ? 'bg-[#051324]/60 border-[#0e2a47]' : 'bg-gradient-to-br from-white to-[#f4f8fc] border-[#d2e1ee] hover:border-[#0284c7]/40 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between text-zinc-500 mb-2">
                <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>Total Citizen Reports</span>
                <FileCheck2 className={`w-4 h-4 ${isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]'}`} />
              </div>
              <div className={`text-3xl font-bold font-display mb-1 ${isDark ? 'text-white' : 'text-[#071d3d]'}`}>
                {isLoading ? '—' : (stats?.citizen_reports_total !== undefined ? stats.citizen_reports_total : '—')}
              </div>
              <p className={`text-[11px] leading-tight ${isDark ? 'text-zinc-500' : 'text-[#486581]'}`}>
                Community submissions collected for ground-truth satellite validation
              </p>
              <div className={`mt-3 pt-2 border-t border-zinc-500/20 flex items-center justify-between text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>
                <span>Recent (7d): {stats?.reports_last_7_days ?? 0}</span>
                <span>(30d): {stats?.reports_last_30_days ?? 0}</span>
              </div>
            </div>

            {/* Card 5: Review Pipeline Breakdown */}
            <div 
              className={`p-4 rounded-xl border relative overflow-hidden transition-all shadow-sm sm:col-span-2 lg:col-span-2 ${
                isDark ? 'bg-[#051324]/60 border-[#0e2a47]' : 'bg-gradient-to-br from-white to-[#f4f8fc] border-[#d2e1ee] hover:border-[#0284c7]/40 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between text-zinc-500 mb-2">
                <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>Reviewer Triage Distribution</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="grid grid-cols-3 gap-2 my-2">
                <div 
                  className={`p-2.5 rounded-lg border flex flex-col items-center justify-center ${
                    isDark ? 'bg-[#020817] border-[#0e2a47]' : 'bg-white border-[#d2e1ee] shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold font-mono">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>{isLoading ? '—' : (stats?.citizen_reports_pending ?? 0)}</span>
                  </div>
                  <span className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>Pending</span>
                </div>

                <div 
                  className={`p-2.5 rounded-lg border flex flex-col items-center justify-center ${
                    isDark ? 'bg-[#020817] border-[#0e2a47]' : 'bg-white border-[#d2e1ee] shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{isLoading ? '—' : (stats?.citizen_reports_verified ?? 0)}</span>
                  </div>
                  <span className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>Verified</span>
                </div>

                <div 
                  className={`p-2.5 rounded-lg border flex flex-col items-center justify-center ${
                    isDark ? 'bg-[#020817] border-[#0e2a47]' : 'bg-white border-[#d2e1ee] shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs text-rose-500 font-bold font-mono">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>{isLoading ? '—' : (stats?.citizen_reports_rejected ?? 0)}</span>
                  </div>
                  <span className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>Rejected</span>
                </div>
              </div>
              <p className={`text-[11px] leading-tight ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>
                Triage stages authenticated with Reviewer API Key (<code className={isDark ? 'text-[#18c9e8]' : 'text-[#0284c7] font-bold'}>sindhu-reviewer-2026</code>)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
