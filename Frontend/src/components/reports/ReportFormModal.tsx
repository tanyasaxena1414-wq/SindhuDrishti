import React, { useState } from 'react';
import { X, Send, MapPin, Image, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { ReportCreate } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted: () => void;
}

const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const ReportFormModal: React.FC<ReportFormModalProps> = ({
  isOpen,
  onClose,
  onReportSubmitted,
}) => {
  const { isDark } = useTheme();
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 15MB.');
      return;
    }

    try {
      const compressed = await compressImage(file);
      setFormData((prev) => ({ ...prev, photo_reference: compressed }));
    } catch {
      setErrorMsg('Could not process selected image.');
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none font-sans">
      <div 
        className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto border ${
          isDark ? 'bg-[#020817] border-[#0e2a47] text-[#f8fafc]' : 'bg-white border-[#cbd5e1] text-[#0f172a]'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-[#0e2a47]' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <div 
              className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                isDark ? 'bg-[#073b55] border-[#18c9e8]/50 text-[#18c9e8]' : 'bg-[#dceaf4] border-[#cbd5e1] text-[#0284c7]'
              }`}
            >
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Log Citizen Pollution Report</h3>
              <p className="text-[11px] font-mono text-zinc-400">Community Observation Intake</p>
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

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 flex items-start gap-2 max-h-32 overflow-y-auto">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="break-words leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-zinc-500 block mb-1">
                Latitude (-90 to 90) *
              </label>
              <input
                type="text"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className={`w-full rounded-xl px-3 py-2 font-mono focus:outline-none border ${
                  isDark ? 'bg-[#051324] border-[#0e2a47] text-white focus:border-[#18c9e8]' : 'bg-slate-50 border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
                }`}
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-zinc-500 block mb-1">
                Longitude (-180 to 180) *
              </label>
              <input
                type="text"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className={`w-full rounded-xl px-3 py-2 font-mono focus:outline-none border ${
                  isDark ? 'bg-[#051324] border-[#0e2a47] text-white focus:border-[#18c9e8]' : 'bg-slate-50 border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
                }`}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-mono text-zinc-500 block mb-1">
              Incident Description (min 10 characters) *
            </label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Dense plastic bottle cluster near Godavari reservoir shoreline intake..."
              className={`w-full rounded-xl p-3 focus:outline-none border ${
                isDark ? 'bg-[#051324] border-[#0e2a47] text-white focus:border-[#18c9e8]' : 'bg-slate-50 border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
              }`}
            />
          </div>

          {/* Photo Upload & Sample */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                <Image className="w-3.5 h-3.5 text-cyan-500" />
                <span>Field Evidence Photo (Optional)</span>
              </label>
              <button
                type="button"
                onClick={handleUseSamplePhoto}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border cursor-pointer ${
                  isDark ? 'bg-[#073b55] border-[#18c9e8]/40 text-[#18c9e8]' : 'bg-slate-100 border-[#cbd5e1] text-[#0284c7]'
                }`}
              >
                Use Sample Photo
              </button>
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={`w-full rounded-xl p-2 font-mono text-[11px] border file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold ${
                isDark 
                  ? 'bg-[#051324] border-[#0e2a47] text-zinc-300 file:bg-[#073b55] file:text-[#18c9e8]' 
                  : 'bg-slate-50 border-[#cbd5e1] text-zinc-700 file:bg-slate-200 file:text-slate-800'
              }`}
            />

            {formData.photo_reference && (
              <div className="relative rounded-xl overflow-hidden border border-zinc-500/20 max-h-36 flex items-center justify-center bg-black/40">
                <img
                  src={formData.photo_reference}
                  alt="Evidence preview"
                  className="max-h-36 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, photo_reference: undefined })}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-black"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#18c9e8] to-[#0284c7] text-slate-950 font-bold text-xs hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Submitting to SQLite...' : 'Submit Pollution Report'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
