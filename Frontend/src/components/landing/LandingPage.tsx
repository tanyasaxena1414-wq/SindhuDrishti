import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ArrowRight, 
  Satellite, 
  Layers, 
  Waves, 
  ShieldCheck, 
  Crosshair, 
  ChevronDown,
  Maximize2,
  Minus,
  CheckCircle2,
  Clock,
  XCircle,
  FileText
} from 'lucide-react';
import { api } from '../../services/api';
import { DashboardStats, NavigationTab, StudyAreaMetadata, BasinId } from '../../types';
import { useTheme } from '../../context/ThemeContext';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onSelectTab: (tab: NavigationTab) => void;
  onSelectBasin?: (basin: BasinId) => void;
  onOpenReportModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectTab,
  onSelectBasin,
  onOpenReportModal,
}) => {
  const { isDark } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [studyArea, setStudyArea] = useState<StudyAreaMetadata | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const challengeRef = useRef<HTMLDivElement>(null);
  const workflowRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const studyAreasRef = useRef<HTMLDivElement>(null);
  const samplesRef = useRef<HTMLElement>(null);

  useEffect(() => {
    api.getDashboardStats().then(setStats).catch(() => null);
    api.getStudyArea('jayakwadi').then(setStudyArea).catch(() => null);
  }, []);

  // GSAP Animations with ScrollTrigger & Clean Revert
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // 1. Hero Entrance Timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo('.hero-eyebrow', 
        { opacity: 0, y: 15 }, 
        { opacity: 1, y: 0, duration: 0.5, clearProps: 'all' }
      )
      .fromTo('.hero-headline-line', 
        { opacity: 0, y: 25 }, 
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, clearProps: 'all' }, 
        '-=0.3'
      )
      .fromTo('.hero-description', 
        { opacity: 0, y: 15 }, 
        { opacity: 1, y: 0, duration: 0.5, clearProps: 'all' }, 
        '-=0.3'
      )
      .fromTo('.hero-cta-btn', 
        { opacity: 0, y: 15 }, 
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, clearProps: 'all' }, 
        '-=0.3'
      )
      .fromTo('.hero-hud-element', 
        { opacity: 0, scale: 0.95 }, 
        { opacity: 1, scale: 1, duration: 0.6, clearProps: 'all' }, 
        '-=0.2'
      )
      .fromTo('.hero-scroll-pill', 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.4, clearProps: 'all' }, 
        '-=0.2'
      );

      // 2. Geospatial Reticle Floating Hover Motion
      if (reticleRef.current) {
        gsap.to(reticleRef.current, {
          y: -8,
          duration: 3,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }

      // 3. Challenge Split-Card Reveal
      if (challengeRef.current) {
        gsap.fromTo('.challenge-reveal', 
          { opacity: 0, y: 25 },
          {
            scrollTrigger: {
              trigger: challengeRef.current,
              start: 'top 90%',
              once: true,
            },
            opacity: 1,
            y: 0,
            stagger: 0.12,
            duration: 0.6,
            clearProps: 'all',
            ease: 'power2.out',
          }
        );
      }

      // 4. Workflow Nodes Staggered Sequence
      if (workflowRef.current) {
        gsap.fromTo('.workflow-node', 
          { opacity: 0, y: 20 },
          {
            scrollTrigger: {
              trigger: workflowRef.current,
              start: 'top 90%',
              once: true,
            },
            opacity: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.6,
            clearProps: 'all',
            ease: 'power2.out',
          }
        );
      }

      // 5. Explore Map Platform Window Reveal
      if (previewRef.current) {
        gsap.fromTo('.preview-window', 
          { opacity: 0, scale: 0.98, y: 20 },
          {
            scrollTrigger: {
              trigger: previewRef.current,
              start: 'top 90%',
              once: true,
            },
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.7,
            clearProps: 'all',
            ease: 'power2.out',
          }
        );
      }

      // 6. Study Area Cards Reveal
      if (studyAreasRef.current) {
        gsap.fromTo('.study-region-card', 
          { opacity: 0, y: 20 },
          {
            scrollTrigger: {
              trigger: studyAreasRef.current,
              start: 'top 90%',
              once: true,
            },
            opacity: 1,
            y: 0,
            stagger: 0.15,
            duration: 0.6,
            clearProps: 'all',
            ease: 'power2.out',
          }
        );
      }

      // 7. Telemetry & Samples Cards Reveal
      if (samplesRef.current) {
        gsap.fromTo('.sample-card', 
          { opacity: 0, y: 20 },
          {
            scrollTrigger: {
              trigger: samplesRef.current,
              start: 'top 90%',
              once: true,
            },
            opacity: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.6,
            clearProps: 'all',
            ease: 'power2.out',
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleStudyAreaClick = (basin: BasinId) => {
    if (onSelectBasin) {
      onSelectBasin(basin);
    }
    onSelectTab('explore-map');
  };

  const scrollToWorkflow = () => {
    const el = document.getElementById('platform-workflow');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#020817] text-[#f8fafc]' : 'bg-transparent text-[#071d3d]'
      }`}
    >
      
      {/* ========================================================================= */}
      {/* 1. CINEMATIC HERO SECTION (1:1 MOODBOARD COMPOSITION)                     */}
      {/* ========================================================================= */}
      <section 
        ref={heroRef}
        className="relative z-10 w-full max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 sm:pb-20"
      >
        {/* Large Cinematic Framed Container Matching Moodboard */}
        <div 
          className={`relative rounded-3xl overflow-hidden border min-h-[580px] lg:min-h-[660px] flex flex-col justify-between p-6 sm:p-10 lg:p-16 transition-all duration-300 ${
            isDark 
              ? 'border-white/10 bg-[#020817] shadow-xl' 
              : 'border-[#c4d7e8] bg-gradient-to-br from-[#f8fbfe] via-[#f0f6fb] to-[#e6f0f8] shadow-[0_20px_50px_rgba(9,30,58,0.08),0_1px_3px_rgba(9,30,58,0.04)] ring-1 ring-white/80 inset'
          }`}
        >
          {/* Background Imagery & Ambient Gradients — Unified High-Res Photograph */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <img
              src="/assets/landing/hero_reservoir.jpg"
              alt="Inland Reservoir Aerial Landscape"
              className="absolute inset-0 w-full h-full object-cover object-right-top lg:object-center"
            />
            {/* Directional Vignette Gradient Mask: dark navy on dark, sunlit editorial tint on light */}
            <div 
              className={`absolute inset-0 transition-colors duration-300 ${
                isDark 
                  ? 'bg-gradient-to-r from-[#020817] from-10% via-[#020817]/85 via-40% to-transparent to-70%' 
                  : 'bg-gradient-to-r from-[#f4f8fc]/95 from-20% via-[#f4f8fc]/80 via-45% to-transparent to-80%'
              }`} 
            />
            <div 
              className={`absolute inset-0 transition-colors duration-300 ${
                isDark 
                  ? 'bg-gradient-to-t from-[#020817]/85 via-transparent to-black/20' 
                  : 'bg-gradient-to-t from-[#f4f8fc]/70 via-transparent to-transparent'
              }`} 
            />

            {/* Subtle Topographical Contours for Light Theme Editorial Polish */}
            {!isDark && (
              <svg 
                viewBox="0 0 1200 600" 
                className="absolute inset-0 w-full h-full opacity-45 pointer-events-none" 
                preserveAspectRatio="none"
              >
                <path d="M 50 180 C 250 120, 420 320, 680 200 C 880 110, 1050 250, 1200 170" stroke="#0284c7" strokeWidth="1.5" fill="none" opacity="0.6" />
                <path d="M 50 220 C 260 160, 440 360, 700 240 C 900 150, 1070 290, 1200 210" stroke="#0284c7" strokeWidth="1.2" fill="none" opacity="0.4" />
                <path d="M 50 260 C 270 200, 460 400, 720 280 C 920 190, 1090 330, 1200 250" stroke="#0369a1" strokeWidth="1.0" fill="none" opacity="0.25" />
              </svg>
            )}
          </div>

          {/* Floating Geospatial Reticle HUD (Adaptive Styling, Honest Labeling) */}
          <div 
            ref={reticleRef}
            className="hidden md:flex absolute top-[24%] right-[20%] lg:right-[26%] z-20 flex-col items-start pointer-events-none hero-hud-element"
          >
            {/* The HUD Card Box */}
            <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg border backdrop-blur-md shadow-lg pointer-events-auto cursor-pointer transition-all ${
              isDark
                ? 'bg-[#071a2e]/90 border-[#18c9e8]/50 shadow-[0_0_25px_rgba(24,201,232,0.3)] hover:border-[#18c9e8]'
                : 'bg-white/95 border-[#0284c7]/50 shadow-[0_8px_30px_rgba(2,132,199,0.18)] hover:border-[#0284c7]'
            }`}>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                isDark ? 'border-[#18c9e8]' : 'border-[#0284c7]'
              }`}>
                <Crosshair className={`w-3.5 h-3.5 ${isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]'}`} />
              </div>
              <div className="text-left font-display leading-tight">
                <div className={`text-xs font-semibold tracking-wide ${isDark ? 'text-white' : 'text-[#071d3d]'}`}>
                  Inland Basin Sector
                </div>
                <div className={`text-[10px] font-mono font-bold ${isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]'}`}>
                  Telemetry ROI · 19.49° N, 75.39° E
                </div>
              </div>
            </div>

            {/* Angled Vector Leader Line down-left to water target */}
            <svg width="150" height="120" viewBox="0 0 150 120" className="pointer-events-none mt-1 -ml-10">
              <polyline 
                points="70,0 70,50 25,95" 
                fill="none" 
                stroke={isDark ? '#18c9e8' : '#0284c7'} 
                strokeWidth="1.5" 
                opacity="0.9" 
              />
              {/* Concentric Pulsing Target Rings on water */}
              <circle cx="25" cy="95" r="16" fill="none" stroke={isDark ? '#18c9e8' : '#0284c7'} strokeWidth="1" opacity="0.3" className="animate-ping origin-center" />
              <circle cx="25" cy="95" r="9" fill="none" stroke={isDark ? '#18c9e8' : '#0284c7'} strokeWidth="1.2" opacity="0.8" />
              <circle cx="25" cy="95" r="3.5" fill={isDark ? '#18c9e8' : '#0284c7'} />
            </svg>
          </div>

          {/* Editorial Headline, Eyebrow & Actions (Overlay on Left) */}
          <div className="relative z-10 max-w-xl text-left flex flex-col items-start">
            
            {/* Eyebrow: ✦ GEOSPATIAL WATER INTELLIGENCE */}
            <div className="hero-eyebrow inline-flex items-center gap-2 mb-4">
              <span className={`text-xs font-mono uppercase tracking-widest font-bold px-3 py-1 rounded-full ${
                isDark 
                  ? 'text-[#18c9e8] bg-[#071a2e]/80 border border-[#18c9e8]/30' 
                  : 'text-[#0284c7] bg-[#e0f0fa] border border-[#bae6fd] shadow-xs'
              }`}>
                ✦ GEOSPATIAL WATER INTELLIGENCE
              </span>
            </div>

            {/* Main Headline: See Beyond The Surface. */}
            <h1 className="font-display font-bold text-5xl sm:text-6xl md:text-7xl lg:text-[76px] tracking-tight leading-[1.05] mb-5">
              <span className={`hero-headline-line block ${isDark ? 'text-white' : 'text-[#071d3d]'}`}>
                See Beyond
              </span>
              <span className={`hero-headline-line block ${isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]'}`}>
                The Surface.
              </span>
            </h1>

            {/* Subheadline description */}
            <p className={`hero-description text-base sm:text-lg leading-relaxed mb-8 max-w-lg font-medium ${
              isDark ? 'text-[#A0AEC0]' : 'text-[#243e63]'
            }`}>
              Satellite intelligence for detecting, tracking and acting on waterbody pollution.
            </p>

            {/* CTA Buttons: Explore the Map → & How It Works ↓ */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Primary Pill Button: Explore the Map → */}
              <button
                onClick={() => onSelectTab('explore-map')}
                className={`hero-cta-btn px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer font-display ${
                  isDark 
                    ? 'bg-white hover:bg-slate-100 text-[#020817]' 
                    : 'bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-[0_4px_16px_rgba(2,132,199,0.35)] hover:shadow-[0_6px_22px_rgba(2,132,199,0.45)]'
                }`}
              >
                <span>Explore the Map</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Secondary Pill Button: How It Works ↓ */}
              <button
                onClick={scrollToWorkflow}
                className={`hero-cta-btn px-6 py-3 rounded-full border text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm ${
                  isDark
                    ? 'bg-[#071a2e]/60 border-white/20 text-white hover:bg-white/10'
                    : 'bg-white/95 border-[#c4d7e8] text-[#071d3d] hover:bg-white hover:border-[#94a3b8] shadow-xs'
                }`}
              >
                <span>How It Works</span>
                <ChevronDown className="w-4 h-4 opacity-75" />
              </button>
            </div>

          </div>

          {/* Bottom-Left: Mouse Scroll Pill Indicator */}
          <div className="hero-scroll-pill relative z-10 hidden sm:flex items-center gap-2.5 text-xs font-mono mt-8">
            <div className={`w-4 h-7 rounded-full border flex items-start justify-center p-1 ${
              isDark ? 'border-white/30' : 'border-[#94a3b8]'
            }`}>
              <div className={`w-1 h-2 rounded-full animate-bounce ${isDark ? 'bg-[#18c9e8]' : 'bg-[#0284c7]'}`} />
            </div>
            <span className={isDark ? 'text-zinc-400' : 'text-[#536b88]'}>Scroll to explore</span>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ROW 2: THE CHALLENGE & THE PLATFORM WORKFLOW                            */}
      {/* ========================================================================= */}
      <section className="relative z-10 w-full max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* A. The Challenge Card (Middle Left) */}
          <div 
            id="the-challenge"
            ref={challengeRef}
            className={`challenge-reveal lg:col-span-6 rounded-2xl border overflow-hidden p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
              isDark 
                ? 'bg-[#071a2e]/85 border-[#0e2a47] shadow-xl' 
                : 'bg-gradient-to-br from-white via-[#fbfdff] to-[#f0f6fc] border-[#cddce9] shadow-[0_6px_24px_rgba(9,30,58,0.06),0_1px_2px_rgba(9,30,58,0.03)]'
            }`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              {/* Text Left */}
              <div className="sm:col-span-7 flex flex-col text-left">
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className={`text-[11px] font-mono uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full ${
                    isDark 
                      ? 'text-[#18c9e8] bg-[#051324] border border-[#18c9e8]/30' 
                      : 'text-amber-800 bg-amber-50 border border-amber-200 shadow-xs'
                  }`}>
                    ✦ THE CHALLENGE
                  </span>
                </div>

                <h2 className={`font-display text-2xl sm:text-3xl font-bold tracking-tight mb-4 leading-tight ${isDark ? 'text-white' : 'text-[#071d3d]'}`}>
                  Water pollution is dynamic, widespread and hard to monitor.
                </h2>

                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-[#334e68]'}`}>
                  Large reservoirs and urban lakes face increasing debris accumulation, often spreading beyond visible areas.
                </p>
              </div>

              {/* Real Macro Plastic Bottle Photograph Right */}
              <div className={`sm:col-span-5 relative aspect-[4/3] rounded-xl overflow-hidden border shadow-md ${
                isDark ? 'border-white/10' : 'border-[#cbd5e1] ring-1 ring-black/5'
              }`}>
                <img
                  src="/assets/landing/challenge_bottle.jpg"
                  alt="Authentic plastic bottle water pollution floating with water ripples"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </div>

          {/* B. The Platform Workflow Card (Middle Right) */}
          <div 
            id="platform-workflow"
            ref={workflowRef}
            className={`workflow-reveal lg:col-span-6 rounded-2xl border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
              isDark 
                ? 'bg-[#071a2e]/85 border-[#0e2a47] shadow-xl' 
                : 'bg-gradient-to-br from-white via-[#fbfdff] to-[#f0f6fc] border-[#cddce9] shadow-[0_6px_24px_rgba(9,30,58,0.06),0_1px_2px_rgba(9,30,58,0.03)]'
            }`}
          >
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className={`text-[11px] font-mono uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full ${
                  isDark 
                    ? 'text-[#18c9e8] bg-[#051324] border border-[#18c9e8]/30' 
                    : 'text-[#0284c7] bg-sky-50 border border-sky-200 shadow-xs'
                }`}>
                  ✦ THE PLATFORM
                </span>
              </div>

              <h2 className={`font-display text-2xl sm:text-3xl font-bold tracking-tight mb-8 ${isDark ? 'text-white' : 'text-[#071d3d]'}`}>
                From Observation to Action.
              </h2>

              {/* 4 Connected Circular Icon Nodes with Arrows */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-start relative">
                
                {/* Node 1: Observe */}
                <div className="workflow-node flex flex-col items-center text-center">
                  <div className="relative mb-3 flex items-center justify-center">
                    <div className={`w-13 h-13 rounded-2xl border flex items-center justify-center transition-all ${
                      isDark
                        ? 'border-[#18c9e8]/50 bg-[#051324] text-[#18c9e8] shadow-[0_0_15px_rgba(24,201,232,0.25)]'
                        : 'border-[#0284c7]/30 bg-gradient-to-b from-[#e0f2fe] to-[#bae6fd]/40 text-[#0284c7] shadow-[0_4px_12px_rgba(2,132,199,0.15)]'
                    }`}>
                      <Satellite className="w-6 h-6" />
                    </div>
                    {/* Connecting Arrow (hidden on mobile) */}
                    <div className={`hidden sm:block absolute left-[100%] top-1/2 -translate-y-1/2 w-6 font-mono text-xs ${isDark ? 'text-zinc-500' : 'text-[#0284c7] font-bold'}`}>
                      →
                    </div>
                  </div>
                  <h3 className={`font-display font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-[#071d3d]'}`}>Observe</h3>
                  <p className={`text-[11px] leading-tight ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>
                    Satellite data & candidate anomalies
                  </p>
                </div>

                {/* Node 2: Analyse */}
                <div className="workflow-node flex flex-col items-center text-center">
                  <div className="relative mb-3 flex items-center justify-center">
                    <div className={`w-13 h-13 rounded-2xl border flex items-center justify-center transition-all ${
                      isDark
                        ? 'border-[#18c9e8]/50 bg-[#051324] text-[#18c9e8] shadow-[0_0_15px_rgba(24,201,232,0.25)]'
                        : 'border-[#0284c7]/30 bg-gradient-to-b from-[#e0f2fe] to-[#bae6fd]/40 text-[#0284c7] shadow-[0_4px_12px_rgba(2,132,199,0.15)]'
                    }`}>
                      <Layers className="w-6 h-6" />
                    </div>
                    <div className={`hidden sm:block absolute left-[100%] top-1/2 -translate-y-1/2 w-6 font-mono text-xs ${isDark ? 'text-zinc-500' : 'text-[#0284c7] font-bold'}`}>
                      →
                    </div>
                  </div>
                  <h3 className={`font-display font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-[#071d3d]'}`}>Analyse</h3>
                  <p className={`text-[11px] leading-tight ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>
                    Multispectral indicators & prioritization
                  </p>
                </div>

                {/* Node 3: Simulate */}
                <div className="workflow-node flex flex-col items-center text-center">
                  <div className="relative mb-3 flex items-center justify-center">
                    <div className={`w-13 h-13 rounded-2xl border flex items-center justify-center transition-all ${
                      isDark
                        ? 'border-[#18c9e8]/50 bg-[#051324] text-[#18c9e8] shadow-[0_0_15px_rgba(24,201,232,0.25)]'
                        : 'border-[#0284c7]/30 bg-gradient-to-b from-[#e0f2fe] to-[#bae6fd]/40 text-[#0284c7] shadow-[0_4px_12px_rgba(2,132,199,0.15)]'
                    }`}>
                      <Waves className="w-6 h-6" />
                    </div>
                    <div className={`hidden sm:block absolute left-[100%] top-1/2 -translate-y-1/2 w-6 font-mono text-xs ${isDark ? 'text-zinc-500' : 'text-[#0284c7] font-bold'}`}>
                      →
                    </div>
                  </div>
                  <h3 className={`font-display font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-[#071d3d]'}`}>Simulate</h3>
                  <p className={`text-[11px] leading-tight ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>
                    Debris drift & possible spread
                  </p>
                </div>

                {/* Node 4: Verify */}
                <div className="workflow-node flex flex-col items-center text-center">
                  <div className="relative mb-3 flex items-center justify-center">
                    <div className={`w-13 h-13 rounded-2xl border flex items-center justify-center transition-all ${
                      isDark
                        ? 'border-[#18c9e8]/50 bg-[#051324] text-[#18c9e8] shadow-[0_0_15px_rgba(24,201,232,0.25)]'
                        : 'border-[#0284c7]/30 bg-gradient-to-b from-[#e0f2fe] to-[#bae6fd]/40 text-[#0284c7] shadow-[0_4px_12px_rgba(2,132,199,0.15)]'
                    }`}>
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className={`font-display font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-[#071d3d]'}`}>Verify</h3>
                  <p className={`text-[11px] leading-tight ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>
                    Citizen reports & reviewer validation
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. ROW 3: PLATFORM PREVIEW & STUDY AREAS                                   */}
      {/* ========================================================================= */}
      <section className="relative z-10 w-full max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* A. Explore Map Platform Window Frame (Row 3 Left) */}
          <div 
            ref={previewRef}
            className={`preview-window lg:col-span-6 rounded-2xl border overflow-hidden flex flex-col justify-between shadow-xl transition-all duration-300 ${
              isDark 
                ? 'bg-[#040e1d] border-[#0e2a47]' 
                : 'bg-white border-[#cddce9] shadow-[0_8px_30px_rgba(9,30,58,0.07)]'
            }`}
          >
            {/* Window Header: ≈ SindhuDrishti | [Explore Map] [Dashboard] [Drift Lab] [Reports] | [⛶] [-] */}
            <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-mono select-none ${
              isDark ? 'bg-[#030b17] border-[#0e2a47]' : 'bg-[#eaf1f8] border-[#cddce9]'
            }`}>
              {/* Brand Logo */}
              <div className={`flex items-center gap-1.5 font-bold font-display ${isDark ? 'text-white' : 'text-[#071d3d]'}`}>
                <Waves className={`w-4 h-4 ${isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]'}`} />
                <span>SindhuDrishti</span>
              </div>

              {/* Navigation Tab Pills in Window Header */}
              <div className="flex items-center gap-1 text-[11px]">
                <button 
                  onClick={() => onSelectTab('explore-map')}
                  className={`px-2.5 py-1 rounded-full font-semibold cursor-pointer ${
                    isDark
                      ? 'bg-[#073b55] text-[#18c9e8] border border-[#18c9e8]/50'
                      : 'bg-[#0284c7] text-white shadow-xs'
                  }`}
                >
                  Explore Map
                </button>
                <button 
                  onClick={() => onSelectTab('dashboard')}
                  className={`px-2 py-1 rounded-full cursor-pointer transition-colors ${
                    isDark ? 'text-zinc-400 hover:text-white' : 'text-[#486581] hover:text-[#071d3d]'
                  }`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => onSelectTab('drift')}
                  className={`px-2 py-1 rounded-full cursor-pointer transition-colors ${
                    isDark ? 'text-zinc-400 hover:text-white' : 'text-[#486581] hover:text-[#071d3d]'
                  }`}
                >
                  Drift Lab
                </button>
                <button 
                  onClick={() => onSelectTab('reports')}
                  className={`px-2 py-1 rounded-full cursor-pointer transition-colors ${
                    isDark ? 'text-zinc-400 hover:text-white' : 'text-[#486581] hover:text-[#071d3d]'
                  }`}
                >
                  Reports
                </button>
              </div>

              {/* Window Controls */}
              <div className={`hidden sm:flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isDark ? 'border-white/20' : 'border-[#cbd5e1]'}`}>
                  <Maximize2 className="w-2.5 h-2.5" />
                </div>
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isDark ? 'border-white/20' : 'border-[#cbd5e1]'}`}>
                  <Minus className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>

            {/* Satellite Map with Glowing Cyan Reservoir Shoreline Contour */}
            <div 
              onClick={() => onSelectTab('explore-map')}
              className="relative aspect-[16/9] w-full overflow-hidden cursor-pointer group"
            >
              <img
                src="/assets/landing/map_preview_satellite.jpg"
                alt="SindhuDrishti Explore Map: Jayakwadi Reservoir with Cyan Contour"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
              />

              {/* Pulsing Hotspot Marker Pin #1 */}
              <div className="absolute top-[32%] left-[42%] flex items-center justify-center">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#18c9e8] opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-[#18c9e8] border border-black shadow" />
                </span>
              </div>

              {/* Hotspot Marker Pin #2 */}
              <div className="absolute top-[48%] left-[64%] flex items-center justify-center">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#18c9e8] border border-black" />
              </div>

              {/* Hotspot Marker Pin #3 */}
              <div className="absolute top-[28%] left-[24%] flex items-center justify-center">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border border-black" />
              </div>

              {/* Interactive Hover Pill */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                <div className="px-5 py-2.5 rounded-full bg-white text-[#020817] font-bold text-xs flex items-center gap-1.5 shadow-xl font-display">
                  <span>Enter Interactive Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* B. Study Areas ("Our Focus Regions") (Row 3 Right) */}
          <div 
            id="focus-regions"
            ref={studyAreasRef}
            className={`study-areas-container lg:col-span-6 rounded-2xl border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl ${
              isDark 
                ? 'bg-[#071a2e]/85 border-[#0e2a47]' 
                : 'bg-gradient-to-br from-white via-[#fbfdff] to-[#f0f6fc] border-[#cddce9] shadow-[0_6px_24px_rgba(9,30,58,0.06),0_1px_2px_rgba(9,30,58,0.03)]'
            }`}
          >
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className={`text-[11px] font-mono uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full ${
                  isDark 
                    ? 'text-[#18c9e8] bg-[#051324] border border-[#18c9e8]/30' 
                    : 'text-[#0284c7] bg-sky-50 border border-sky-200 shadow-xs'
                }`}>
                  ✦ STUDY AREAS
                </span>
              </div>

              <h2 className={`font-display text-2xl sm:text-3xl font-bold tracking-tight mb-6 ${isDark ? 'text-white' : 'text-[#071d3d]'}`}>
                Our Focus Regions
              </h2>

              {/* Two Side-by-Side Cinema-Aspect Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Region Card 1: Godavari Basin (Jayakwadi) */}
                <div 
                  onClick={() => handleStudyAreaClick('jayakwadi')}
                  className={`study-region-card relative aspect-[16/10] rounded-xl overflow-hidden border group cursor-pointer shadow-lg transition-all ${
                    isDark ? 'border-white/10 hover:border-[#18c9e8]' : 'border-[#cddce9] hover:border-[#0284c7] hover:shadow-xl'
                  }`}
                >
                  <img
                    src="/assets/landing/study_jayakwadi.jpg"
                    alt="Godavari River Basin Inland Reservoir Study Area"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Subtle dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  {/* Card Label Bottom Left */}
                  <div className="absolute bottom-3 left-3 text-left">
                    <div className="font-display font-bold text-sm text-white">Godavari Basin</div>
                    <div className="text-[11px] text-zinc-300">Jayakwadi Reservoir</div>
                  </div>

                  {/* Round Arrow Button Bottom Right [ → ] */}
                  <div className={`absolute bottom-3 right-3 w-8 h-8 rounded-full border backdrop-blur-sm flex items-center justify-center transition-all ${
                    isDark
                      ? 'border-[#18c9e8]/50 bg-[#071a2e]/80 text-[#18c9e8] group-hover:bg-[#18c9e8] group-hover:text-[#020817]'
                      : 'border-[#0284c7]/40 bg-white/95 text-[#0284c7] group-hover:bg-[#0284c7] group-hover:text-white shadow-sm'
                  }`}>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Region Card 2: Hussain Sagar (Hyderabad) */}
                <div 
                  onClick={() => handleStudyAreaClick('hussainsagar')}
                  className={`study-region-card relative aspect-[16/10] rounded-xl overflow-hidden border group cursor-pointer shadow-lg transition-all ${
                    isDark ? 'border-white/10 hover:border-[#18c9e8]' : 'border-[#cddce9] hover:border-[#0284c7] hover:shadow-xl'
                  }`}
                >
                  <img
                    src="/assets/landing/study_hussainsagar.jpg"
                    alt="Hussain Sagar Lake Hyderabad Buddha Statue Island"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  {/* Card Label Bottom Left */}
                  <div className="absolute bottom-3 left-3 text-left">
                    <div className="font-display font-bold text-sm text-white">Hussain Sagar</div>
                    <div className="text-[11px] text-zinc-300">Hyderabad (Urban Basin)</div>
                  </div>

                  {/* Round Arrow Button Bottom Right [ → ] */}
                  <div className={`absolute bottom-3 right-3 w-8 h-8 rounded-full border backdrop-blur-sm flex items-center justify-center transition-all ${
                    isDark
                      ? 'border-[#18c9e8]/50 bg-[#071a2e]/80 text-[#18c9e8] group-hover:bg-[#18c9e8] group-hover:text-[#020817]'
                      : 'border-[#0284c7]/40 bg-white/95 text-[#0284c7] group-hover:bg-[#0284c7] group-hover:text-white shadow-sm'
                  }`}>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. ROW 4: TELEMETRY SAMPLES (DRIFT LAB & REPORTS SAMPLE)                  */}
      {/* ========================================================================= */}
      <section 
        ref={samplesRef}
        className="relative z-10 w-full max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Drift Lab Sample Card */}
          <div 
            onClick={() => onSelectTab('drift')}
            className={`sample-card lg:col-span-6 rounded-2xl border p-5 flex flex-col justify-between cursor-pointer group transition-all duration-300 shadow-xl ${
              isDark 
                ? 'bg-[#071a2e]/80 border-[#0e2a47] hover:border-[#18c9e8]/50' 
                : 'bg-white border-[#cddce9] hover:border-[#0284c7]/50 shadow-[0_6px_24px_rgba(9,30,58,0.06),0_1px_2px_rgba(9,30,58,0.03)]'
            }`}
          >
            <div className="relative aspect-[21/9] rounded-xl overflow-hidden mb-3 border border-white/10 bg-[#030c18]">
              {/* Dynamic Hydrodynamic Vector Streamlines Matching Moodboard */}
              <svg viewBox="0 0 420 180" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="streamGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#073b55" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#18c9e8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#073b55" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="streamGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2" />
                    <stop offset="60%" stopColor="#18c9e8" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#18c9e8" stopOpacity="0.3" />
                  </linearGradient>
                </defs>

                {/* Curved streamlines */}
                <path d="M 0 30 Q 120 10 240 60 T 420 40" fill="none" stroke="url(#streamGrad1)" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.6" />
                <path d="M 0 60 Q 140 30 260 90 T 420 70" fill="none" stroke="url(#streamGrad2)" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.85" />
                <path d="M 0 90 Q 150 70 280 120 T 420 100" fill="none" stroke="url(#streamGrad1)" strokeWidth="1.4" opacity="0.7" />
                <path d="M 0 120 Q 130 110 270 145 T 420 130" fill="none" stroke="url(#streamGrad2)" strokeWidth="1.8" strokeDasharray="5 3" opacity="0.9" />
                <path d="M 0 150 Q 140 140 290 165 T 420 155" fill="none" stroke="url(#streamGrad1)" strokeWidth="1.2" opacity="0.5" />

                {/* Hydrodynamic Drift Nodes with glowing cyan target indicators */}
                <g transform="translate(90, 45)">
                  <circle r="7" fill="none" stroke="#18c9e8" strokeWidth="1" opacity="0.4" className="animate-ping origin-center" />
                  <circle r="4.5" fill="#18c9e8" />
                  <circle r="2" fill="#020817" />
                </g>
                <g transform="translate(170, 75)">
                  <circle r="8" fill="none" stroke="#18c9e8" strokeWidth="1" opacity="0.5" className="animate-ping origin-center" />
                  <circle r="5" fill="#18c9e8" />
                  <circle r="2" fill="#020817" />
                </g>
                <g transform="translate(250, 110)">
                  <circle r="8.5" fill="none" stroke="#18c9e8" strokeWidth="1" opacity="0.4" className="animate-ping origin-center" />
                  <circle r="5.5" fill="#18c9e8" />
                  <circle r="2" fill="#020817" />
                </g>
                <g transform="translate(340, 95)">
                  <circle r="7" fill="none" stroke="#18c9e8" strokeWidth="1" opacity="0.5" className="animate-ping origin-center" />
                  <circle r="4.5" fill="#18c9e8" />
                  <circle r="2" fill="#020817" />
                </g>
                <g transform="translate(385, 125)">
                  <circle r="6" fill="#18c9e8" opacity="0.8" />
                </g>
              </svg>

              <div className="absolute top-2.5 right-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono text-[#18c9e8] border border-[#18c9e8]/30">
                Lagrangian Simulation
              </div>
            </div>
            <div className="flex items-center justify-between text-left">
              <div>
                <h4 className={`font-display font-bold text-sm ${isDark ? 'text-white' : 'text-[#071d3d]'}`}>Drift Lab (sample)</h4>
                <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>Hydrodynamic particle trajectories & Paithan Dam drift modeling</p>
              </div>
              <div className={`w-7 h-7 rounded-full border flex items-center justify-center group-hover:translate-x-1 transition-transform ${
                isDark ? 'border-[#18c9e8]/40 text-[#18c9e8]' : 'border-[#0284c7]/40 text-[#0284c7]'
              }`}>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Reports Sample Card with Moodboard Status Pills */}
          <div 
            onClick={() => onSelectTab('reports')}
            className={`sample-card lg:col-span-6 rounded-2xl border p-5 flex flex-col justify-between cursor-pointer group transition-all duration-300 shadow-xl ${
              isDark 
                ? 'bg-[#071a2e]/80 border-[#0e2a47] hover:border-[#18c9e8]/50' 
                : 'bg-white border-[#cddce9] hover:border-[#0284c7]/50 shadow-[0_6px_24px_rgba(9,30,58,0.06),0_1px_2px_rgba(9,30,58,0.03)]'
            }`}
          >
            <div className="space-y-2 mb-3">
              {/* Verified Pill */}
              <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
                isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-[#f4f8fc] border-[#d2e1ee]'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    isDark 
                      ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/40' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Verified</span>
                  </span>
                </div>
                <span className={`font-mono text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>#rep-0281</span>
              </div>

              {/* Pending Pill */}
              <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
                isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-[#f4f8fc] border-[#d2e1ee]'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    isDark 
                      ? 'bg-amber-950/70 text-amber-400 border border-amber-500/40' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200 shadow-xs'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Pending</span>
                  </span>
                </div>
                <span className={`font-mono text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>#rep-0282</span>
              </div>

              {/* Rejected Pill */}
              <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
                isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-[#f4f8fc] border-[#d2e1ee]'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    isDark 
                      ? 'bg-rose-950/70 text-rose-400 border border-rose-500/40' 
                      : 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>Rejected</span>
                  </span>
                </div>
                <span className={`font-mono text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>#rep-0283</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-left">
              <div>
                <h4 className={`font-display font-bold text-sm ${isDark ? 'text-white' : 'text-[#071d3d]'}`}>Reports (sample)</h4>
                <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>Citizen incident triage & authenticated validation queue</p>
              </div>
              <div className={`w-7 h-7 rounded-full border flex items-center justify-center group-hover:translate-x-1 transition-transform ${
                isDark ? 'border-[#18c9e8]/40 text-[#18c9e8]' : 'border-[#0284c7]/40 text-[#0284c7]'
              }`}>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CLOSING SECTION & MINIMAL EDITORIAL FOOTER                             */}
      {/* ========================================================================= */}
      <section 
        className={`relative z-10 w-full py-16 sm:py-24 border-t transition-colors duration-200 ${
          isDark ? 'bg-[#030919] border-[#0e2a47]' : 'bg-gradient-to-b from-[#eaf2f9] via-[#edf5fc] to-[#e4eef7] border-[#cddce9]'
        }`}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-6 shadow-md transition-all ${
            isDark 
              ? 'bg-gradient-to-br from-[#18c9e8]/20 to-[#0284c7]/20 border border-[#18c9e8]/40 text-[#18c9e8]' 
              : 'bg-[#e0f2fe] border border-[#0284c7]/30 text-[#0284c7] shadow-sm'
          }`}>
            <Waves className="w-6 h-6" />
          </div>

          <h2 className={`font-display text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-balance ${isDark ? 'text-white' : 'text-[#071d3d]'}`}>
            See beyond the surface. <br />
            Protect what sustains us.
          </h2>

          <p className={`text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-8 ${isDark ? 'text-zinc-400' : 'text-[#334e68]'}`}>
            SindhuDrishti turns orbital observations into actionable environmental intelligence for waterbody stewards, municipal authorities, and conservation teams.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onSelectTab('explore-map')}
              className={`px-8 py-3.5 rounded-full font-bold text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer font-display ${
                isDark
                  ? 'bg-[#18c9e8] hover:bg-[#38d4f0] text-[#020817] shadow-[0_0_25px_rgba(24,201,232,0.35)]'
                  : 'bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-[0_4px_16px_rgba(2,132,199,0.3)]'
              }`}
            >
              <span>Explore Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenReportModal}
              className={`px-7 py-3.5 rounded-full border text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                isDark 
                  ? 'bg-[#071a2e] border-white/20 text-white hover:bg-white/10' 
                  : 'bg-white border-[#cddce9] text-[#071d3d] hover:bg-[#f6f9fc] shadow-xs'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Log Community Incident</span>
            </button>
          </div>
        </div>

        {/* Minimal Editorial Footer */}
        <footer className={`mt-16 pt-8 border-t max-w-[1540px] mx-auto px-4 sm:px-6 lg:px-8 text-xs font-mono flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDark ? 'border-zinc-700/20 text-zinc-400' : 'border-[#cddce9] text-[#486581]'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`font-bold ${isDark ? 'text-zinc-300' : 'text-[#071d3d]'}`}>SindhuDrishti</span>
            <span>·</span>
            <span>AI Water OS</span>
            <span>·</span>
            <span>FastAPI & SQLite Backed</span>
          </div>

          <div className="text-[11px] text-center sm:text-right">
            Candidate anomalies are unverified spectral hotspots · Ground-truth validation required
          </div>
        </footer>
      </section>

    </div>
  );
};
