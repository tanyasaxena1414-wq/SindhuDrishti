import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/navigation/Navbar';
import { LandingPage } from './components/landing/LandingPage';
import { MapPage } from './components/map/MapPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { DriftPage } from './components/drift/DriftPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { ReportFormModal } from './components/reports/ReportFormModal';
import { NavigationTab, BasinId } from './types';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const getInitialTab = (): NavigationTab => {
  if (typeof window === 'undefined') return 'landing';
  const path = window.location.pathname.toLowerCase();
  if (path.includes('map') || path.includes('explore')) return 'explore-map';
  if (path.includes('dashboard') || path.includes('cleanup')) return 'dashboard';
  if (path.includes('drift') || path.includes('analysis') || path.includes('sim')) return 'drift';
  if (path.includes('report')) return 'reports';
  return 'landing';
};

const getPathForTab = (tab: NavigationTab): string => {
  switch (tab) {
    case 'explore-map': return '/map';
    case 'dashboard': return '/dashboard';
    case 'drift': return '/drift';
    case 'reports': return '/reports';
    case 'landing':
    default: return '/';
  }
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>(getInitialTab);
  const [currentBasin, setCurrentBasin] = useState<BasinId>('jayakwadi');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  const handleSelectTab = useCallback((tab: NavigationTab) => {
    setCurrentTab(tab);
    if (typeof window !== 'undefined') {
      const path = getPathForTab(tab);
      if (window.location.pathname !== path) {
        window.history.pushState(null, '', path);
      }
    }
  }, []);

  // Listen to popstate for browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      setCurrentTab(getInitialTab());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#01040c] text-white flex flex-col font-['DM_Sans',sans-serif] selection:bg-[#38bdf8] selection:text-slate-950">
      {/* Global Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        currentBasin={currentBasin}
        onSelectBasin={setCurrentBasin}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* Main Workspace View */}
      <main className="flex-1 flex flex-col">
        <ErrorBoundary>
          {currentTab === 'landing' && (
            <LandingPage
              onSelectTab={handleSelectTab}
              onOpenReportModal={() => setIsReportModalOpen(true)}
            />
          )}

          {currentTab === 'explore-map' && (
            <MapPage
              currentBasin={currentBasin}
              onSelectBasin={setCurrentBasin}
            />
          )}

          {currentTab === 'dashboard' && <DashboardPage />}

          {currentTab === 'drift' && <DriftPage />}

          {currentTab === 'reports' && (
            <ReportsPage
              isReportModalOpen={isReportModalOpen}
              onCloseReportModal={() => setIsReportModalOpen(false)}
              onOpenReportModal={() => setIsReportModalOpen(true)}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Global Report Form Modal */}
      {currentTab !== 'reports' && (
        <ReportFormModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onReportSubmitted={() => {
            // If on landing or other tab, could navigate to reports or notify
          }}
        />
      )}
    </div>
  );
}
