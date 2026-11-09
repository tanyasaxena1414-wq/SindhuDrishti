import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Copy, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  Radio, 
  Image as ImageIcon, 
  KeyRound, 
  PlusCircle 
} from 'lucide-react';
import { ReportResponse, ReportStatus, DashboardStats } from '../../types';
import { useTheme } from '../../context/ThemeContext';

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
  reviewerKey: string;
  onChangeReviewerKey?: (key: string) => void;
  onUpdateStatus?: (reportId: string, status: ReportStatus, notes?: string) => Promise<void>;
  onOpenReportModal?: () => void;
  stats?: DashboardStats | null;
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
  reviewerKey,
  onChangeReviewerKey,
  onUpdateStatus,
  onOpenReportModal,
  stats,
}) => {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [satelliteOnly, setSatelliteOnly] = useState<boolean>(false);
  const [photoOnly, setPhotoOnly] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedGps, setCopiedGps] = useState<string | null>(null);

  // Reviewer quick action state
  const [reviewerNotes, setReviewerNotes] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // Photo filter
      if (photoOnly && !r.photo_reference) return false;

      // Satellite correlation filter
      if (satelliteOnly && !r.ai_vision_analysis?.is_satellite_correlated) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesDesc = r.description.toLowerCase().includes(q);
        const matchesId = r.report_id.toLowerCase().includes(q);
        const matchesCoords = `${r.latitude},${r.longitude}`.includes(q);
        const matchesNotes = r.reviewer_notes?.toLowerCase().includes(q) || false;
        if (!matchesDesc && !matchesId && !matchesCoords && !matchesNotes) return false;
      }

      return true;
    });
  }, [reports, photoOnly, satelliteOnly, searchQuery]);

  const handleCopy = (text: string, type: 'id' | 'gps', identifier: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(identifier);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedGps(identifier);
      setTimeout(() => setCopiedGps(null), 2000);
    }
  };

  const handleQuickStatusUpdate = async (newStatus: ReportStatus) => {
    if (!selectedReport || !onUpdateStatus) return;
    setIsUpdatingStatus(true);
    setActionFeedback(null);
    try {
      await onUpdateStatus(selectedReport.report_id, newStatus, reviewerNotes.trim() || undefined);
      setActionFeedback({ type: 'success', message: `Report marked as ${newStatus}.` });
      setReviewerNotes('');
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Status transition failed.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Command & Filter Bar */}
      <div 
        className={`p-3.5 rounded-2xl border backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-md ${
          isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-[#edf4fa] border-[#cddce9]'
        }`}
      >
        {/* Status Filter Tabs */}
        <div 
          className={`flex flex-wrap items-center gap-1.5 p-1 rounded-xl text-xs font-mono border ${
            isDark ? 'bg-[#020817] border-[#0e2a47]' : 'bg-white border-[#cddce9]'
          }`}
        >
          {(['all', 'pending', 'verified', 'rejected'] as const).map((s) => {
            const count = s === 'all' 
              ? (stats?.citizen_reports_total ?? total)
              : s === 'pending'
              ? (stats?.citizen_reports_pending ?? 0)
              : s === 'verified'
              ? (stats?.citizen_reports_verified ?? 0)
              : (stats?.citizen_reports_rejected ?? 0);

            const isActive = statusFilter === s;

            return (
              <button
                key={s}
                type="button"
                onClick={() => onStatusFilterChange(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  isActive
                    ? isDark 
                      ? 'bg-[#073b55] text-[#18c9e8] font-bold border border-[#18c9e8]/40' 
                      : 'bg-slate-100 text-[#0284c7] font-bold border border-slate-300'
                    : isDark ? 'text-zinc-400 hover:text-white border border-transparent' : 'text-slate-600 hover:text-[#06152b] border border-transparent'
                }`}
              >
                <span>{s}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive 
                    ? (isDark ? 'bg-[#020817] text-[#18c9e8]' : 'bg-white text-[#0284c7]') 
                    : (isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-700')
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Quick Toggles */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl justify-end">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by ID, location, details..."
              className={`w-full rounded-xl pl-8.5 pr-3 py-1.5 text-xs font-mono focus:outline-none border transition-colors ${
                isDark 
                  ? 'bg-[#020817] border-[#0e2a47] text-white placeholder:text-zinc-600 focus:border-[#18c9e8]' 
                  : 'bg-white border-[#cbd5e1] text-slate-900 placeholder:text-zinc-400 focus:border-[#0284c7]'
              }`}
            />
          </div>

          {/* Quick Toggle: Satellite Matched */}
          <button
            type="button"
            onClick={() => setSatelliteOnly(!satelliteOnly)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono transition-colors cursor-pointer ${
              satelliteOnly
                ? isDark ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : isDark ? 'bg-[#020817] border-[#0e2a47] text-zinc-400' : 'bg-white border-[#cbd5e1] text-zinc-600'
            }`}
          >
            <Radio className={`w-3 h-3 ${satelliteOnly ? 'animate-pulse text-emerald-500' : ''}`} />
            <span>Satellite Matched</span>
          </button>

          {/* Quick Toggle: With Photo */}
          <button
            type="button"
            onClick={() => setPhotoOnly(!photoOnly)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono transition-colors cursor-pointer ${
              photoOnly
                ? isDark ? 'bg-[#073b55] border-[#18c9e8] text-[#18c9e8]' : 'bg-sky-50 border-sky-300 text-sky-700'
                : isDark ? 'bg-[#020817] border-[#0e2a47] text-zinc-400' : 'bg-white border-[#cbd5e1] text-zinc-600'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>With Photo</span>
          </button>
        </div>
      </div>

      {/* Main Master-Detail Inspection Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Side: Incident Feed List */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-3.5">
          {isLoading ? (
            <div className="p-16 text-center text-xs font-mono text-cyan-500 animate-pulse rounded-2xl border flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
              <span>Querying verified citizen pollution logs from database...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div 
              className={`p-8 sm:p-12 text-center rounded-2xl border backdrop-blur-xl space-y-5 shadow-sm ${
                isDark ? 'bg-[#071a2e]/60 border-[#0e2a47]' : 'bg-white border-[#cbd5e1]'
              }`}
            >
              <div 
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border ${
                  isDark ? 'bg-[#051324] border-[#18c9e8]/40 text-[#18c9e8]' : 'bg-sky-50 border-sky-200 text-[#0284c7]'
                }`}
              >
                <FileText className="w-8 h-8" />
              </div>
              
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base font-bold">
                  {statusFilter === 'all' 
                    ? 'No Incident Reports Logged Yet' 
                    : `No ${statusFilter.toUpperCase()} Incidents In This Queue`}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Community field observations provide direct ground-truth calibration for our Sentinel-2 satellite plastic debris classification engine.
                </p>
              </div>

              {onOpenReportModal && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={onOpenReportModal}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#18c9e8] to-[#0284c7] text-slate-950 font-bold text-xs hover:opacity-95 transition-all shadow-md cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Log First Community Incident</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Populated Report Cards List */
            filteredReports.map((report) => {
              const isSelected = selectedReport?.report_id === report.report_id;
              const hasSatelliteMatch = report.ai_vision_analysis?.is_satellite_correlated;

              return (
                <div
                  key={report.report_id}
                  onClick={() => onSelectReport(report)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-sm space-y-3 group ${
                    isSelected
                      ? isDark
                        ? 'border-[#18c9e8] bg-[#073b55]/40 shadow-[0_0_20px_rgba(24,201,232,0.15)] ring-1 ring-[#18c9e8]'
                        : 'border-[#0284c7] bg-sky-50 shadow-sm ring-1 ring-[#0284c7]'
                      : isDark
                        ? 'bg-[#051324]/80 border-[#0e2a47] hover:border-[#18c9e8]/50'
                        : 'bg-gradient-to-br from-white to-[#f4f8fc] border-[#d2e1ee] hover:border-[#0284c7]/50 hover:shadow-md'
                  }`}
                >
                  {/* Card Header: Exact Moodboard Style Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span 
                        className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          report.status === 'verified'
                            ? isDark 
                              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80 shadow-[0_0_8px_rgba(52,211,153,0.2)]'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : report.status === 'rejected'
                            ? isDark
                              ? 'bg-rose-950/90 text-rose-300 border-rose-700/80'
                              : 'bg-rose-50 text-rose-700 border-rose-300'
                            : isDark
                              ? 'bg-amber-950/90 text-amber-300 border-amber-700/80 shadow-[0_0_8px_rgba(251,191,36,0.2)]'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}
                      >
                        <span 
                          className={`w-1.5 h-1.5 rounded-full ${
                            report.status === 'verified' ? 'bg-emerald-400' : report.status === 'rejected' ? 'bg-rose-400' : 'bg-amber-400'
                          }`} 
                        />
                        <span>{report.status === 'verified' ? 'Verified' : report.status === 'rejected' ? 'Rejected' : 'Pending'}</span>
                        <span className="opacity-70 font-normal">#{report.report_id.slice(0, 8)}</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(report.report_id, 'id', report.report_id);
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-cyan-500 transition-colors"
                        title="Copy Report ID"
                      >
                        {copiedId === report.report_id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1 whitespace-nowrap">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{report.submitted_at.replace('T', ' ').slice(0, 16)} UTC</span>
                    </span>
                  </div>

                  {/* Incident Description */}
                  <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                    {report.description}
                  </p>

                  {/* AI Vision & Satellite Correlation Badges */}
                  {report.ai_vision_analysis && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                      <span 
                        className={`px-2 py-0.5 rounded-full border ${
                          isDark ? 'bg-[#051324] border-[#0e2a47] text-zinc-300' : 'bg-slate-100 border-[#cbd5e1] text-zinc-700'
                        }`}
                      >
                        AI Severity: {report.ai_vision_analysis.severity_label.split('—')[0].trim()}
                      </span>
                      {hasSatelliteMatch && (
                        <span 
                          className={`px-2 py-0.5 rounded-full border flex items-center gap-1 font-bold ${
                            isDark ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>🛰️ Satellite Match ({report.ai_vision_analysis.satellite_correlation?.correlation_confidence_percent}%)</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metadata Row: GPS, Photo Indicator */}
                  <div className="pt-2 border-t border-zinc-500/20 flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-400 gap-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                      <span>{report.latitude}°N, {report.longitude}°E</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(`${report.latitude}, ${report.longitude}`, 'gps', report.report_id);
                        }}
                        className={`text-[9px] px-1 py-0.2 rounded border ${
                          isDark ? 'bg-[#020817] border-[#0e2a47] text-zinc-400' : 'bg-slate-100 border-[#cbd5e1] text-zinc-600'
                        }`}
                        title="Copy GPS"
                      >
                        {copiedGps === report.report_id ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {report.photo_reference && (
                        <span 
                          className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded border ${
                            isDark ? 'text-[#18c9e8] bg-[#073b55]/50 border-[#18c9e8]/40' : 'text-[#0284c7] bg-sky-50 border-sky-200'
                          }`}
                        >
                          <ImageIcon className="w-3 h-3" />
                          <span>Photo Attached</span>
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-400 group-hover:text-cyan-500 flex items-center gap-0.5 transition-colors">
                        <span>Inspect</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div 
              className={`flex items-center justify-between p-3.5 rounded-2xl border backdrop-blur-xl text-xs font-mono ${
                isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-slate-50 border-[#cbd5e1]'
              }`}
            >
              <span className="text-zinc-500">
                Page {page} of {totalPages} ({total} Submissions)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange(Math.max(page - 1, 1))}
                  disabled={page <= 1 || isLoading}
                  className={`p-1.5 rounded-lg border disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed ${
                    isDark ? 'bg-[#020817] border-[#0e2a47] text-zinc-300' : 'bg-white border-[#cbd5e1] text-zinc-700'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange(Math.min(page + 1, totalPages))}
                  disabled={page >= totalPages || isLoading}
                  className={`p-1.5 rounded-lg border disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed ${
                    isDark ? 'bg-[#020817] border-[#0e2a47] text-zinc-300' : 'bg-white border-[#cbd5e1] text-zinc-700'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Detailed Incident Inspector */}
        <div className="lg:col-span-5 xl:col-span-5 sticky top-24 space-y-4">
          {selectedReport ? (
            <div 
              className={`rounded-2xl border p-5 space-y-4 backdrop-blur-xl shadow-xl font-mono text-xs ${
                isDark ? 'bg-[#020817] border-[#0e2a47] text-[#f8fafc]' : 'bg-white/95 border-[#cddce9] text-[#071d3d] shadow-[0_8px_30px_rgba(9,30,58,0.06)]'
              }`}
            >
              {/* Header */}
              <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-[#0e2a47]' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                      isDark ? 'bg-[#073b55] border-[#18c9e8]/40 text-[#18c9e8]' : 'bg-[#dceaf4] border-[#cbd5e1] text-[#0284c7]'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Incident Inspector
                    </h3>
                    <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-[#486581]'}`}>
                      ID: {selectedReport.report_id.slice(0, 18)}...
                    </p>
                  </div>
                </div>

                <span 
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    selectedReport.status === 'verified'
                      ? isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                      : selectedReport.status === 'rejected'
                      ? isDark ? 'bg-rose-950 text-rose-300 border-rose-700' : 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs'
                      : isDark ? 'bg-amber-950 text-amber-300 border-amber-700' : 'bg-amber-50 text-amber-700 border-amber-300 shadow-xs'
                  }`}
                >
                  {selectedReport.status}
                </span>
              </div>

              {/* Photo Evidence */}
              {selectedReport.photo_reference && (
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide block font-bold">
                    Field Photographic Evidence
                  </span>
                  <div className="relative rounded-xl overflow-hidden border border-zinc-500/20 max-h-48 flex items-center justify-center bg-black/60 shadow-inner">
                    <img
                      src={selectedReport.photo_reference}
                      alt="Field evidence"
                      className="max-h-48 w-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] text-[#18c9e8] border border-zinc-700">
                      Geotagged Photo
                    </div>
                  </div>
                </div>
              )}

              {/* Geospatial Coordinates Card */}
              <div 
                className={`p-3 rounded-xl border space-y-1 ${
                  isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-[#f4f8fc] border-[#d2e1ee]'
                }`}
              >
                <span className="text-[10px] text-zinc-500 uppercase tracking-wide block font-bold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cyan-500" />
                  <span>Geospatial Coordinates</span>
                </span>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span>{selectedReport.latitude}° N, {selectedReport.longitude}° E</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(`${selectedReport.latitude}, ${selectedReport.longitude}`, 'gps', 'inspector')}
                    className={`px-2 py-0.5 rounded border text-[10px] cursor-pointer ${
                      isDark ? 'bg-[#073b55] border-[#18c9e8]/40 text-[#18c9e8]' : 'bg-white border-[#cbd5e1] text-[#0284c7]'
                    }`}
                  >
                    {copiedGps === 'inspector' ? 'Copied GPS' : 'Copy GPS'}
                  </button>
                </div>
              </div>

              {/* Citizen Incident Narrative */}
              <div 
                className={`p-3 rounded-xl border space-y-1 ${
                  isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-slate-50 border-[#cbd5e1]'
                }`}
              >
                <span className="text-[10px] text-zinc-500 uppercase tracking-wide block font-bold">
                  Community Description
                </span>
                <p className="text-zinc-500 text-[11px] leading-relaxed font-sans">
                  {selectedReport.description}
                </p>
              </div>

              {/* Reviewer Triage Actions */}
              <div 
                className={`p-3.5 rounded-xl border space-y-2.5 ${
                  isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-slate-50 border-[#cbd5e1]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Reviewer Desk Triage</span>
                  </span>
                  <button
                    type="button"
                    onClick={onOpenReviewerDrawer}
                    className="text-[10px] text-cyan-500 hover:underline cursor-pointer"
                  >
                    Open Drawer
                  </button>
                </div>

                {actionFeedback && (
                  <div className={`p-2 rounded-lg border text-[10px] flex items-center gap-1.5 ${
                    actionFeedback.type === 'success' 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                  }`}>
                    {actionFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                    )}
                    <span>{actionFeedback.message}</span>
                  </div>
                )}

                <textarea
                  rows={2}
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Inspector audit notes (e.g. Ground verified via Paithan dam field patrol)..."
                  className={`w-full rounded-lg p-2 text-[11px] focus:outline-none border font-sans ${
                    isDark 
                      ? 'bg-[#020817] border-[#0e2a47] text-white placeholder-zinc-600 focus:border-[#18c9e8]' 
                      : 'bg-white border-[#cbd5e1] text-slate-900 placeholder-zinc-400 focus:border-[#0284c7]'
                  }`}
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickStatusUpdate('verified')}
                    disabled={isUpdatingStatus}
                    className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verify Incident</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickStatusUpdate('rejected')}
                    disabled={isUpdatingStatus}
                    className="py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Reject / Noise</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className={`rounded-2xl border p-8 text-center space-y-3 font-mono ${
                isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-slate-50 border-[#cbd5e1]'
              }`}
            >
              <ShieldCheck className="w-8 h-8 text-zinc-400 mx-auto" />
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wide">
                No Incident Selected
              </h4>
              <p className="text-[11px] text-zinc-400">
                Click on any report in the feed to inspect coordinates, evidence photography, AI classification, and trigger reviewer verification.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
