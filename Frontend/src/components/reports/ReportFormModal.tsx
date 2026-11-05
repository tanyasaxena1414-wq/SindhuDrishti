import React, { useState } from 'react';
import { X, Send, MapPin, Image, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { ReportCreate } from '../../types';

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted: () => void;
}

export const ReportFormModal: React.FC<ReportFormModalProps> = ({
  isOpen,
  onClose,
  onReportSubmitted,
}) => {
  const [formData, setFormData] = useState<ReportCreate>({
    latitude: '19.4935',
    longitude: '75.3850',
    description: '',
    photo_reference: undefined,
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, photo_reference: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleUseSamplePhoto = () => {
    setFormData((prev) => ({ ...prev, photo_reference: '/assets/story/01_plastic_surface.png' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (formData.description.trim().length < 10) {
      setErrorMsg('Description must be at least 10 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createReport(formData);
      setSuccessMsg('Pollution incident report successfully submitted.');
      setTimeout(() => {
        setFormData({
          latitude: '19.4935',
          longitude: '75.3850',
          description: '',
          photo_reference: undefined,
        });
        onReportSubmitted();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit pollution report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none font-['DM_Sans',sans-serif]">
      <div className="w-full max-w-lg bg-[#02071a] border border-sky-800/60 rounded-2xl p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sky-950">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-300">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Log Citizen Pollution Report</h3>
              <p className="text-[11px] font-mono text-zinc-400">Community Observation Intake</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-sky-950 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                Latitude (-90 to 90) *
              </label>
              <input
                type="text"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full bg-[#030919] border border-sky-950 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                Longitude (-180 to 180) *
              </label>
              <input
                type="text"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full bg-[#030919] border border-sky-950 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-mono text-zinc-400 block mb-1">
              Incident Description (min 10 characters) *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe visible debris accumulation, shoreline condition, water discoloration..."
              className="w-full bg-[#030919] border border-sky-950 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 leading-relaxed"
            />
          </div>

          {/* Photo Upload & Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-zinc-300 font-bold flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-cyan-400" />
                <span>Field Evidence Photo</span>
              </label>
              <button
                type="button"
                onClick={handleUseSamplePhoto}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 hover:text-white cursor-pointer"
              >
                Use Sample Photo
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#030919] border border-sky-950 space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-zinc-400 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-mono file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900 cursor-pointer"
              />

              {formData.photo_reference && (
                <div className="relative mt-2 rounded-lg overflow-hidden border border-sky-900/60 max-h-36 flex items-center justify-center bg-black/50">
                  <img
                    src={formData.photo_reference}
                    alt="Preview"
                    className="max-h-36 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, photo_reference: undefined })}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/80 text-zinc-300 hover:text-white"
                    title="Remove Photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-sky-950">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#030919] border border-sky-950 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-400 to-[#6095f6] text-slate-950 font-bold hover:from-sky-300 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-lg"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
