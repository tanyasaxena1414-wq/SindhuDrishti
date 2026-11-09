import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  BarChart3, 
  Wind, 
  FileText, 
  PlusCircle, 
  Menu, 
  X, 
  Waves,
  Sun,
  Moon,
  ArrowRight,
  Globe2
} from 'lucide-react';
import { api } from '../../services/api';
import { HealthResponse, NavigationTab, BasinId } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenReportModal: () => void;
  currentBasin?: BasinId;
  onSelectBasin?: (basin: BasinId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenReportModal,
  currentBasin = 'jayakwadi',
  onSelectBasin,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const checkHealth = async () => {
    try {
      const res = await api.getHealth();
      setHealth(res);
    } catch {
      setHealth(null);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLandingScroll = (sectionId: string) => {
    if (currentTab !== 'landing') {
      onSelectTab('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems: { tab: NavigationTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { tab: 'explore-map', label: 'Explore Map', icon: Compass },
    { tab: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { tab: 'drift', label: 'Drift Lab', icon: Wind },
    { tab: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full backdrop-blur-xl border-b transition-colors duration-200 select-none ${
        isDark
          ? 'bg-[#020817]/90 border-[#0e2a47]/70 text-[#f8fafc]'
          : 'bg-white/95 border-[#d0dde9] text-[#06152b] shadow-xs'
      }`}
    >
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <button 
          onClick={() => onSelectTab('landing')}
          className="flex items-center gap-2.5 cursor-pointer group text-left"
          title="SindhuDrishti Home"
        >
          {/* Moodboard Wave Icon: 3 flowing wave lines */}
          <div className="flex items-center justify-center">
            <Waves className={`w-6 h-6 stroke-[2.2] ${isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]'}`} />
          </div>
          <div>
            <span className="font-display font-bold text-lg sm:text-xl tracking-tight">
              Sindhu<span className={isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]'}>Drishti</span>
            </span>
          </div>
        </button>

        {/* Center Editorial Links & Workspaces */}
        {currentTab === 'landing' ? (
          /* Moodboard Landing Navigation: Platform, Study Areas, About */
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <button
              onClick={() => handleLandingScroll('platform-workflow')}
              className={`transition-colors cursor-pointer ${
                isDark ? 'text-zinc-300 hover:text-[#18c9e8]' : 'text-[#334e68] hover:text-[#0284c7] font-semibold'
              }`}
            >
              Platform
            </button>
            <button
              onClick={() => handleLandingScroll('focus-regions')}
              className={`transition-colors cursor-pointer ${
                isDark ? 'text-zinc-300 hover:text-[#18c9e8]' : 'text-[#334e68] hover:text-[#0284c7] font-semibold'
              }`}
            >
              Study Areas
            </button>
            <button
              onClick={() => handleLandingScroll('the-challenge')}
              className={`transition-colors cursor-pointer ${
                isDark ? 'text-zinc-300 hover:text-[#18c9e8]' : 'text-[#334e68] hover:text-[#0284c7] font-semibold'
              }`}
            >
              About
            </button>
          </div>
        ) : (
          /* Application Workspace Navigation (Explore Map, Dashboard, Drift Lab, Reports) */
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex items-center gap-5 text-xs font-medium">
              <button
                onClick={() => onSelectTab('landing')}
                className={`transition-colors cursor-pointer ${
                  isDark ? 'text-zinc-400 hover:text-white' : 'text-[#536b88] hover:text-[#091e3a]'
                }`}
              >
                Overview
              </button>
            </div>

            <div className={`w-[1px] h-4 ${isDark ? 'bg-zinc-800' : 'bg-[#cbd5e1]'}`} />

            <nav
              className={`flex items-center gap-1 rounded-xl p-1 border shadow-inner ${
                isDark
                  ? 'bg-[#051324]/80 border-[#0e2a47]/70'
                  : 'bg-[#e4ecf4] border-[#d0dde9]'
              }`}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => onSelectTab(item.tab)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-[#073b55] text-[#18c9e8] border border-[#18c9e8]/40 shadow-sm font-semibold'
                          : 'bg-white text-[#0284c7] border border-[#cbd5e1] shadow-xs font-semibold'
                        : isDark
                          ? 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                          : 'text-[#4d6582] hover:text-[#06152b] hover:bg-white/70 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? (isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]') : 'opacity-70'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Right Utility & Actions */}
        <div className="flex items-center gap-3">
          {/* Multi-Basin Switcher (shown on internal app tabs) */}
          {currentTab !== 'landing' && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono shadow-sm ${
                isDark
                  ? 'bg-[#051324] border-[#0e2a47] text-zinc-300'
                  : 'bg-white border-[#cbd5e1] text-[#091e3a]'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 text-zinc-400" />
              <select
                aria-label="Target Watershed Basin"
                value={currentBasin}
                onChange={(e) => onSelectBasin && onSelectBasin(e.target.value as BasinId)}
                className="bg-transparent border-none outline-none cursor-pointer pr-1 text-inherit font-inherit"
              >
                <option value="jayakwadi" className={isDark ? 'bg-[#051324] text-white' : 'bg-white text-black'}>
                  Jayakwadi (Godavari)
                </option>
                <option value="hussainsagar" className={isDark ? 'bg-[#051324] text-white' : 'bg-white text-black'}>
                  Hussain Sagar (Hyderabad)
                </option>
              </select>
            </div>
          )}

          {/* Theme Toggle Pill (Sun ☼ / Moon ☾ matching moodboard) */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
              isDark
                ? 'border-white/20 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10'
                : 'border-[#cbd5e1] bg-white text-[#1e3a5f] hover:text-[#091e3a] hover:bg-[#f1f5f9] shadow-xs'
            }`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
            aria-label="Toggle visual theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-sky-600" />}
          </button>

          {/* Solid Cyan Pill Button: Explore Platform → */}
          <button
            onClick={() => onSelectTab('explore-map')}
            className={`px-5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-1.5 cursor-pointer font-display ${
              isDark
                ? 'bg-[#18c9e8] hover:bg-[#38d4f0] text-[#020817] shadow-[0_0_20px_rgba(24,201,232,0.35)]'
                : 'bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-[0_4px_14px_rgba(2,132,199,0.25)]'
            }`}
          >
            <span>Explore Platform</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg border cursor-pointer ${
              isDark
                ? 'border-zinc-700 text-zinc-300 hover:text-white'
                : 'border-zinc-300 text-zinc-700 hover:text-black'
            }`}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          className={`lg:hidden px-4 pt-3 pb-5 border-b space-y-3 ${
            isDark ? 'bg-[#020817] border-[#0e2a47]' : 'bg-white border-[#e2e8f0]'
          }`}
        >
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => {
                    onSelectTab(item.tab);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium ${
                    isActive
                      ? isDark
                        ? 'bg-[#073b55] text-[#18c9e8] font-bold border border-[#18c9e8]/40'
                        : 'bg-[#edf2f7] text-[#0284c7] font-bold border border-[#cbd5e1]'
                      : isDark
                        ? 'text-zinc-300 hover:bg-white/5'
                        : 'text-zinc-700 hover:bg-black/5'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#18c9e8]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-zinc-700/30 flex items-center justify-between">
            <span className="text-xs text-zinc-400">Target Study Area:</span>
            <select
              value={currentBasin}
              className={`bg-transparent text-xs font-mono font-bold ${
                isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]'
              }`}
              onChange={(e) => {
                const next = e.target.value as BasinId;
                if (onSelectBasin) onSelectBasin(next);
              }}
            >
              <option value="jayakwadi" className={isDark ? 'bg-[#020817] text-white' : 'bg-white text-slate-900'}>
                Jayakwadi (Godavari)
              </option>
              <option value="hussainsagar" className={isDark ? 'bg-[#020817] text-white' : 'bg-white text-slate-900'}>
                Hussain Sagar (Krishna)
              </option>
            </select>
          </div>
        </div>
      )}
    </header>
  );
};
