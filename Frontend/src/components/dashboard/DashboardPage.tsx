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
    <div className="flex-1 w-full max-w-[1720px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 font-['DM_Sans',sans-serif]">
      {/* Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-sky-950/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Operational Intelligence & Prioritization Hub</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                Live FastAPI · SQLite
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#030919] border border-sky-900/60 text-xs font-mono text-zinc-300 hover:text-white hover:border-cyan-400 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats || isLoadingPriorities ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Sync Live Metrics</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section 1: Grouped & Collapsible KPI Telemetry Cards */}
      <section>
        <MetricCards stats={stats} isLoading={isLoadingStats} />
      </section>

      {/* Section 2: Algorithmic Cleanup Priorities Queue (Grouped & Collapsible) */}
      <section>
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

      {/* Section 3: Scientific Methodology & Limitations Governance (Collapsible) */}
      <section className="rounded-2xl bg-[#02071a]/90 border border-sky-950/80 backdrop-blur-xl shadow-xl overflow-hidden transition-all duration-200">
        <div 
          onClick={() => setIsMethodologyExpanded(!isMethodologyExpanded)}
          className="p-3.5 sm:p-4 bg-gradient-to-r from-[#030e29] to-[#02081d] border-b border-sky-950/70 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-300">
              <Scale className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Scoring Methodology & Scientific Governance
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/40 hidden sm:inline">
                  Transparent Heuristics
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Weighting criteria, multi-factor calculations, and field verification disclaimers
              </p>
            </div>
          </div>

          <button 
            type="button" 
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-sky-950/60 transition-colors"
            aria-label={isMethodologyExpanded ? 'Collapse section' : 'Expand section'}
          >
            {isMethodologyExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isMethodologyExpanded && (
          <div className="p-4 sm:p-6 space-y-4 text-xs font-mono">
            {/* Methodology Narrative from Backend */}
            <div className="p-3.5 rounded-xl bg-[#03091e]/80 border border-sky-950 space-y-2">
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Heuristic Weighting Engine</span>
              </span>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                {prioritiesData?.methodology || (
                  'Transparent multi-factor scoring. Satellite hotspots: area (40%), detection count (30%), verification status (30%). Citizen reports: verification status (50%), recency (30%), description detail (20%). Scores are relative rankings, not absolute risk assessments.'
                )}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 rounded-lg bg-[#010617] border border-sky-900/40 space-y-1">
                  <span className="text-cyan-300 font-bold text-[10px] uppercase">
                    🛰️ Satellite Hotspot Weights:
                  </span>
                  <ul className="text-zinc-400 text-[10px] space-y-0.5 list-disc list-inside">
                    <li>Surface Area: <span className="text-white font-bold">40% weight</span></li>
                    <li>Detection Count / Persistence: <span className="text-white font-bold">30% weight</span></li>
                    <li>Verification Status: <span className="text-white font-bold">30% weight</span></li>
                  </ul>
                </div>

                <div className="p-2.5 rounded-lg bg-[#010617] border border-sky-900/40 space-y-1">
                  <span className="text-blue-300 font-bold text-[10px] uppercase">
                    👥 Citizen Report Weights:
                  </span>
                  <ul className="text-zinc-400 text-[10px] space-y-0.5 list-disc list-inside">
                    <li>Verification Review Status: <span className="text-white font-bold">50% weight</span></li>
                    <li>Submission Recency: <span className="text-white font-bold">30% weight</span></li>
                    <li>Description & Evidence Detail: <span className="text-white font-bold">20% weight</span></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Scientific Limitations & Operational Disclaimers */}
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Field Limitations & Research Disclaimers</span>
              </span>
              <ul className="space-y-1 text-zinc-300 text-[11px]">
                {(prioritiesData?.limitations && prioritiesData.limitations.length > 0
                  ? prioritiesData.limitations
                  : [
                      'Satellite hotspots are UNVERIFIED candidate anomalies, not confirmed plastic pollution.',
                      'Citizen reports are self-reported and vary in reliability.',
                      'Scoring weights are heuristic and not calibrated to ground truth.',
                      'No population exposure, ecological sensitivity, or hydrological modeling included.',
                      'Results should inform field verification, not direct cleanup deployment.',
                    ]
                ).map((limitation, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">·</span>
                    <span>{limitation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
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
