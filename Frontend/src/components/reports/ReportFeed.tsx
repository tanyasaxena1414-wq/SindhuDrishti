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
  ExternalLink,
  SlidersHorizontal,
  Image as ImageIcon,
  Search,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  Radio,
  Eye,
  KeyRound,
  Send,
  PlusCircle,
  Filter
} from 'lucide-react';
import { ReportResponse, ReportStatus, DashboardStats } from '../../types';

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
      setActionFeedback({ type: 'success', message: `Report successfully marked as ${newStatus}.` });
      setReviewerNotes('');
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Status transition failed.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-5 font-['DM_Sans',sans-serif]">
      {/* Command & Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-[#03091c]/80 border border-sky-950/80 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Status Filter Tabs with Live Badges */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#020512] border border-sky-950 p-1 rounded-xl text-xs font-mono">
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
                    ? 'bg-sky-900/60 text-cyan-300 border border-cyan-700/60 font-bold shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                    : 'text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                <span>{s}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60' : 'bg-slate-900 text-zinc-500'
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
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by ID, location, details..."
              className="w-full bg-[#020512] border border-sky-950 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Quick Toggle: Satellite Matched */}
          <button
            type="button"
            onClick={() => setSatelliteOnly(!satelliteOnly)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono transition-colors cursor-pointer ${
              satelliteOnly
                ? 'bg-emerald-950/80 border-emerald-600/80 text-emerald-300'
                : 'bg-[#020512] border-sky-950 text-zinc-400 hover:text-white'
            }`}
            title="Filter reports with confirmed Sentinel-2 satellite correlation"
          >
            <Radio className={`w-3 h-3 ${satelliteOnly ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>Satellite Matched</span>
          </button>

          {/* Quick Toggle: With Photo */}
          <button
            type="button"
            onClick={() => setPhotoOnly(!photoOnly)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono transition-colors cursor-pointer ${
              photoOnly
                ? 'bg-cyan-950/80 border-cyan-600/80 text-cyan-300'
                : 'bg-[#020512] border-sky-950 text-zinc-400 hover:text-white'
            }`}
            title="Filter reports that include evidence photos"
          >
            <ImageIcon className="w-3 h-3" />
            <span>With Photo</span>
          </button>
        </div>
      </div>

      {/* Main Master-Detail Inspection Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Side: Incident Feed List (7 cols on lg, 6 cols on xl) */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-3.5">
          {isLoading ? (
            <div className="p-16 text-center text-xs font-mono text-cyan-400 animate-pulse bg-[#02071a]/70 rounded-2xl border border-sky-950 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <span>Querying verified citizen pollution logs from database...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            /* Redesigned High-Impact Empty State */
            <div className="p-8 sm:p-12 text-center bg-[#02071a]/80 rounded-2xl border border-sky-950/80 backdrop-blur-xl space-y-5 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                <FileText className="w-8 h-8" />
              </div>
              
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base font-bold text-white">
                  {statusFilter === 'all' 
                    ? 'No Incident Reports Logged Yet' 
                    : `No ${statusFilter.toUpperCase()} Incidents In This Queue`}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Community field observations provide direct ground-truth calibration for our Sentinel-2 satellite plastic debris classification engine.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {onOpenReportModal && (
                  <button
                    type="button"
                    onClick={onOpenReportModal}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400 to-[#6095f6] text-slate-950 font-bold text-xs hover:from-sky-300 transition-all shadow-[0_0_15px_rgba(96,149,246,0.3)] cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Log First Community Incident</span>
                  </button>
                )}
                {(statusFilter !== 'all' || searchQuery || satelliteOnly || photoOnly) && (
                  <button
                    type="button"
                    onClick={() => {
                      onStatusFilterChange('all');
                      setSearchQuery('');
                      setSatelliteOnly(false);
                      setPhotoOnly(false);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#030919] border border-sky-900/60 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Reset Active Filters
                  </button>
                )}
              </div>

              {/* Educational Guide Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-sky-950/60 text-left font-mono">
                <div className="p-3 rounded-xl bg-[#03091e]/60 border border-sky-950 space-y-1">
                  <span className="text-[10px] text-cyan-300 font-bold block">1. GPS Tagging</span>
                  <p className="text-[10px] text-zinc-400 leading-snug">
                    Pinpoint reservoir coordinates for field cleanup routing.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#03091e]/60 border border-sky-950 space-y-1">
                  <span className="text-[10px] text-emerald-300 font-bold block">2. Satellite Match</span>
                  <p className="text-[10px] text-zinc-400 leading-snug">
                    AI aligns citizen logs with Sentinel-2 multi-spectral passes.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#03091e]/60 border border-sky-950 space-y-1">
                  <span className="text-[10px] text-blue-300 font-bold block">3. Reviewer Triage</span>
                  <p className="text-[10px] text-zinc-400 leading-snug">
                    Authenticated validation confirms plastic debris before dispatch.
                  </p>
                </div>
              </div>
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
                  className={`p-4 rounded-2xl bg-[#02071a]/90 border transition-all duration-200 cursor-pointer shadow-lg space-y-3 group ${
                    isSelected
                      ? 'border-cyan-400/90 bg-[#030e2c]/95 shadow-[0_0_25px_rgba(56,189,248,0.2)] ring-1 ring-cyan-400/60'
                      : 'border-sky-950/80 hover:border-sky-800/80 hover:bg-[#03091e]/90'
                  }`}
                >
                  {/* Card Header: Status, ID, Timestamp */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                        report.status === 'verified'
                          ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80 shadow-[0_0_8px_rgba(52,211,153,0.2)]'
                          : report.status === 'rejected'
                          ? 'bg-rose-950/90 text-rose-300 border-rose-700/80'
                          : 'bg-amber-950/90 text-amber-300 border-amber-700/80 shadow-[0_0_8px_rgba(251,191,36,0.2)]'
                      }`}>
                        {report.status}
                      </span>

                      <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-400">
                        <span className="text-zinc-500">ID:</span>
                        <span className="text-white font-bold truncate max-w-[120px] sm:max-w-[180px]">
                          {report.report_id}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(report.report_id, 'id', report.report_id);
                          }}
                          className="p-1 rounded text-zinc-500 hover:text-cyan-300 transition-colors"
                          title="Copy Report ID"
                        >
                          {copiedId === report.report_id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1 whitespace-nowrap">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{report.submitted_at.replace('T', ' ').slice(0, 16)} UTC</span>
                    </span>
                  </div>

                  {/* Incident Description */}
                  <p className="text-xs text-zinc-200 leading-relaxed line-clamp-2">
                    {report.description}
                  </p>

                  {/* AI Vision & Satellite Correlation Badges */}
                  {report.ai_vision_analysis && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                        AI Severity: {report.ai_vision_analysis.severity_label.split('—')[0].trim()}
                      </span>
                      {hasSatelliteMatch && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-600/80 text-emerald-300 flex items-center gap-1 font-bold shadow-[0_0_8px_rgba(52,211,153,0.15)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>🛰️ Satellite Match ({report.ai_vision_analysis.satellite_correlation?.correlation_confidence_percent}%)</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metadata Row: GPS, Photo Indicator, Reviewer Flag */}
                  <div className="pt-2 border-t border-sky-950/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-400 gap-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{report.latitude}°N, {report.longitude}°E</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(`${report.latitude}, ${report.longitude}`, 'gps', report.report_id);
                        }}
                        className="text-[9px] px-1 py-0.2 rounded bg-slate-900 border border-sky-950 text-zinc-400 hover:text-cyan-300"
                        title="Copy GPS"
                      >
                        {copiedGps === report.report_id ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {report.photo_reference && (
                        <span className="text-[10px] text-cyan-300 flex items-center gap-1 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
                          <ImageIcon className="w-3 h-3" />
                          <span>Photo Attached</span>
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-500 group-hover:text-cyan-400 flex items-center gap-0.5 transition-colors">
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
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#03091c]/80 border border-sky-950/80 backdrop-blur-xl text-xs font-mono">
              <span className="text-zinc-400">
                Page {page} of {totalPages} ({total} Submissions)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange(Math.max(page - 1, 1))}
                  disabled={page <= 1 || isLoading}
                  className="p-1.5 rounded-lg bg-[#020512] border border-sky-950 text-zinc-300 hover:text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
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

        {/* Right Side: Detailed Incident Inspector & Reviewer Desk (5 cols on lg/xl) */}
        <div className="lg:col-span-5 xl:col-span-5 sticky top-24 space-y-4">
          {selectedReport ? (
            <div className="rounded-2xl bg-[#02071a]/95 border border-sky-900/60 p-5 space-y-4 backdrop-blur-xl shadow-2xl font-mono text-xs">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-sky-950">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Incident Inspector
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      ID: {selectedReport.report_id.slice(0, 18)}...
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  selectedReport.status === 'verified'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : selectedReport.status === 'rejected'
                    ? 'bg-rose-950 text-rose-300 border-rose-700'
                    : 'bg-amber-950 text-amber-300 border-amber-700'
                }`}>
                  {selectedReport.status}
                </span>
              </div>

              {/* Photo Evidence (if attached) */}
              {selectedReport.photo_reference && (
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wide block font-bold">
                    Field Photographic Evidence
                  </span>
                  <div className="relative rounded-xl overflow-hidden border border-sky-900/50 max-h-48 flex items-center justify-center bg-black/60 shadow-inner">
                    <img
                      src={selectedReport.photo_reference}
                      alt="Field evidence"
                      className="max-h-48 w-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] text-cyan-300 border border-sky-900">
                      Geotagged Photo
                    </div>
                  </div>
                </div>
              )}

              {/* Geospatial Coordinates Card */}
              <div className="p-3 rounded-xl bg-[#03091e]/80 border border-sky-950 space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wide block font-bold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>Geospatial Coordinates</span>
                </span>
                <div className="flex items-center justify-between text-zinc-200 text-[11px] pt-1">
                  <span>{selectedReport.latitude}° N, {selectedReport.longitude}° E</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(`${selectedReport.latitude}, ${selectedReport.longitude}`, 'gps', 'inspector')}
                    className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 hover:text-white text-[10px] cursor-pointer"
                  >
                    {copiedGps === 'inspector' ? 'Copied GPS' : 'Copy GPS'}
                  </button>
                </div>
              </div>

              {/* Citizen Incident Narrative */}
              <div className="p-3 rounded-xl bg-[#03091e]/80 border border-sky-950 space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wide block font-bold">
                  Community Description
                </span>
                <p className="text-zinc-300 text-[11px] leading-relaxed font-sans">
                  {selectedReport.description}
                </p>
              </div>

              {/* AI Vision & Satellite Analysis Breakdown */}
              {selectedReport.ai_vision_analysis && (
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#031133] to-[#02091f] border border-cyan-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>AI Multi-Spectral Analysis</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {selectedReport.ai_vision_analysis.model_version}
                    </span>
                  </div>

                  <div className="space-y-1 text-[10px] text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Severity Assessment:</span>
                      <span className="text-amber-300 font-bold">
                        {selectedReport.ai_vision_analysis.severity_label}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-zinc-400">Estimated Litter Density:</span>
                      <span className="text-cyan-300 font-bold">
                        ~{selectedReport.ai_vision_analysis.estimated_litter_density_items_m2} items / m²
                      </span>
                    </div>
                  </div>

                  {/* Polymers */}
                  {selectedReport.ai_vision_analysis.polymer_breakdown?.length > 0 && (
                    <div className="pt-2 border-t border-sky-950/70 space-y-1">
                      <span className="text-[9px] text-zinc-400 block font-bold">Detected Material Breakdown:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedReport.ai_vision_analysis.polymer_breakdown.map((p, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] px-2 py-0.5 rounded-full bg-slate-900 border border-sky-800 text-zinc-200"
                          >
                            {p.polymer} ({p.confidence_percent}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sentinel-2 Correlation */}
                  {selectedReport.ai_vision_analysis.satellite_correlation && (
                    <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-700/50 text-[10px] space-y-1">
                      <div className="flex items-center justify-between text-emerald-300 font-bold">
                        <span>🛰️ Sentinel-2 Matched Hotspot:</span>
                        <span>{selectedReport.ai_vision_analysis.satellite_correlation.matched_hotspot_id}</span>
                      </div>
                      <div className="text-zinc-300 text-[9px] flex justify-between">
                        <span>Proximity: {selectedReport.ai_vision_analysis.satellite_correlation.distance_meters}m</span>
                        <span>Correlation: {selectedReport.ai_vision_analysis.satellite_correlation.correlation_confidence_percent}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reviewer Triage Actions */}
              <div className="p-3.5 rounded-xl bg-[#03091e]/90 border border-sky-950 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Reviewer Desk Triage</span>
                  </span>
                  <button
                    type="button"
                    onClick={onOpenReviewerDrawer}
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    Open Drawer
                  </button>
                </div>

                {actionFeedback && (
                  <div className={`p-2 rounded-lg border text-[10px] flex items-center gap-1.5 ${
                    actionFeedback.type === 'success' 
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' 
                      : 'bg-rose-950/40 border-rose-800 text-rose-300'
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
                  className="w-full bg-[#020512] border border-sky-950 rounded-lg p-2 text-[11px] text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-sans"
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickStatusUpdate('verified')}
                    disabled={isUpdatingStatus}
                    className="py-1.5 px-3 rounded-lg bg-emerald-950 border border-emerald-700 hover:bg-emerald-900 text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Verify Incident</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickStatusUpdate('rejected')}
                    disabled={isUpdatingStatus}
                    className="py-1.5 px-3 rounded-lg bg-rose-950 border border-rose-700 hover:bg-rose-900 text-rose-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-3 h-3 text-rose-400" />
                    <span>Reject / Noise</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Nothing Selected State */
            <div className="rounded-2xl bg-[#02071a]/70 border border-sky-950/80 p-8 text-center space-y-3 font-mono">
              <Eye className="w-8 h-8 text-zinc-600 mx-auto" />
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                No Incident Selected
              </h4>
              <p className="text-[11px] text-zinc-500">
                Click on any report in the feed to inspect coordinates, evidence photography, AI classification, and trigger reviewer verification.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
