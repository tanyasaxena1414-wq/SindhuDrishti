import React from 'react';
import { 
  Satellite, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { CleanupPriorityItem, DataSource } from '../../types';

interface PriorityListProps {
  priorities: CleanupPriorityItem[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  sourceFilter: 'all' | DataSource;
  onSourceFilterChange: (filter: 'all' | DataSource) => void;
  onPageChange: (newPage: number) => void;
  onSelectPriority: (item: CleanupPriorityItem) => void;
}

export const PriorityList: React.FC<PriorityListProps> = ({
  priorities,
  total,
  page,
  totalPages,
  isLoading,
  sourceFilter,
  onSourceFilterChange,
  onPageChange,
  onSelectPriority,
}) => {
  const displayedItems = priorities.filter((item) => {
    if (sourceFilter === 'all') return true;
    return item.source === sourceFilter;
  });

  return (
    <div className="space-y-4">
      {/* Sub-bar Filter & Counts */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#03091c]/80 border border-sky-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
            Ranked Targets ({total})
          </span>
          <span className="text-zinc-600">·</span>
          <span className="text-[11px] font-mono text-zinc-400">
            Multi-factor Heuristic Engine
          </span>
        </div>

        {/* Source Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#020512] border border-sky-950 p-1 rounded-xl text-xs font-mono">
          <button
            onClick={() => onSourceFilterChange('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              sourceFilter === 'all'
                ? 'bg-sky-950/80 text-cyan-300 border border-cyan-800/60'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onSourceFilterChange('satellite_candidate_hotspot')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              sourceFilter === 'satellite_candidate_hotspot'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Satellite className="w-3 h-3" />
            <span>Satellite</span>
          </button>
          <button
            onClick={() => onSourceFilterChange('citizen_report')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              sourceFilter === 'citizen_report'
                ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Citizen</span>
          </button>
        </div>
      </div>

      {/* Priorities Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono text-zinc-500 animate-pulse bg-[#02071a]/50 rounded-2xl border border-sky-950">
          Loading priority rankings from backend...
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="p-12 text-center text-xs font-mono text-zinc-500 bg-[#02071a]/50 rounded-2xl border border-sky-950">
          No cleanup priority targets match the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayedItems.map((item, idx) => {
            const isSatellite = item.source === 'satellite_candidate_hotspot';
            const rankNumber = (page - 1) * 20 + idx + 1;

            return (
              <div
                key={item.id}
                onClick={() => onSelectPriority(item)}
                className="p-4 rounded-2xl bg-[#02071a]/80 border border-sky-950/80 hover:border-cyan-400/50 transition-all duration-200 cursor-pointer group shadow-lg flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-[#030919] border border-sky-900/60 text-[10px] font-mono text-cyan-300 flex items-center justify-center font-bold">
                        #{rankNumber}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        isSatellite 
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/40' 
                          : 'bg-blue-950/80 text-blue-300 border-blue-800/40'
                      }`}>
                        {isSatellite ? 'Satellite Anomaly' : 'Citizen Report'}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-bold text-cyan-300">
                      Score: {item.priority_score.toFixed(3)}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-snug line-clamp-2">
                    {item.explanation}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-sky-950/70">
                  {/* Score bar */}
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.priority_score > 0.6 ? 'bg-cyan-400' : 'bg-sky-500'
                      }`}
                      style={{ width: `${Math.min(item.priority_score * 100, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span>{item.latitude.toFixed(3)}°N, {item.longitude.toFixed(3)}°E</span>
                    <span className="text-cyan-400 group-hover:underline flex items-center gap-1">
                      <span>Inspect Factors</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#03091c]/80 border border-sky-950/80 backdrop-blur-xl text-xs font-mono">
          <span className="text-zinc-400">
            Page {page} of {totalPages} ({total} Total Priorities)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(page - 1, 1))}
              disabled={page <= 1 || isLoading}
              className="p-1.5 rounded-lg bg-[#020512] border border-sky-950 text-zinc-300 hover:text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(Math.min(page + 1, totalPages))}
              disabled={page >= totalPages || isLoading}
              className="p-1.5 rounded-lg bg-[#020512] border border-sky-950 text-zinc-300 hover:text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
