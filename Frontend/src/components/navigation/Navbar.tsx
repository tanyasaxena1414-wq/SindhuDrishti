import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  BarChart3, 
  Wind, 
  FileText, 
  PlusCircle, 
  Menu, 
  X, 
  Satellite,
  Waves,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { HealthResponse, NavigationTab, BasinId } from '../../types';

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

  const navItems: { tab: NavigationTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { tab: 'explore-map', label: 'Explore Map', icon: Compass },
    { tab: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { tab: 'drift', label: 'Drift Lab', icon: Wind },
    { tab: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#020512]/90 border-b border-sky-950/70 backdrop-blur-xl select-none">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <button 
          onClick={() => onSelectTab('landing')}
          className="flex items-center gap-3 cursor-pointer group text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-sky-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.25)] group-hover:border-sky-400 transition-colors">
            <Waves className="w-5 h-5 text-cyan-300 group-hover:scale-105 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white font-['DM_Sans',sans-serif]">
                Sindhu<span className="text-cyan-300">Drishti</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950/80 border border-sky-800/50 text-cyan-300">
                AI Water OS
              </span>
            </div>
            <p className="text-[10px] font-mono text-zinc-400 hidden sm:block">
              {currentBasin === 'hussainsagar' 
                ? 'Krishna Basin · Urban Lake Intelligence'
                : 'Godavari Basin · Debris Intelligence'}
            </p>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#03091c]/80 border border-sky-950/80 rounded-2xl p-1 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => onSelectTab(item.tab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500/20 to-blue-600/30 border border-cyan-400/60 text-cyan-200 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                    : 'text-zinc-400 hover:text-white hover:bg-sky-950/40 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-300' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Multi-Basin Switcher (Scalability Proof) */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#030919] border border-sky-900/60 text-[11px] font-mono shadow-sm">
            <span className="text-zinc-500">Basin:</span>
            <select
              aria-label="Target Watershed Basin"
              value={currentBasin}
              className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer text-xs"
              onChange={(e) => {
                const next = e.target.value as BasinId;
                if (onSelectBasin) {
                  onSelectBasin(next);
                }
              }}
            >
              <option value="jayakwadi" className="bg-[#030919] text-white">🌊 Jayakwadi (Godavari) • Active</option>
              <option value="hussainsagar" className="bg-[#030919] text-white">🏙️ Hussain Sagar (Krishna) • Urban</option>
            </select>
          </div>

          {/* Live Backend Health Pill */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#030919] border border-sky-950 text-[10px] font-mono">
            <span className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-zinc-400">API:</span>
            <span className={health?.status === 'healthy' ? 'text-emerald-300 font-semibold' : 'text-amber-300'}>
              {health?.status ? 'Connected' : 'Offline'}
            </span>
          </div>

          {/* Quick Submit Report CTA */}
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-400 to-[#6095f6] text-slate-950 font-bold text-xs hover:from-sky-300 hover:to-[#7096f2] transition-all shadow-[0_0_15px_rgba(96,149,246,0.3)] cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-950" />
            <span className="hidden sm:inline">Log</span>
            <span>Report</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-[#030919] border border-sky-950 text-zinc-300 hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 bg-[#020617] border-b border-sky-950/80 space-y-2">
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
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium text-left ${
                  isActive
                    ? 'bg-sky-950/60 border border-cyan-400/50 text-cyan-200'
                    : 'text-zinc-400 hover:bg-sky-950/30 text-white'
                }`}
              >
                <Icon className="w-4 h-4 text-cyan-300" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
