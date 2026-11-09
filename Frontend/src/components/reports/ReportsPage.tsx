import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { ReportResponse, ReportStatus, DashboardStats } from '../../types';
import { ReportFeed } from './ReportFeed';
import { ReportFormModal } from './ReportFormModal';
import { ReviewerDrawer } from './ReviewerDrawer';
import { 
  FileText, 
  PlusCircle, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle,
  FileCheck2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ReportsPageProps {
  onOpenReportModal?: () => void;
  isReportModalOpen?: boolean;
  onCloseReportModal?: () => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  onOpenReportModal: externalOpenModal,
  isReportModalOpen: externalIsModalOpen,
  onCloseReportModal: externalCloseModal,
}) => {
  const { isDark } = useTheme();
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selection & Reviewer State
  const [selectedReport, setSelectedReport] = useState<ReportResponse | null>(null);
  const [reviewerKey, setReviewerKey] = useState<string>('sindhu-reviewer-2026');
  const [isReviewerDrawerOpen, setIsReviewerDrawerOpen] = useState<boolean>(false);
  const [internalModalOpen, setInternalModalOpen] = useState<boolean>(false);

  const isModalOpen = externalIsModalOpen ?? internalModalOpen;
  const handleOpenModal = externalOpenModal ?? (() => setInternalModalOpen(true));
  const handleCloseModal = externalCloseModal ?? (() => setInternalModalOpen(false));

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [res, s] = await Promise.all([
        api.getReports({
          status: statusFilter,
          page,
          pageSize: 10,
          reviewerApiKey: reviewerKey.trim() || undefined,
        }),
        api.getDashboardStats().catch(() => null),
      ]);

      setReports(res.reports);
      setTotal(res.total);
      setTotalPages(res.total_pages);
      if (s) setStats(s);

      if (res.reports.length > 0) {
        setSelectedReport((prev) => {
          if (!prev) return res.reports[0];
          return res.reports.find((r) => r.report_id === prev.report_id) || res.reports[0];
        });
      } else {
        setSelectedReport(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch incident reports from database');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page, reviewerKey]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdateReportStatus = async (reportId: string, newStatus: ReportStatus, notes?: string) => {
    await api.updateReportStatus(
      reportId,
      { status: newStatus, reviewer_notes: notes },
      reviewerKey
    );
    await fetchReports();
  };

  const handleDeleteReport = async (reportId: string) => {
    await api.deleteReport(reportId, reviewerKey);
    setSelectedReport(null);
    await fetchReports();
  };

  const handleClearAllReports = async () => {
    await api.clearAllReports(reviewerKey);
    setSelectedReport(null);
    await fetchReports();
  };

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
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
              <span>Citizen Pollution Incident Desk</span>
              <span 
                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                  isDark 
                    ? 'bg-[#051324] text-[#18c9e8] border border-[#18c9e8]/30' 
                    : 'bg-[#edf2f7] text-[#0284c7] border border-[#cbd5e1]'
                }`}
              >
                SQLite Ground-Truth
              </span>
            </h1>
            <p className="text-xs text-zinc-500">
              Community Pollution Submissions, Sentinel-2 Optical Correlation & Authenticated Reviewer Triage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchReports}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
              isDark 
                ? 'bg-[#051324] border-[#0e2a47] text-zinc-300 hover:text-white hover:border-[#18c9e8]' 
                : 'bg-white border-[#cbd5e1] text-zinc-700 hover:text-black hover:border-[#0284c7]'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#18c9e8]' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReviewerDrawerOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-colors cursor-pointer ${
              isDark 
                ? 'bg-[#071a2e] border-[#18c9e8]/40 text-[#18c9e8] hover:border-[#18c9e8]' 
                : 'bg-white border-[#cbd5e1] text-[#0284c7] hover:border-[#0284c7]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Reviewer Desk</span>
          </button>

          <button
            type="button"
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#18c9e8] to-[#0284c7] text-slate-950 font-bold text-xs hover:opacity-95 transition-all shadow-md cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Incident</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-500">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Real-time KPI Incident Metrics Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Incidents */}
        <div 
          className={`p-4 rounded-2xl border backdrop-blur-xl relative overflow-hidden transition-all shadow-sm ${
            isDark ? 'bg-[#071a2e]/60 border-[#0e2a47]' : 'bg-gradient-to-br from-white to-[#f4f8fc] border-[#d2e1ee] hover:border-[#0284c7]/40 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>Total Incidents</span>
            <FileCheck2 className={`w-4 h-4 ${isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]'}`} />
          </div>
          <div className={`text-2xl sm:text-3xl font-bold font-display mb-0.5 ${isDark ? 'text-white' : 'text-[#071d3d]'}`}>
            {stats?.citizen_reports_total ?? total}
          </div>
          <p className={`text-[11px] leading-tight ${isDark ? 'text-zinc-500' : 'text-[#486581]'}`}>
            Community logs recorded in persistent database
          </p>
          <div className={`mt-2.5 pt-2 border-t border-zinc-500/20 flex items-center justify-between text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>
            <span>Last 7 Days: {stats?.reports_last_7_days ?? 0}</span>
            <span>30d: {stats?.reports_last_30_days ?? 0}</span>
          </div>
        </div>

        {/* Metric 2: Pending Triage */}
        <div 
          className={`p-4 rounded-2xl border backdrop-blur-xl relative overflow-hidden transition-all shadow-sm ${
            isDark ? 'bg-[#071a2e]/60 border-[#0e2a47]' : 'bg-gradient-to-br from-white to-[#f4f8fc] border-[#d2e1ee] hover:border-amber-400/40 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>Pending Triage</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-display text-amber-500 mb-0.5">
            {stats?.citizen_reports_pending ?? reports.filter((r) => r.status === 'pending').length}
          </div>
          <p className={`text-[11px] leading-tight ${isDark ? 'text-zinc-500' : 'text-[#486581]'}`}>
            Submissions awaiting field reviewer verification
          </p>
          <div className="mt-2.5 pt-2 border-t border-zinc-500/20 flex items-center justify-between text-[10px] font-mono text-amber-500 font-semibold">
            <span>Action Required</span>
            <span>Reviewer Desk</span>
          </div>
        </div>

        {/* Metric 3: Verified Ground-Truth */}
        <div 
          className={`p-4 rounded-2xl border backdrop-blur-xl relative overflow-hidden transition-all shadow-sm ${
            isDark ? 'bg-[#071a2e]/60 border-[#0e2a47]' : 'bg-gradient-to-br from-white to-[#f4f8fc] border-[#d2e1ee] hover:border-emerald-400/40 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>Verified Ground-Truth</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-display text-emerald-500 mb-0.5">
            {stats?.citizen_reports_verified ?? reports.filter((r) => r.status === 'verified').length}
          </div>
          <p className={`text-[11px] leading-tight ${isDark ? 'text-zinc-500' : 'text-[#486581]'}`}>
            Field confirmed by authorized conservation desk
          </p>
          <div className="mt-2.5 pt-2 border-t border-zinc-500/20 flex items-center justify-between text-[10px] font-mono text-emerald-500 font-semibold">
            <span>High Fidelity</span>
            <span>Ground-Truth</span>
          </div>
        </div>

        {/* Metric 4: Rejected False Positives */}
        <div 
          className={`p-4 rounded-2xl border backdrop-blur-xl relative overflow-hidden transition-all shadow-sm ${
            isDark ? 'bg-[#071a2e]/60 border-[#0e2a47]' : 'bg-gradient-to-br from-white to-[#f4f8fc] border-[#d2e1ee] hover:border-rose-400/40 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-zinc-500 mb-1.5">
            <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>Filtered Discards</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-display text-rose-500 mb-0.5">
            {stats?.citizen_reports_rejected ?? reports.filter((r) => r.status === 'rejected').length}
          </div>
          <p className={`text-[11px] leading-tight ${isDark ? 'text-zinc-500' : 'text-[#486581]'}`}>
            Uncorrelated noise, spam, or natural vegetation
          </p>
          <div className="mt-2.5 pt-2 border-t border-zinc-500/20 flex items-center justify-between text-[10px] font-mono text-rose-500 font-semibold">
            <span>Screened</span>
            <span>Excluded</span>
          </div>
        </div>
      </section>

      {/* Main Report Feed & Detail View */}
      <section>
        <ReportFeed
          reports={reports}
          total={total}
          page={page}
          totalPages={totalPages}
          isLoading={isLoading}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onPageChange={setPage}
          selectedReport={selectedReport}
          onSelectReport={setSelectedReport}
          onOpenReviewerDrawer={() => setIsReviewerDrawerOpen(true)}
          reviewerKey={reviewerKey}
          onChangeReviewerKey={setReviewerKey}
          onUpdateStatus={handleUpdateReportStatus}
          onDeleteReport={handleDeleteReport}
          onClearAllReports={handleClearAllReports}
          onOpenReportModal={handleOpenModal}
          stats={stats}
        />
      </section>

      {/* Reviewer Drawer */}
      <ReviewerDrawer
        isOpen={isReviewerDrawerOpen}
        onClose={() => setIsReviewerDrawerOpen(false)}
        report={selectedReport}
        reviewerKey={reviewerKey}
        onChangeReviewerKey={setReviewerKey}
        onStatusUpdated={fetchReports}
      />

      {/* Submit Report Modal */}
      <ReportFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onReportSubmitted={() => {
          fetchReports();
          handleCloseModal();
        }}
      />
    </div>
  );
};
