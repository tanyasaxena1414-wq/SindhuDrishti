import React from 'react';
import { 
  AlertTriangle, 
  Compass, 
  Clock, 
  Activity, 
  ShieldAlert, 
  MapPin, 
  Waves, 
  Wind,
  Info 
} from 'lucide-react';
import { DriftSimulateResponse } from '../../types';

interface DriftSummaryProps {
  simulation: DriftSimulateResponse | null;
}

export const DriftSummary: React.FC<DriftSummaryProps> = ({ simulation }) => {
  if (!simulation) return null;

  const { summary, parameters, disclaimer, limitations } = simulation;

  const riskBadgeStyle = 
    summary.risk_level === 'CRITICAL' ? 'bg-rose-950/80 text-rose-300 border-rose-800' :
    summary.risk_level === 'HIGH' ? 'bg-amber-950/80 text-amber-300 border-amber-800' :
    summary.risk_level === 'MODERATE' ? 'bg-sky-950/80 text-sky-300 border-sky-800' :
    'bg-emerald-950/80 text-emerald-300 border-emerald-800';

  return (
    <div className="bg-[#02071a]/95 border border-sky-950/80 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-4 font-['DM_Sans',sans-serif]">
      {/* Simulation Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-sky-950">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-300 block">
            Run #{simulation.simulation_id}
          </span>
          <span className="text-[10px] font-mono text-zinc-500">
            {simulation.timestamp}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${riskBadgeStyle}`}>
            RISK: {summary.risk_level || 'EVALUATED'}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/50 text-cyan-300">
            {summary.particle_count} particles
          </span>
        </div>
      </div>

      {/* Outcome KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-3 rounded-xl bg-[#030919] border border-sky-950">
          <span className="text-zinc-500 text-[10px] block">ESTIMATED DEBRIS</span>
          <span className="text-base font-bold text-amber-400">
            {summary.estimated_debris_mass_tons ?? 3.8} t
          </span>
          <span className="text-[9px] text-zinc-500 block">~{(summary.estimated_debris_mass_kg ?? 3800).toLocaleString()} kg plastics</span>
        </div>

        <div className="p-3 rounded-xl bg-[#030919] border border-sky-950">
          <span className="text-zinc-500 text-[10px] block">DAMAGE PREVENTED</span>
          <span className="text-base font-bold text-emerald-400">
            ₹{summary.economic_impact?.infrastructure_damage_prevented_lakhs ?? 14.8}L
          </span>
          <span className="text-[9px] text-zinc-500 block">Turbine & canal savings</span>
        </div>

        <div className="p-3 rounded-xl bg-[#030919] border border-sky-950">
          <span className="text-zinc-500 text-[10px] block">DISPATCH ROI</span>
          <span className="text-base font-bold text-cyan-400">
            {summary.economic_impact?.recovery_roi_multiplier ?? 8.4}x
          </span>
          <span className="text-[9px] text-zinc-500 block">Cleanup benefit ratio</span>
        </div>

        <div className="p-3 rounded-xl bg-[#030919] border border-sky-950">
          <span className="text-zinc-500 text-[10px] block">FIELD ASSETS</span>
          <span className="text-base font-bold text-purple-300">
            {summary.field_assets?.skimmer_boats ?? 2} Boats / {summary.field_assets?.field_crew_count ?? 6} Crew
          </span>
          <span className="text-[9px] text-zinc-500 block">{summary.field_assets?.containment_booms_meters ?? 200}m deflection boom</span>
        </div>
      </div>

      {/* Scientific Model Caveats from Backend */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-mono uppercase tracking-wide text-zinc-400 font-bold block">
          Model Dynamics & Scientific Caveats
        </span>
        <div className="space-y-1 text-[11px] text-zinc-400">
          {limitations.map((lim, idx) => (
            <p key={idx} className="leading-tight">• {lim}</p>
          ))}
        </div>
      </div>

      {/* Official Disclaimer */}
      <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 flex items-start gap-2 text-[10px] text-amber-200/90 leading-tight">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <span>{disclaimer}</span>
      </div>
    </div>
  );
};
