import React from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  Image as ImageIcon
} from 'lucide-react';
import { ReportResponse, ReportStatus } from '../../types';

interface ReportFeedProps {
  reports: ReportResponse[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  statusFilter: 'all' | ReportStatus;
  onStatusFilterChange: (status: 'all' | ReportStatus) => void;
  onPageChange: (newPage: number) => void;
  selectedReport: ReportResponse | null;
  onSelectReport: (report: ReportResponse) => void;
  onOpenReviewerDrawer: () => void;
}

export const ReportFeed: React.FC<ReportFeedProps> = ({
  reports,
  total,
  page,
  totalPages,
  isLoading,
  statusFilter,
  onStatusFilterChange,
  onPageChange,
  selectedReport,
  onSelectReport,
  onOpenReviewerDrawer,
}) => {
  return (
    <div className="space-y-4 font-['DM_Sans',sans-serif]">
      {/* Sub-bar Filter & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#03091c]/80 border border-sky-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
            Incident Logs ({total})
          </span>
          <span className="text-zinc-600">·</span>
          <span className="text-[11px] font-mono text-zinc-400">
            Community Environmental Submissions
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#020512] border border-sky-950 p-1 rounded-xl text-xs font-mono">
            {(['all', 'pending', 'verified', 'rejected'] as const).map((s) => (
              <button
                key={s}
                onClick={() => onStatusFilterChange(s)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                  statusFilter === s
                    ? 'bg-sky-950/80 text-cyan-300 border border-cyan-800/60'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Reviewer Mode Trigger */}
          <button
            onClick={onOpenReviewerDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#071333] border border-sky-800/60 text-xs font-mono text-cyan-300 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Reviewer Desk</span>
          </button>
        </div>
      </div>

      {/* Reports Feed List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono text-zinc-500 animate-pulse bg-[#02071a]/50 rounded-2xl border border-sky-950">
          Loading incident reports from database...
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 text-center text-xs font-mono text-zinc-500 bg-[#02071a]/50 rounded-2xl border border-sky-950">
          No reports found matching the current filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => {
            const isSelected = selectedReport?.report_id === report.report_id;

            return (
              <div
                key={report.report_id}
                onClick={() => onSelectReport(report)}
                className={`p-4 rounded-2xl bg-[#02071a]/80 border transition-all duration-200 cursor-pointer shadow-lg space-y-3 ${
                  isSelected
                    ? 'border-cyan-400/80 bg-[#030d29]/90 shadow-[0_0_20px_rgba(56,189,248,0.15)]'
                    : 'border-sky-950/80 hover:border-sky-800/70'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                      report.status === 'verified'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : report.status === 'rejected'
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}>
                      {report.status}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[150px]">
                      {report.report_id}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{report.submitted_at.replace('T', ' ').slice(0, 16)} UTC</span>
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-200 leading-relaxed line-clamp-3">
                  {report.description}
                </p>

                {/* AI Computer Vision & Satellite Match Badges */}
                {report.ai_vision_analysis && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                      AI Severity: {report.ai_vision_analysis.severity_label.split('—')[0].trim()}
                    </span>
                    {report.ai_vision_analysis.is_satellite_correlated && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-600/80 text-emerald-300 flex items-center gap-1 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>🛰️ Satellite Match ({report.ai_vision_analysis.satellite_correlation?.correlation_confidence_percent}%)</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Coordinates & Metadata */}
                <div className="pt-2 border-t border-sky-950 flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-400 gap-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span>{report.latitude}°N, {report.longitude}°E</span>
                  </div>

                  {report.photo_reference && (
                    <span className="text-[10px] text-cyan-300/80 truncate max-w-[160px] flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      <span>{report.photo_reference.slice(0, 24)}</span>
                    </span>
                  )}
                </div>

                {/* Reviewer notes if present */}
                {report.reviewer_notes && (
                  <div className="p-2 rounded-lg bg-sky-950/40 border border-sky-800/30 text-[10px] font-mono text-cyan-200/90 leading-tight">
                    <span className="font-bold block text-cyan-300 mb-0.5">Reviewer Note:</span>
                    <span>{report.reviewer_notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#03091c]/80 border border-sky-950/80 backdrop-blur-xl text-xs font-mono">
          <span className="text-zinc-400">
            Page {page} of {totalPages} ({total} Total Submissions)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(page - 1, 1))}
              disabled={page <= 1 || isLoading}
              className="p-1.5 rounded-lg bg-[#020512] border border-sky-950 text-zinc-300 hover:text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(Math.min(page + 1, totalPages))}
              disabled={page >= totalPages || isLoading}
              className="p-1.5 rounded-lg bg-[#020512] border border-sky-950 text-zinc-300 hover:text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
