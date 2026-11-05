import React from 'react';
import { X, Satellite, ShieldCheck, Scale, Info, AlertTriangle } from 'lucide-react';
import { CleanupPriorityItem } from '../../types';

interface FactorModalProps {
  item: CleanupPriorityItem;
  onClose: () => void;
}

export const FactorModal: React.FC<FactorModalProps> = ({ item, onClose }) => {
  const isSatellite = item.source === 'satellite_candidate_hotspot';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in select-none font-['DM_Sans',sans-serif]">
      <div className="w-full max-w-xl bg-[#02071a] border border-sky-800/60 rounded-2xl p-6 shadow-2xl relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sky-950">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isSatellite ? 'bg-cyan-950/80 border border-cyan-800/60 text-cyan-300' : 'bg-blue-950/80 border border-blue-800/60 text-blue-300'
            }`}>
              {isSatellite ? <Satellite className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Priority Item Breakdown</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                  Score: {item.priority_score.toFixed(3)}
                </span>
              </h3>
              <p className="text-[11px] font-mono text-zinc-400">
                ID: {item.id} · Lat: {item.latitude.toFixed(4)}, Lon: {item.longitude.toFixed(4)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-sky-950 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Priority Score Visual Bar */}
        <div className="space-y-1.5 bg-[#030919] border border-sky-950 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">Composite Priority Rank</span>
            <span className="text-cyan-300 font-bold">{(item.priority_score * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-sky-400 to-cyan-300 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(item.priority_score * 100, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-400 leading-tight pt-1">
            {item.explanation}
          </p>
        </div>

        {/* Contributing Factors List */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mathematical Factor Weights</span>
          </h4>
          <div className="space-y-2">
            {item.factors.map((factor, i) => (
              <div key={i} className="p-3 rounded-xl bg-[#030919] border border-sky-950 space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-white">{factor.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-[10px]">Val: {factor.value}</span>
                    <span className="px-1.5 py-0.2 rounded bg-sky-950 text-cyan-300 text-[10px]">
                      Weight: {Math.round(factor.weight * 100)}%
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 leading-tight">
                  {factor.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Raw Data Accordion */}
        <div className="p-3 rounded-xl bg-[#01040f] border border-sky-950 space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide block">
            Payload Metadata (Raw)
          </span>
          <pre className="text-[10px] font-mono text-zinc-400 overflow-x-auto max-h-24 p-2 bg-[#020512] rounded border border-sky-950/70">
            {JSON.stringify(item.raw_data, null, 2)}
          </pre>
        </div>

        {/* Scientific Limitations Warning */}
        <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-800/30 flex items-start gap-2 text-[10px] text-amber-200/90 leading-tight">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Scores represent relative prioritization rankings to guide verification teams, not confirmed plastic tonnage or absolute environmental risk.
          </span>
        </div>
      </div>
    </div>
  );
};
