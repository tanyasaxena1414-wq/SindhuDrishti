import React, { useState } from 'react';
import { 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { ReportResponse, ReportStatus } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface ReviewerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reviewerKey: string;
  onChangeReviewerKey: (key: string) => void;
  selectedReport?: ReportResponse | null;
  report?: ReportResponse | null;
  onReportUpdated?: () => void;
  onStatusUpdated?: () => void;
}

export const ReviewerDrawer: React.FC<ReviewerDrawerProps> = ({
  isOpen,
  onClose,
  reviewerKey,
  onChangeReviewerKey,
  selectedReport,
  report,
  onReportUpdated,
  onStatusUpdated,
}) => {
  const { isDark } = useTheme();
  const currentReport = selectedReport || report;
  const notifyUpdated = onReportUpdated || onStatusUpdated || (() => {});

  const [reviewerNotes, setReviewerNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleUpdateStatus = async (newStatus: ReportStatus) => {
    if (!currentReport) return;
    if (!reviewerKey.trim()) {
      setFeedback({ type: 'error', message: 'Reviewer API Key is required.' });
      return;
    }

    setIsUpdating(true);
    setFeedback(null);
    try {
      await api.updateReportStatus(
        currentReport.report_id,
        { status: newStatus, reviewer_notes: reviewerNotes.trim() || undefined },
        reviewerKey
      );
      setFeedback({ type: 'success', message: `Report transitioned to ${newStatus}.` });
      setReviewerNotes('');
      notifyUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update report status.' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in select-none font-sans">
      <div 
        className={`w-full max-w-md h-full p-6 flex flex-col justify-between overflow-y-auto space-y-4 border-l ${
          isDark ? 'bg-[#020817] border-[#0e2a47] text-[#f8fafc]' : 'bg-white border-[#cbd5e1] text-[#0f172a]'
        }`}
      >
        <div className="space-y-5">
          {/* Header */}
          <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-[#0e2a47]' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <div 
                className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  isDark ? 'bg-[#073b55] border-[#18c9e8]/50 text-[#18c9e8]' : 'bg-[#dceaf4] border-[#cbd5e1] text-[#0284c7]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Reviewer Operations Desk</h3>
                <p className="text-[11px] font-mono text-zinc-400">Authenticated Triage</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-black hover:bg-black/5'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Reviewer API Key Input */}
          <div 
            className={`p-3.5 rounded-xl border space-y-2 ${
              isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-slate-50 border-[#cbd5e1]'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono flex items-center gap-1.5 font-bold">
                <KeyRound className={`w-3.5 h-3.5 ${isDark ? 'text-[#18c9e8]' : 'text-[#0284c7]'}`} />
                <span>Reviewer Header Key</span>
              </label>
              <button
                type="button"
                onClick={() => onChangeReviewerKey('sindhu-reviewer-2026')}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border cursor-pointer ${
                  isDark ? 'bg-[#073b55] border-[#18c9e8]/40 text-[#18c9e8]' : 'bg-white border-[#cbd5e1] text-[#0284c7]'
                }`}
              >
                Auto-fill Key
              </button>
            </div>
            <input
              type="text"
              value={reviewerKey}
              onChange={(e) => onChangeReviewerKey(e.target.value)}
              placeholder="sindhu-reviewer-2026"
              className={`w-full rounded-lg px-3 py-2 text-xs font-mono focus:outline-none border ${
                isDark ? 'bg-[#020817] border-[#0e2a47] text-white focus:border-[#18c9e8]' : 'bg-white border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
              }`}
            />
            <p className="text-[10px] text-zinc-400 font-mono flex items-center justify-between">
              <span>Header: <code>X-Reviewer-API-Key</code></span>
              <span className="text-emerald-500 font-semibold">Demo: sindhu-reviewer-2026</span>
            </p>
          </div>

          {feedback && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              feedback.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Target Report Details */}
          {currentReport ? (
            <div 
              className={`p-3.5 rounded-xl border space-y-2 text-xs font-mono ${
                isDark ? 'bg-[#051324] border-[#0e2a47]' : 'bg-slate-50 border-[#cbd5e1]'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Selected Report:</span>
                <span className="font-bold">{currentReport.report_id.slice(0, 14)}...</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Current Status:</span>
                <span className="font-bold uppercase text-cyan-500">{currentReport.status}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Coordinates:</span>
                <span>{currentReport.latitude}°N, {currentReport.longitude}°E</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 font-mono italic">
              Select an incident from the feed to update its status.
            </p>
          )}

          {/* Audit Notes Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-zinc-500 font-bold block">
              Auditor Triage Notes
            </label>
            <textarea
              rows={3}
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder="Record rationale for verification or noise exclusion..."
              className={`w-full rounded-xl p-3 text-xs focus:outline-none border ${
                isDark ? 'bg-[#051324] border-[#0e2a47] text-white focus:border-[#18c9e8]' : 'bg-slate-50 border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
              }`}
            />
          </div>

          {/* Decision Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleUpdateStatus('verified')}
              disabled={isUpdating || !currentReport}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify & Confirm</span>
            </button>

            <button
              type="button"
              onClick={() => handleUpdateStatus('rejected')}
              disabled={isUpdating || !currentReport}
              className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject / False Log</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-500/20 text-center">
          <p className="text-[10px] text-zinc-400 font-mono">
            Audited status changes synchronize directly with SQLite store.
          </p>
        </div>
      </div>
    </div>
  );
};
