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
import { useTheme } from '../../context/ThemeContext';

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
  const { isDark } = useTheme();
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
    <div 
      className={`rounded-2xl border backdrop-blur-xl shadow-md overflow-hidden transition-all duration-200 font-sans ${
        isDark ? 'bg-[#071a2e]/60 border-[#0e2a47]' : 'bg-white/95 border-[#cddce9] shadow-[0_4px_20px_rgba(9,30,58,0.05)]'
      }`}
    >
      {/* Panel Header */}
      <div 
        onClick={() => setIsSectionExpanded(!isSectionExpanded)}
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
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
                Algorithmic Cleanup Priorities Queue
              </h3>
              <span 
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-[#071a2e] text-[#18c9e8] border border-[#18c9e8]/30' : 'bg-sky-50 text-[#0284c7] border border-sky-200 shadow-xs'
                }`}
              >
                {total} Ranked Targets
              </span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-[#486581]'}`}>
              Multi-factor heuristic engine scoring satellite debris & citizen reports
            </p>
          </div>
        </div>

        <button 
          type="button" 
          className={`p-1 rounded-lg transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-[#06152b]'}`}
          aria-label={isSectionExpanded ? 'Collapse section' : 'Expand section'}
        >
          {isSectionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isSectionExpanded && (
        <div className="p-4 sm:p-6 space-y-4">
          {/* Controls Sub-bar: Search, Source Filter, Tier Filter, View Mode */}
          <div 
            className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border ${
              isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-[#f4f8fc] border-[#d2e1ee]'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by ID, keywords, GPS..."
                  className={`w-full rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono focus:outline-none border transition-colors ${
                    isDark 
                      ? 'bg-[#020817] border-[#0e2a47] text-white placeholder:text-zinc-600 focus:border-[#18c9e8]' 
                      : 'bg-white border-[#cddce9] text-[#071d3d] placeholder:text-[#94a3b8] focus:border-[#0284c7]'
                  }`}
                />
              </div>

              {/* Source Filter Pills */}
              <div 
                className={`flex items-center gap-1 p-1 rounded-xl text-xs font-mono border ${
                  isDark ? 'bg-[#020817] border-[#0e2a47]' : 'bg-white border-[#cddce9]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSourceFilterChange('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    sourceFilter === 'all'
                      ? isDark ? 'bg-[#073b55] text-[#18c9e8] font-bold' : 'bg-slate-100 text-[#0284c7] font-bold'
                      : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-[#06152b]'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => onSourceFilterChange('satellite_candidate_hotspot')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    sourceFilter === 'satellite_candidate_hotspot'
                      ? isDark ? 'bg-[#073b55] text-[#18c9e8] font-bold' : 'bg-slate-100 text-[#0284c7] font-bold'
                      : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-[#06152b]'
                  }`}
                >
                  <Satellite className="w-3 h-3 text-cyan-500" />
                  <span>Satellite</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSourceFilterChange('citizen_report')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    sourceFilter === 'citizen_report'
                      ? isDark ? 'bg-[#073b55] text-[#18c9e8] font-bold' : 'bg-slate-100 text-[#0284c7] font-bold'
                      : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-[#06152b]'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3 text-blue-500" />
                  <span>Citizen</span>
                </button>
              </div>

              {/* Score Tier Filter */}
              <div 
                className={`flex items-center gap-1 p-1 rounded-xl text-xs font-mono border ${
                  isDark ? 'bg-[#020817] border-[#0e2a47]' : 'bg-white border-[#cbd5e1]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setTierFilter('all')}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    tierFilter === 'all'
                      ? isDark ? 'bg-[#073b55] text-[#18c9e8] font-bold' : 'bg-slate-100 text-[#0284c7] font-bold'
                      : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-[#06152b]'
                  }`}
                >
                  All Tiers
                </button>
                <button
                  type="button"
                  onClick={() => setTierFilter('high')}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    tierFilter === 'high'
                      ? isDark ? 'bg-[#073b55] text-[#18c9e8] font-bold' : 'bg-slate-100 text-[#0284c7] font-bold'
                      : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-[#06152b]'
                  }`}
                >
                  High &gt; 0.6
                </button>
              </div>
            </div>

            {/* View Switcher: Grid vs Table */}
            <div 
              className={`flex items-center gap-1 p-1 rounded-xl text-xs font-mono border ${
                isDark ? 'bg-[#020817] border-[#0e2a47]' : 'bg-white border-[#cbd5e1]'
              }`}
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? isDark ? 'bg-[#073b55] text-[#18c9e8]' : 'bg-slate-100 text-[#0284c7]'
                    : 'text-zinc-400'
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
                    ? isDark ? 'bg-[#073b55] text-[#18c9e8]' : 'bg-slate-100 text-[#0284c7]'
                    : 'text-zinc-400'
                }`}
                title="Dense Operations Table"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Priorities Content */}
          {isLoading ? (
            <div className="p-12 text-center text-xs font-mono text-cyan-500 animate-pulse rounded-2xl border flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
              <span>Querying multi-factor ranking heuristics from backend...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-zinc-500 rounded-2xl border space-y-1">
              <p className="font-bold">No cleanup targets match your active filters.</p>
              <p className="text-[11px]">Try adjusting the search query or tier filters above.</p>
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
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer group shadow-sm flex flex-col justify-between space-y-3 ${
                      isDark 
                        ? 'bg-[#051324]/80 border-[#0e2a47] hover:border-[#18c9e8]' 
                        : 'bg-gradient-to-br from-white to-[#f4f8fc] border-[#d2e1ee] hover:border-[#0284c7] hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span 
                            className={`w-6 h-6 rounded-md text-[10px] font-mono flex items-center justify-center font-bold ${
                              isHigh
                                ? isDark ? 'bg-[#073b55] text-[#18c9e8] border border-[#18c9e8]/50' : 'bg-sky-50 text-[#0284c7] border border-sky-300'
                                : isDark ? 'bg-[#020817] text-zinc-400 border border-[#0e2a47]' : 'bg-slate-100 text-zinc-600 border border-slate-300'
                            }`}
                          >
                            #{rankNumber}
                          </span>
                          <span 
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                              isSatellite 
                                ? isDark ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/40' : 'bg-sky-50 text-sky-700 border-sky-200'
                                : isDark ? 'bg-blue-950/80 text-blue-300 border-blue-800/40' : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {isSatellite ? 'Satellite' : 'Citizen'}
                          </span>
                        </div>

                        <span className={`text-xs font-mono font-bold ${isHigh ? (isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]') : 'text-zinc-500'}`}>
                          Score: {item.priority_score.toFixed(3)}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-500 leading-snug line-clamp-2">
                        {item.explanation}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-zinc-500/20">
                      {/* Score Meter */}
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            isHigh ? (isDark ? 'bg-[#18c9e8]' : 'bg-[#0284c7]') : 'bg-sky-400'
                          }`}
                          style={{ width: `${Math.min(item.priority_score * 100, 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-500" />
                          <span>{item.latitude.toFixed(4)}°N, {item.longitude.toFixed(4)}°E</span>
                        </span>
                        <span className="group-hover:underline flex items-center gap-1 text-cyan-500">
                          <span>Factors</span>
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
            <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-[#0e2a47]' : 'border-[#cbd5e1]'}`}>
              <table className="w-full text-left text-xs font-mono">
                <thead className={`border-b text-[10px] uppercase tracking-wider ${isDark ? 'bg-[#051324] border-[#0e2a47] text-zinc-400' : 'bg-slate-100 border-[#cbd5e1] text-zinc-600'}`}>
                  <tr>
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3">Coordinates</th>
                    <th className="py-2.5 px-3">Priority Score</th>
                    <th className="py-2.5 px-3">Rationale</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#0e2a47] bg-[#020817]/70' : 'divide-slate-200 bg-white'}`}>
                  {filteredItems.map((item, idx) => {
                    const isSatellite = item.source === 'satellite_candidate_hotspot';
                    const rankNumber = (page - 1) * 20 + idx + 1;

                    return (
                      <tr 
                        key={item.id} 
                        onClick={() => onSelectPriority(item)}
                        className={`cursor-pointer transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                      >
                        <td className="py-2.5 px-3 font-bold">#{rankNumber}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] border ${
                            isSatellite 
                              ? isDark ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/40' : 'bg-sky-50 text-sky-700 border-sky-200'
                              : isDark ? 'bg-blue-950/80 text-blue-300 border-blue-800/40' : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {isSatellite ? 'Satellite' : 'Citizen'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 text-[11px]">
                          {item.latitude.toFixed(3)}°N, {item.longitude.toFixed(3)}°E
                        </td>
                        <td className={`py-2.5 px-3 font-bold ${isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]'}`}>
                          {item.priority_score.toFixed(3)}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 max-w-md truncate text-[11px]">
                          {item.explanation}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPriority(item);
                            }}
                            className={`px-2 py-1 rounded border text-[10px] transition-colors cursor-pointer ${
                              isDark 
                                ? 'bg-[#073b55] border-[#18c9e8]/40 text-[#18c9e8]' 
                                : 'bg-white border-[#cbd5e1] text-[#0284c7]'
                            }`}
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
            <div 
              className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-mono ${
                isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-slate-50 border-[#cbd5e1]'
              }`}
            >
              <span className="text-zinc-500">
                Page {page} of {totalPages} ({total} Total Ranked Targets)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange(Math.max(page - 1, 1))}
                  disabled={page <= 1 || isLoading}
                  className={`p-1.5 rounded-lg border disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed ${
                    isDark ? 'bg-[#020817] border-[#0e2a47] text-zinc-300' : 'bg-white border-[#cbd5e1] text-zinc-700'
                  }`}
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange(Math.min(page + 1, totalPages))}
                  disabled={page >= totalPages || isLoading}
                  className={`p-1.5 rounded-lg border disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed ${
                    isDark ? 'bg-[#020817] border-[#0e2a47] text-zinc-300' : 'bg-white border-[#cbd5e1] text-zinc-700'
                  }`}
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
