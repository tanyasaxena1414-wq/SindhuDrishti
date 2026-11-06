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
  Database,
  Radio,
  FileCheck2
} from 'lucide-react';

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

  return (
    <div className="flex-1 w-full max-w-[1720px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 font-['DM_Sans',sans-serif]">
      {/* Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-sky-950/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Citizen Pollution Incident Desk</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                SQLite Ground-Truth
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              Community Pollution Submissions, Sentinel-2 Optical Correlation & Authenticated Reviewer Triage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchReports}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#030919] border border-sky-900/60 text-xs font-mono text-zinc-300 hover:text-white hover:border-cyan-400 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReviewerDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#061538] border border-cyan-800/60 text-xs font-mono text-cyan-300 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Reviewer Desk</span>
          </button>

          <button
            type="button"
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-400 to-[#6095f6] text-slate-950 font-bold text-xs hover:from-sky-300 transition-all shadow-[0_0_15px_rgba(96,149,246,0.3)] cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Incident</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Real-time KPI Incident Metrics Row (Clean Structured SaaS Cards) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Incidents */}
        <div className="p-4 rounded-2xl bg-[#02071a]/90 border border-sky-950/80 backdrop-blur-xl relative overflow-hidden group hover:border-sky-800 transition-all shadow-lg">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-xs font-medium">Total Incidents</span>
            <FileCheck2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white mb-0.5">
            {stats?.citizen_reports_total ?? total}
          </div>
          <p className="text-[11px] text-zinc-400 leading-tight">
            Community logs recorded in persistent database
          </p>
          <div className="mt-2.5 pt-2 border-t border-sky-950 flex items-center justify-between text-[10px] font-mono text-cyan-300/80">
            <span>Last 7 Days: {stats?.reports_last_7_days ?? 0}</span>
            <span>30d: {stats?.reports_last_30_days ?? 0}</span>
          </div>
        </div>

        {/* Metric 2: Pending Triage */}
        <div className="p-4 rounded-2xl bg-[#02071a]/90 border border-sky-950/80 backdrop-blur-xl relative overflow-hidden group hover:border-amber-800 transition-all shadow-lg">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-xs font-medium">Pending Triage</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-300 mb-0.5">
            {stats?.citizen_reports_pending ?? reports.filter((r) => r.status === 'pending').length}
          </div>
          <p className="text-[11px] text-zinc-400 leading-tight">
            Submissions awaiting field reviewer verification
          </p>
          <div className="mt-2.5 pt-2 border-t border-sky-950 flex items-center justify-between text-[10px] font-mono text-amber-300/80">
            <span>Action Required</span>
            <span>Reviewer Desk</span>
          </div>
        </div>

        {/* Metric 3: Verified Ground-Truth */}
        <div className="p-4 rounded-2xl bg-[#02071a]/90 border border-sky-950/80 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-800 transition-all shadow-lg">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-xs font-medium">Verified Ground-Truth</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-300 mb-0.5">
            {stats?.citizen_reports_verified ?? reports.filter((r) => r.status === 'verified').length}
          </div>
          <p className="text-[11px] text-zinc-400 leading-tight">
            Confirmed plastic debris & shoreline accumulation
          </p>
          <div className="mt-2.5 pt-2 border-t border-sky-950 flex items-center justify-between text-[10px] font-mono text-emerald-300/80">
            <span>Clean Actionable</span>
            <span>Field Validated</span>
          </div>
        </div>

        {/* Metric 4: Rejected / Flagged */}
        <div className="p-4 rounded-2xl bg-[#02071a]/90 border border-sky-950/80 backdrop-blur-xl relative overflow-hidden group hover:border-rose-800 transition-all shadow-lg">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-xs font-medium">Flagged / Rejected</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-300 mb-0.5">
            {stats?.citizen_reports_rejected ?? reports.filter((r) => r.status === 'rejected').length}
          </div>
          <p className="text-[11px] text-zinc-400 leading-tight">
            False alarms, duplicate submissions, or organic flotsam
          </p>
          <div className="mt-2.5 pt-2 border-t border-sky-950 flex items-center justify-between text-[10px] font-mono text-rose-300/80">
            <span>Filtered Noise</span>
            <span>Archived</span>
          </div>
        </div>
      </section>

      {/* Reports Feed & Inspection Workspace */}
      <section>
        <ReportFeed
          reports={reports}
          total={total}
          page={page}
          totalPages={totalPages}
          isLoading={isLoading}
          statusFilter={statusFilter}
          onStatusFilterChange={(s) => {
            setStatusFilter(s);
            setPage(1);
          }}
          onPageChange={setPage}
          selectedReport={selectedReport}
          onSelectReport={(report) => setSelectedReport(report)}
          onOpenReviewerDrawer={() => setIsReviewerDrawerOpen(true)}
          reviewerKey={reviewerKey}
          onChangeReviewerKey={setReviewerKey}
          onUpdateStatus={handleUpdateReportStatus}
          onOpenReportModal={handleOpenModal}
          stats={stats}
        />
      </section>

      {/* Report Form Modal */}
      <ReportFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onReportSubmitted={fetchReports}
      />

      {/* Reviewer Operations Drawer */}
      <ReviewerDrawer
        isOpen={isReviewerDrawerOpen}
        onClose={() => setIsReviewerDrawerOpen(false)}
        reviewerKey={reviewerKey}
        onChangeReviewerKey={setReviewerKey}
        selectedReport={selectedReport}
        onReportUpdated={fetchReports}
      />
    </div>
  );
};
