import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { ReportResponse, ReportStatus } from '../../types';
import { ReportFeed } from './ReportFeed';
import { ReportFormModal } from './ReportFormModal';
import { ReviewerDrawer } from './ReviewerDrawer';
import { FileText, PlusCircle, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

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
      const res = await api.getReports({
        status: statusFilter,
        page,
        pageSize: 10,
        reviewerApiKey: reviewerKey.trim() || undefined,
      });
      setReports(res.reports);
      setTotal(res.total);
      setTotalPages(res.total_pages);
      if (res.reports.length > 0) {
        setSelectedReport((prev) => {
          if (!prev) return res.reports[0];
          return res.reports.find((r) => r.report_id === prev.report_id) || res.reports[0];
        });
      } else {
        setSelectedReport(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch incident reports');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page, reviewerKey]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

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
                SQLite Store
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              Community Pollution Logs, Reviewer Triage & Ground Truth Reporting
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReports}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#030919] border border-sky-900/60 text-xs font-mono text-zinc-300 hover:text-white hover:border-cyan-400 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
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

      {/* Reports Feed */}
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
        onSelectReport={(report) => {
          setSelectedReport(report);
          setIsReviewerDrawerOpen(true);
        }}
        onOpenReviewerDrawer={() => setIsReviewerDrawerOpen(true)}
      />

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
