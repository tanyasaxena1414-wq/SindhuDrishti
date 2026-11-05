import React, { useEffect, useState } from 'react';
import { 
  Compass, 
  BarChart3, 
  Wind, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  Satellite, 
  Layers, 
  MapPin, 
  Activity,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { DashboardStats, NavigationTab, StudyAreaMetadata } from '../../types';

interface LandingPageProps {
  onSelectTab: (tab: NavigationTab) => void;
  onOpenReportModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectTab,
  onOpenReportModal,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [studyArea, setStudyArea] = useState<StudyAreaMetadata | null>(null);

  useEffect(() => {
    api.getDashboardStats().then(setStats).catch(() => null);
    api.getStudyArea().then(setStudyArea).catch(() => null);
  }, []);

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] bg-[#01040c] text-white overflow-hidden flex flex-col font-['DM_Sans',sans-serif] selection:bg-[#38bdf8] selection:text-slate-950">
      
      {/* ============================================================ */}
      {/* 1. SIGNATURE CELESTIAL HORIZON ARC & NEBULA GLOW */}
      {/* ============================================================ */}
      <div className="absolute inset-x-0 top-0 h-[640px] pointer-events-none overflow-hidden z-0">
        {/* Soft radial backdrop glow */}
        <div 
          className="absolute top-10 left-1/2 -translate-x-1/2 w-[980px] h-[480px] opacity-35 blur-[140px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse at center, #38bdf8 0%, rgba(29, 78, 216, 0.45) 45%, transparent 75%)'
          }}
        />

        {/* The Signature Luminous Horizon Arc */}
        <div className="absolute top-[-90px] left-1/2 -translate-x-1/2 w-[1100px] sm:w-[1260px] h-[520px] pointer-events-none">
          <svg 
            viewBox="0 0 1200 480" 
            fill="none" 
            className="w-full h-full opacity-90 drop-shadow-[0_0_45px_rgba(56,189,248,0.55)]"
          >
            <defs>
              <linearGradient id="horizonGlowFresh" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0" />
                <stop offset="20%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="45%" stopColor="#bfdbfe" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="55%" stopColor="#bfdbfe" stopOpacity="0.95" />
                <stop offset="80%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
              </linearGradient>

              <radialGradient id="haloUnderFresh" cx="50%" cy="30%" r="50%">
                <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.35" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
            </defs>

            <ellipse cx="600" cy="240" rx="520" ry="200" fill="url(#haloUnderFresh)" />
            <path
              d="M 120,440 Q 600,120 1080,440"
              stroke="url(#horizonGlowFresh)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. HERO CONTENT SECTION */}
      {/* ============================================================ */}
      <section className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-16 sm:pt-24 pb-12 text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-800/60 bg-[#071333]/70 backdrop-blur-md mb-6 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
          <Satellite className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
          <span className="text-xs font-mono tracking-widest text-[#93c5fd] uppercase">
            GEOSPATIAL WATER INTELLIGENCE · GODAVARI BASIN
          </span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.08] text-balance">
          See Beyond <br />
          <span className="bg-gradient-to-r from-white via-[#cce0ff] to-[#38bdf8] bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(56,189,248,0.5)]">
            The Surface.
          </span>
        </h1>

        {/* Supporting description */}
        <p className="text-base sm:text-xl text-[#c4d7fc]/80 font-normal leading-relaxed max-w-3xl mx-auto mb-10 text-balance">
          SindhuDrishti turns satellite observations and citizen reporting into transparent, actionable intelligence—monitoring potential aquatic debris, simulating pollutant drift, and prioritizing ecological cleanup.
        </p>

        {/* Hero CTA buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onSelectTab('explore-map')}
            className="px-8 py-3.5 rounded-xl bg-white text-slate-950 font-bold text-sm hover:bg-slate-100 transition-all shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:shadow-[0_0_35px_rgba(56,189,248,0.45)] flex items-center gap-2 cursor-pointer group"
          >
            <span>Launch Geospatial Explorer</span>
            <ArrowRight className="w-4 h-4 text-slate-900 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => onSelectTab('dashboard')}
            className="px-6 py-3.5 rounded-xl bg-[#030919] border border-sky-800/70 text-cyan-200 font-semibold text-sm hover:bg-[#08173d] hover:border-cyan-400 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Cleanup Dashboard</span>
          </button>
        </div>

        {/* Live Metrics Quick Strip */}
        <div className="mt-12 pt-8 border-t border-sky-950/60 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="p-3.5 rounded-xl bg-[#02071a]/70 border border-sky-950/80">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase">Candidate Hotspots</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-white">
              {stats !== null ? stats.candidate_hotspots : '—'}
            </span>
            <span className="text-[10px] font-mono text-cyan-300/80 block mt-0.5">Sentinel-2 Anomalies</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#02071a]/70 border border-sky-950/80">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase">Water Extents</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-white">
              {stats !== null ? stats.water_mask_features : '—'}
            </span>
            <span className="text-[10px] font-mono text-sky-300/80 block mt-0.5">Jayakwadi Reservoir</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#02071a]/70 border border-sky-950/80">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase">Citizen Reports</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-white">
              {stats !== null ? stats.citizen_reports_total : '—'}
            </span>
            <span className="text-[10px] font-mono text-blue-300/80 block mt-0.5">Community Incident Logs</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#02071a]/70 border border-sky-950/80">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase">Study Region</span>
            <span className="text-xs sm:text-sm font-bold font-mono text-emerald-300 truncate block mt-1">
              {studyArea?.study_area_name ? studyArea.study_area_name : 'Jayakwadi / Godavari'}
            </span>
            <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">{studyArea?.crs || 'EPSG:4326'}</span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. FOUR CORE WORKSPACE CARDS (100% BACKEND-ALIGNED) */}
      {/* ============================================================ */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Integrated Waterbody Intelligence Stack
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
            Every module in SindhuDrishti is wired directly to our high-performance Python FastAPI engine and real geospatial datasets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Workspace 1: Geospatial Basin Explorer */}
          <div 
            onClick={() => onSelectTab('explore-map')}
            className="p-6 rounded-2xl bg-[#02071a]/80 border border-sky-950/90 hover:border-cyan-400/60 transition-all duration-300 cursor-pointer group shadow-xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 uppercase tracking-wider font-semibold">
                COPERNICUS SENTINEL-2
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
              Geospatial Basin Explorer
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Inspect candidate anomaly polygons overlaid on actual reservoir water masks. Filter hotspots by surface area in m², spectral FDI class, and shoreline buffer zone.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono font-semibold">
              <span>Open Map View</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Workspace 2: Intelligence Dashboard */}
          <div 
            onClick={() => onSelectTab('dashboard')}
            className="p-6 rounded-2xl bg-[#02071a]/80 border border-sky-950/90 hover:border-cyan-400/60 transition-all duration-300 cursor-pointer group shadow-xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-400/30 flex items-center justify-center text-blue-300 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-950 border border-blue-800 text-blue-300 uppercase tracking-wider font-semibold">
                MULTI-FACTOR RANKING
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
              Cleanup Priorities & Analytics
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Transparent multi-factor prioritization combining surface area, multi-pass persistence, FDI departure, and recovery accessibility to rank actionable cleanup zones.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-mono font-semibold">
              <span>View Ranked Priorities</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Workspace 3: Drift Simulation Lab */}
          <div 
            onClick={() => onSelectTab('drift')}
            className="p-6 rounded-2xl bg-[#02071a]/80 border border-sky-950/90 hover:border-cyan-400/60 transition-all duration-300 cursor-pointer group shadow-xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-300 group-hover:scale-105 transition-transform">
                <Wind className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-sky-950 border border-sky-800 text-sky-300 uppercase tracking-wider font-semibold">
                HYDRODYNAMIC LAGRANGIAN FLOW
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
              Hydrodynamic Drift & Recovery Hub
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Deterministic particle dispersion with along-shore channel deflection towards Paithan Dam. Generates an hour-by-hour field collection schedule for cleanup crews.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-sky-400 font-mono font-semibold">
              <span>Launch Simulation Lab</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Workspace 4: Citizen Reports & Reviewer Desk */}
          <div 
            onClick={() => onSelectTab('reports')}
            className="p-6 rounded-2xl bg-[#02071a]/80 border border-sky-950/90 hover:border-cyan-400/60 transition-all duration-300 cursor-pointer group shadow-xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 uppercase tracking-wider font-semibold">
                COMMUNITY INCIDENT DESK
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
              Citizen Reporting & Reviewer Desk
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Community incident reporting with field evidence photo uploads, geographic validation, and authenticated reviewer triage desk.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-semibold">
              <span>Inspect Reports Queue</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. FOOTER */}
      {/* ============================================================ */}
      <footer className="w-full border-t border-sky-950/70 py-6 px-6 text-xs text-zinc-500 flex flex-wrap items-center justify-between gap-3 bg-[#010309] font-mono mt-auto">
        <div className="flex items-center gap-2">
          <span className="text-zinc-300 font-bold">SindhuDrishti AI Water OS</span>
          <span>·</span>
          <span>Godavari Basin Study Area</span>
          <span>·</span>
          <span className="text-cyan-400">FastAPI & SQLite Backed</span>
        </div>
        <div className="text-[11px] text-zinc-500">
          Candidate anomalies are unverified spectral hotspots · Ground-truth verification required
        </div>
      </footer>
    </div>
  );
};
