import React from 'react';
import { 
  Satellite, 
  Layers, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle,
  TrendingUp
} from 'lucide-react';
import { DashboardStats } from '../../types';

interface MetricCardsProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ stats, isLoading }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Card 1: Candidate Hotspots */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#03091c]/80 border border-sky-950/80 backdrop-blur-xl relative overflow-hidden group hover:border-sky-800/60 transition-all shadow-lg">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors" />
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-xs font-medium">Satellite Anomalies</span>
          <Satellite className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="text-2xl sm:text-3xl font-bold font-mono text-white mb-1">
          {isLoading ? '—' : (stats?.candidate_hotspots !== undefined ? stats.candidate_hotspots : '—')}
        </div>
        <p className="text-[11px] text-zinc-400 leading-tight">
          Unverified candidate hotspots from Sentinel-2 Level-2A
        </p>
        <div className="mt-3 pt-2 border-t border-sky-950 flex items-center justify-between text-[10px] font-mono text-cyan-300/80">
          <span>Status: Unverified</span>
          <span>Godavari Basin</span>
        </div>
      </div>

      {/* Card 2: Water Mask Features */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#03091c]/80 border border-sky-950/80 backdrop-blur-xl relative overflow-hidden group hover:border-sky-800/60 transition-all shadow-lg">
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-colors" />
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-xs font-medium">Reservoir Water Masks</span>
          <Layers className="w-4 h-4 text-sky-400" />
        </div>
        <div className="text-2xl sm:text-3xl font-bold font-mono text-white mb-1">
          {isLoading ? '—' : (stats?.water_mask_features !== undefined ? stats.water_mask_features : '—')}
        </div>
        <p className="text-[11px] text-zinc-400 leading-tight">
          Sentinel-2 NDWI aligned reservoir water surface boundary
        </p>
        <div className="mt-3 pt-2 border-t border-sky-950 flex items-center justify-between text-[10px] font-mono text-sky-300/80">
          <span>Jayakwadi Reservoir</span>
          <span>2.32e8 m²</span>
        </div>
      </div>

      {/* Card 3: Total Citizen Reports */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#03091c]/80 border border-sky-950/80 backdrop-blur-xl relative overflow-hidden group hover:border-sky-800/60 transition-all shadow-lg">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-xs font-medium">Citizen Reports</span>
          <ShieldCheck className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-2xl sm:text-3xl font-bold font-mono text-white mb-1">
          {isLoading ? '—' : (stats?.citizen_reports_total !== undefined ? stats.citizen_reports_total : '—')}
        </div>
        <p className="text-[11px] text-zinc-400 leading-tight">
          Community pollution logs awaiting or completing review
        </p>
        <div className="mt-3 pt-2 border-t border-sky-950 flex items-center justify-between text-[10px] font-mono text-blue-300/80">
          <span>Recent (7d): {stats?.reports_last_7_days ?? '—'}</span>
          <span>(30d): {stats?.reports_last_30_days ?? '—'}</span>
        </div>
      </div>

      {/* Card 4: Report Status Breakdown */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#03091c]/80 border border-sky-950/80 backdrop-blur-xl relative overflow-hidden group hover:border-sky-800/60 transition-all shadow-lg">
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-xs font-medium">Review Pipeline</span>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex items-center gap-3 my-1">
          <div className="flex items-center gap-1 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-amber-200 font-bold">{stats?.citizen_reports_pending ?? '—'}</span>
            <span className="text-zinc-500">Pend</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-200 font-bold">{stats?.citizen_reports_verified ?? '—'}</span>
            <span className="text-zinc-500">Ver</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-rose-200 font-bold">{stats?.citizen_reports_rejected ?? '—'}</span>
            <span className="text-zinc-500">Rej</span>
          </div>
        </div>
        <p className="text-[11px] text-zinc-400 leading-tight mt-2">
          Verification lifecycle: pending triage, approved, or rejected
        </p>
        <div className="mt-3 pt-2 border-t border-sky-950 flex items-center justify-between text-[10px] font-mono text-zinc-400">
          <span>SQLite Store</span>
          <span>FastAPI</span>
        </div>
      </div>
    </div>
  );
};
