import React from 'react';
import { X, Satellite, ShieldCheck, Scale, AlertTriangle } from 'lucide-react';
import { CleanupPriorityItem } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface FactorModalProps {
  item: CleanupPriorityItem;
  onClose: () => void;
}

export const FactorModal: React.FC<FactorModalProps> = ({ item, onClose }) => {
  const { isDark } = useTheme();
  const isSatellite = item.source === 'satellite_candidate_hotspot';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in select-none font-sans">
      <div 
        className={`w-full max-w-xl rounded-2xl p-6 shadow-2xl relative space-y-4 border ${
          isDark ? 'bg-[#020817] border-[#0e2a47] text-[#f8fafc]' : 'bg-white border-[#cbd5e1] text-[#0f172a]'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-[#0e2a47]' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            <div 
              className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                isSatellite 
                  ? isDark ? 'bg-[#073b55] border-[#18c9e8]/50 text-[#18c9e8]' : 'bg-sky-50 border-sky-300 text-sky-700'
                  : isDark ? 'bg-blue-950/80 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-700'
              }`}
            >
              {isSatellite ? <Satellite className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span>Priority Item Breakdown</span>
                <span 
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-[#071a2e] text-[#18c9e8] border border-[#18c9e8]/30' : 'bg-sky-50 text-[#0284c7] border border-sky-200'
                  }`}
                >
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
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-black hover:bg-black/5'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Priority Score Visual Bar */}
        <div 
          className={`space-y-1.5 p-3.5 rounded-xl border ${
            isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-slate-50 border-[#cbd5e1]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-500">Composite Priority Rank</span>
            <span className={`font-bold ${isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]'}`}>
              {(item.priority_score * 100).toFixed(1)}%
            </span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div 
              className="h-full bg-gradient-to-r from-sky-400 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(item.priority_score * 100, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-500 leading-tight pt-1">
            {item.explanation}
          </p>
        </div>

        {/* Contributing Factors List */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
            <Scale className={`w-3.5 h-3.5 ${isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]'}`} />
            <span>Mathematical Factor Weights</span>
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {item.factors.map((factor, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-xl border space-y-1 ${
                  isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-slate-50 border-[#e2e8f0]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold">{factor.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-[10px]">Val: {factor.value}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      isDark ? 'bg-[#073b55] text-[#18c9e8]' : 'bg-sky-100 text-[#0284c7]'
                    }`}>
                      Weight: {Math.round(factor.weight * 100)}%
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 leading-tight">
                  {factor.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Scientific Limitations Warning */}
        <div className={`p-2.5 rounded-xl border flex items-start gap-2 text-[10px] leading-tight ${
          isDark ? 'bg-amber-950/20 border-amber-800/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <span>
            Scores represent relative prioritization rankings to guide verification teams, not confirmed plastic tonnage or absolute environmental risk.
          </span>
        </div>
      </div>
    </div>
  );
};
