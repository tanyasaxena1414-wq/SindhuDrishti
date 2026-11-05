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
import { BarChart3, RefreshCw, AlertTriangle, Database } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [prioritiesData, setPrioritiesData] = useState<CleanupPriorityResponse | null>(null);
  
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [isLoadingPriorities, setIsLoadingPriorities] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [sourceFilter, setSourceFilter] = useState<'all' | DataSource>('all');
  const [selectedItem, setSelectedItem] = useState<CleanupPriorityItem | null>(null);

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
    <div className="flex-1 w-full max-w-[1720px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 font-['DM_Sans',sans-serif]">
      {/* Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-sky-950/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Intelligence & Cleanup Priorities</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                Live FastAPI
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              Godavari Basin Debris Prioritization & Statistical Analytics
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            loadData();
            loadPriorities(page);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#030919] border border-sky-900/60 text-xs font-mono text-zinc-300 hover:text-white hover:border-cyan-400 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats || isLoadingPriorities ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Sync Metrics</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Metric Cards */}
      <section>
        <MetricCards stats={stats} isLoading={isLoadingStats} />
      </section>

      {/* Cleanup Priorities Section */}
      <section className="space-y-3">
        <PriorityList
          priorities={prioritiesData?.priorities || []}
          total={prioritiesData?.total || 0}
          page={page}
          totalPages={prioritiesData?.total_pages || 1}
          isLoading={isLoadingPriorities}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          onPageChange={setPage}
          onSelectPriority={setSelectedItem}
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
