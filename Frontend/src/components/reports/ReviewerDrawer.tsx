import React, { useState } from 'react';
import { 
  KeyRound, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { ReportResponse, ReportStatus } from '../../types';

interface ReviewerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reviewerKey: string;
  onChangeReviewerKey: (key: string) => void;
  selectedReport: ReportResponse | null;
  onReportUpdated: () => void;
}

export const ReviewerDrawer: React.FC<ReviewerDrawerProps> = ({
  isOpen,
  onClose,
  reviewerKey,
  onChangeReviewerKey,
  selectedReport,
  onReportUpdated,
}) => {
  const [reviewerNotes, setReviewerNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleUpdateStatus = async (newStatus: ReportStatus) => {
    if (!selectedReport) return;
    if (!reviewerKey.trim()) {
      setFeedback({ type: 'error', message: 'Reviewer API Key is required.' });
      return;
    }

    setIsUpdating(true);
    setFeedback(null);
    try {
      await api.updateReportStatus(
        selectedReport.report_id,
        { status: newStatus, reviewer_notes: reviewerNotes.trim() || undefined },
        reviewerKey
      );
      setFeedback({ type: 'success', message: `Report transitioned to ${newStatus}.` });
      setReviewerNotes('');
      onReportUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update report status.' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in select-none font-['DM_Sans',sans-serif]">
      <div className="w-full max-w-md h-full bg-[#020614] border-l border-sky-950 p-6 flex flex-col justify-between overflow-y-auto space-y-4">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-sky-950">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-300">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Reviewer Operations Desk</h3>
                <p className="text-[11px] font-mono text-zinc-400">Authenticated Triage</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-sky-950 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Reviewer API Key Input */}
          <div className="p-3.5 rounded-xl bg-[#030919] border border-sky-950 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-zinc-300 flex items-center gap-1.5 font-bold">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reviewer Header Key</span>
              </label>
              <button
                type="button"
                onClick={() => onChangeReviewerKey('sindhu-reviewer-2026')}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 hover:text-white cursor-pointer"
              >
                Auto-fill Demo Key
              </button>
            </div>
            <input
              type="text"
              value={reviewerKey}
              onChange={(e) => onChangeReviewerKey(e.target.value)}
              placeholder="sindhu-reviewer-2026"
              className="w-full bg-[#01040f] border border-sky-950 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
            />
            <p className="text-[10px] text-zinc-400 font-mono flex items-center justify-between">
              <span>Header: <code className="text-cyan-300">X-Reviewer-API-Key</code></span>
              <span className="text-emerald-400">Default: sindhu-reviewer-2026</span>
            </p>
          </div>

          {feedback && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              feedback.type === 'success' 
                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200' 
                : 'bg-rose-950/30 border-rose-800/40 text-rose-200'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Active Target Report */}
          {selectedReport ? (
            <div className="p-4 rounded-xl bg-[#030919] border border-sky-950 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-sky-950 text-xs font-mono">
                <span className="text-zinc-400 truncate max-w-[200px]">ID: {selectedReport.report_id}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  selectedReport.status === 'verified'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : selectedReport.status === 'rejected'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {selectedReport.status}
                </span>
              </div>

              <div className="text-xs text-zinc-300 leading-relaxed max-h-32 overflow-y-auto">
                {selectedReport.description}
              </div>

              <div className="text-[10px] font-mono text-zinc-500">
                Coordinates: {selectedReport.latitude}°N, {selectedReport.longitude}°E
              </div>

              {/* Citizen Photo Preview */}
              {selectedReport.photo_reference && (
                <div className="rounded-xl overflow-hidden border border-sky-900/60 bg-black/40">
                  <img
                    src={selectedReport.photo_reference}
                    alt="Citizen Debris Evidence"
                    className="w-full max-h-40 object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="p-1.5 text-[9px] font-mono text-zinc-400 text-center bg-[#01040f]">
                    📸 Citizen Field Evidence Photo
                  </div>
                </div>
              )}

              {/* AI Computer Vision & Satellite Correlation Analysis */}
              {selectedReport.ai_vision_analysis && (
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#021330] to-[#010817] border border-cyan-500/40 space-y-2.5 font-mono text-[10px]">
                  <div className="flex items-center justify-between border-b border-sky-900 pb-1.5">
                    <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      AI VISION DEBRIS INSPECTION
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-700 text-cyan-200 text-[9px]">
                      {selectedReport.ai_vision_analysis.severity_label.split('—')[0].trim()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400">
                      <span>Litter Density:</span>
                      <span className="text-white font-bold">~{selectedReport.ai_vision_analysis.estimated_litter_density_items_m2} items/m²</span>
                    </div>
                  </div>

                  {/* Polymer Breakdown Bars */}
                  <div className="space-y-1.5 pt-1 border-t border-sky-950">
                    <span className="text-zinc-400 font-bold text-[9px] uppercase tracking-wide block">
                      Polymer Classification Breakdown:
                    </span>
                    {selectedReport.ai_vision_analysis.polymer_breakdown.map((poly, pIdx) => (
                      <div key={pIdx} className="space-y-0.5">
                        <div className="flex justify-between text-[9px]">
                          <span className="text-zinc-300 truncate max-w-[200px]">{poly.polymer}</span>
                          <span className="font-bold text-white">{poly.confidence_percent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${poly.confidence_percent}%`, backgroundColor: poly.color_hex }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Satellite Ground-Truth Correlation */}
                  {selectedReport.ai_vision_analysis.is_satellite_correlated && selectedReport.ai_vision_analysis.satellite_correlation ? (
                    <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/50 space-y-1 text-emerald-200">
                      <div className="flex items-center justify-between font-bold text-[9px]">
                        <span className="text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          SATELLITE GROUND-TRUTH CONFIRMED
                        </span>
                        <span className="text-emerald-400">
                          {selectedReport.ai_vision_analysis.satellite_correlation.correlation_confidence_percent}% MATCH
                        </span>
                      </div>
                      <p className="text-[9px] leading-tight text-zinc-300">
                        Matches Satellite Hotspot #{selectedReport.ai_vision_analysis.satellite_correlation.matched_hotspot_id} located {selectedReport.ai_vision_analysis.satellite_correlation.distance_meters}m offshore.
                      </p>
                      <div className="flex justify-between text-[9px] text-zinc-400 pt-0.5">
                        <span>Class: {selectedReport.ai_vision_analysis.satellite_correlation.marida_class}</span>
                        <span>FDI: +{selectedReport.ai_vision_analysis.satellite_correlation.fdi_value}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-slate-900 border border-sky-950 text-zinc-400 text-[9px]">
                      Field discovery located &gt; 2.5km outside active orbital anomaly polygons.
                    </div>
                  )}
                </div>
              )}

              {/* Reviewer Internal Notes */}
              <div className="space-y-1.5 pt-2 border-t border-sky-950">
                <label className="text-[10px] font-mono text-zinc-400 block uppercase">
                  Internal Verification Notes
                </label>
                <textarea
                  rows={3}
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Record satellite anomaly cross-check notes or field inspection confirmation..."
                  className="w-full bg-[#01040f] border border-sky-950 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Status Transition Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => handleUpdateStatus('verified')}
                  disabled={isUpdating || selectedReport.status === 'verified'}
                  className="py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/50 hover:bg-emerald-500/30 text-emerald-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verify Incident</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus('rejected')}
                  disabled={isUpdating || selectedReport.status === 'rejected'}
                  className="py-2 rounded-xl bg-rose-500/20 border border-rose-500/50 hover:bg-rose-500/30 text-rose-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reject Incident</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs font-mono text-zinc-500 border border-sky-950 rounded-xl bg-[#030919]">
              Select a report from the incident feed to review and triage.
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-sky-950 text-[10px] font-mono text-zinc-500">
          Enforces server-side status validation lifecycle (pending → verified / rejected).
        </div>
      </div>
    </div>
  );
};
