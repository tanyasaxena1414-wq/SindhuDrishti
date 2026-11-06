import React, { useState, useMemo } from 'react';
import { 
  Satellite, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal,
  ExternalLink,
  Layers,
  Sparkles,
  Search,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  MapPin,
  Filter,
  Check
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
  const [isSectionExpanded, setIsSectionExpanded] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<'all' | 'high' | 'standard'>('all');

  const filteredItems = useMemo(() => {
    return priorities.filter((item) => {
      // Source filter
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;

      // Tier filter
      if (tierFilter === 'high' && item.priority_score < 0.6) return false;
      if (tierFilter === 'standard' && item.priority_score >= 0.6) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesExpl = item.explanation.toLowerCase().includes(q);
        const matchesCoords = `${item.latitude},${item.longitude}`.includes(q);
        if (!matchesId && !matchesExpl && !matchesCoords) return false;
      }

      return true;
    });
  }, [priorities, sourceFilter, tierFilter, searchQuery]);

  return (
    <div className="rounded-2xl bg-[#02071a]/90 border border-sky-950/80 backdrop-blur-xl shadow-xl overflow-hidden transition-all duration-200 font-['DM_Sans',sans-serif]">
      {/* Panel Header */}
      <div 
        onClick={() => setIsSectionExpanded(!isSectionExpanded)}
        className="p-3.5 sm:p-4 bg-gradient-to-r from-[#030e29] to-[#02081d] border-b border-sky-950/70 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-950/80 border border-sky-800/60 flex items-center justify-center text-cyan-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Algorithmic Cleanup Priorities Queue
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                {total} Ranked Targets
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Multi-factor heuristic engine scoring satellite debris & citizen reports
            </p>
          </div>
        </div>

        <button 
          type="button" 
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-sky-950/60 transition-colors"
          aria-label={isSectionExpanded ? 'Collapse section' : 'Expand section'}
        >
          {isSectionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isSectionExpanded && (
        <div className="p-4 sm:p-6 space-y-4">
          {/* Controls Sub-bar: Search, Source Filter, Tier Filter, View Mode */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#03091e]/70 border border-sky-950">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by ID, keywords, GPS..."
                  className="w-full bg-[#020512] border border-sky-950 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Source Filter Pills */}
              <div className="flex items-center gap-1 bg-[#020512] border border-sky-950 p-1 rounded-xl text-xs font-mono">
                <button
                  type="button"
                  onClick={() => onSourceFilterChange('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    sourceFilter === 'all'
                      ? 'bg-sky-950/90 text-cyan-300 border border-cyan-800/60 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All Sources
                </button>
                <button
                  type="button"
                  onClick={() => onSourceFilterChange('satellite_candidate_hotspot')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    sourceFilter === 'satellite_candidate_hotspot'
                      ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-800/60 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Satellite className="w-3 h-3 text-cyan-400" />
                  <span>Satellite</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSourceFilterChange('citizen_report')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    sourceFilter === 'citizen_report'
                      ? 'bg-blue-950/90 text-blue-300 border border-blue-800/60 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3 text-blue-400" />
                  <span>Citizen</span>
                </button>
              </div>

              {/* Score Tier Filter */}
              <div className="flex items-center gap-1 bg-[#020512] border border-sky-950 p-1 rounded-xl text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setTierFilter('all')}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    tierFilter === 'all'
                      ? 'bg-sky-900/40 text-cyan-300 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All Tiers
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter('high')}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    tierFilter === 'high'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  High &gt; 0.6
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter('standard')}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    tierFilter === 'standard'
                      ? 'bg-slate-800 text-zinc-200 border border-slate-700 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Standard
                </button>
              </div>
            </div>

            {/* View Switcher: Grid vs Table */}
            <div className="flex items-center gap-1 bg-[#020512] border border-sky-950 p-1 rounded-xl text-xs font-mono">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-sky-950 text-cyan-300 border border-cyan-800/60'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-sky-950 text-cyan-300 border border-cyan-800/60'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Dense Operations Table"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Priorities Content */}
          {isLoading ? (
            <div className="p-12 text-center text-xs font-mono text-cyan-400 animate-pulse bg-[#02071a]/50 rounded-2xl border border-sky-950 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <span>Querying multi-factor ranking heuristics from backend...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-zinc-500 bg-[#02071a]/50 rounded-2xl border border-sky-950 space-y-1">
              <p className="text-zinc-400 font-bold">No cleanup targets match your active filters.</p>
              <p className="text-zinc-500 text-[11px]">Try adjusting the search query or tier filters above.</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredItems.map((item, idx) => {
                const isSatellite = item.source === 'satellite_candidate_hotspot';
                const rankNumber = (page - 1) * 20 + idx + 1;
                const isHigh = item.priority_score >= 0.6;

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectPriority(item)}
                    className="p-4 rounded-xl bg-[#03091e]/90 border border-sky-950/80 hover:border-cyan-400/60 transition-all duration-200 cursor-pointer group shadow-lg flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-md text-[10px] font-mono flex items-center justify-center font-bold ${
                            isHigh
                              ? 'bg-cyan-950 border border-cyan-500/80 text-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                              : 'bg-[#020512] border border-sky-900/60 text-zinc-400'
                          }`}>
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

                        <span className={`text-xs font-mono font-bold ${
                          isHigh ? 'text-cyan-300' : 'text-zinc-300'
                        }`}>
                          Score: {item.priority_score.toFixed(3)}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 leading-snug line-clamp-2">
                        {item.explanation}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-sky-950/70">
                      {/* Score Meter */}
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            isHigh ? 'bg-cyan-400 shadow-[0_0_6px_#38bdf8]' : 'bg-sky-500'
                          }`}
                          style={{ width: `${Math.min(item.priority_score * 100, 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>{item.latitude.toFixed(4)}°N, {item.longitude.toFixed(4)}°E</span>
                        </span>
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
          ) : (
            /* Table View */
            <div className="overflow-x-auto rounded-xl border border-sky-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#03091c] text-zinc-400 border-b border-sky-950 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3">Coordinates</th>
                    <th className="py-2.5 px-3">Priority Score</th>
                    <th className="py-2.5 px-3">Rationale</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-950/60 bg-[#02071a]/70">
                  {filteredItems.map((item, idx) => {
                    const isSatellite = item.source === 'satellite_candidate_hotspot';
                    const rankNumber = (page - 1) * 20 + idx + 1;
                    const isHigh = item.priority_score >= 0.6;

                    return (
                      <tr 
                        key={item.id} 
                        onClick={() => onSelectPriority(item)}
                        className="hover:bg-sky-950/40 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-3 font-bold text-white">#{rankNumber}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] border ${
                            isSatellite 
                              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/40' 
                              : 'bg-blue-950/80 text-blue-300 border-blue-800/40'
                          }`}>
                            {isSatellite ? 'Satellite' : 'Citizen'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-300 text-[11px]">
                          {item.latitude.toFixed(3)}°N, {item.longitude.toFixed(3)}°E
                        </td>
                        <td className="py-2.5 px-3 font-bold text-cyan-300">
                          {item.priority_score.toFixed(3)}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400 max-w-md truncate text-[11px]">
                          {item.explanation}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPriority(item);
                            }}
                            className="px-2 py-1 rounded bg-sky-950 border border-sky-800 text-[10px] text-cyan-300 hover:text-white hover:border-cyan-400 transition-colors"
                          >
                            Factors
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#03091e]/70 border border-sky-950 text-xs font-mono">
              <span className="text-zinc-400">
                Page {page} of {totalPages} ({total} Total Ranked Targets)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange(Math.max(page - 1, 1))}
                  disabled={page <= 1 || isLoading}
                  className="p-1.5 rounded-lg bg-[#020512] border border-sky-950 text-zinc-300 hover:text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
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
      )}
    </div>
  );
};
