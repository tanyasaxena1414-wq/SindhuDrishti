import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { 
  DashboardStats, 
  CleanupPriorityResponse, 
  CleanupPriorityItem, 
  HealthResponse, 
  DataSource 
} from '../../types';
import { MetricCards } from './MetricCards';
import { PriorityList } from './PriorityList';
import { FactorModal } from './FactorModal';
import { 
  BarChart3, 
  RefreshCw, 
  AlertTriangle, 
  Database,
  BookOpen, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  Scale, 
  CheckCircle2,
  Compass
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const DashboardPage: React.FC = () => {
  const { isDark } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [prioritiesData, setPrioritiesData] = useState<CleanupPriorityResponse | null>(null);
  
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [isLoadingPriorities, setIsLoadingPriorities] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [sourceFilter, setSourceFilter] = useState<'all' | DataSource>('all');
  const [selectedItem, setSelectedItem] = useState<CleanupPriorityItem | null>(null);
  const [isMethodologyExpanded, setIsMethodologyExpanded] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setIsLoadingStats(true);
    setErrorMessage(null);
    try {
      const [h, s] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getDashboardStats().catch((err) => {
          console.warn('Failed to load dashboard stats:', err);
          return null;
        }),
      ]);
      setHealth(h);
      setStats(s);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const loadPriorities = useCallback(async (p: number) => {
    setIsLoadingPriorities(true);
    try {
      const data = await api.getCleanupPriorities(p, 20);
      setPrioritiesData(data);
    } catch (err: any) {
      console.warn('Failed to load cleanup priorities:', err);
    } finally {
      setIsLoadingPriorities(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadPriorities(page);
  }, [loadPriorities, page]);

  return (
    <div className="flex-1 w-full max-w-[1720px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 font-sans">
      {/* Workspace Header */}
      <div 
        className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b transition-colors ${
          isDark ? 'border-[#0e2a47]' : 'border-[#cbd5e1]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div 
            className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm ${
              isDark 
                ? 'bg-[#073b55] border-[#18c9e8]/40 text-[#18c9e8]' 
                : 'bg-[#dceaf4] border-[#cbd5e1] text-[#0284c7]'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
              <span>Operational Intelligence & Prioritization Hub</span>
              <span 
                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                  isDark 
                    ? 'bg-[#051324] text-[#18c9e8] border border-[#18c9e8]/30' 
                    : 'bg-[#edf2f7] text-[#0284c7] border border-[#cbd5e1]'
                }`}
              >
                FastAPI Engine
              </span>
            </h1>
            <p className="text-xs text-zinc-500">
              Godavari Basin Debris Prioritization, Scientific Telemetry & Ground-Truth Verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              loadData();
              loadPriorities(page);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
              isDark 
                ? 'bg-[#051324] border-[#0e2a47] text-zinc-300 hover:text-white hover:border-[#18c9e8]' 
                : 'bg-white border-[#cbd5e1] text-zinc-700 hover:text-black hover:border-[#0284c7]'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats || isLoadingPriorities ? 'animate-spin text-[#18c9e8]' : ''}`} />
            <span>Sync Live Metrics</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-500">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section 1: KPI Telemetry Cards */}
      <section>
        <MetricCards stats={stats} isLoading={isLoadingStats} />
      </section>

      {/* Section 2: Algorithmic Cleanup Priorities Queue */}
      <section>
        <PriorityList
          priorities={prioritiesData?.priorities || []}
          isLoading={isLoadingPriorities}
          page={page}
          totalPages={prioritiesData?.total_pages || 1}
          total={prioritiesData?.total || 0}
          onPageChange={setPage}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          onSelectPriority={(item) => setSelectedItem(item)}
        />
      </section>

      {/* Factor Breakdown Modal */}
      {selectedItem && (
        <FactorModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};
