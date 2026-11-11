import React, { useState, useEffect } from 'react';
import type { Interview } from '../../types';
import { X, Calendar, AlertCircle } from 'lucide-react';

interface InterviewModalProps {
  interview?: Interview | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    interview_type: string;
    scheduled_at: string;
    interviewer?: string | null;
    link_or_location?: string | null;
    prep_notes?: string | null;
    result_notes?: string | null;
  }) => Promise<void>;
}

export const InterviewModal: React.FC<InterviewModalProps> = ({
  interview,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const isEditing = Boolean(interview);

  const [interviewType, setInterviewType] = useState('HR');
  const [scheduledAt, setScheduledAt] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [linkOrLocation, setLinkOrLocation] = useState('');
  const [prepNotes, setPrepNotes] = useState('');
  const [resultNotes, setResultNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (interview) {
      setInterviewType(interview.interview_type || 'HR');
      // Format datetime string for datetime-local input (YYYY-MM-DDTHH:mm)
      try {
        const d = new Date(interview.scheduled_at);
        const pad = (n: number) => String(n).padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setScheduledAt(formatted);
      } catch {
        setScheduledAt('');
      }
      setInterviewer(interview.interviewer || '');
      setLinkOrLocation(interview.link_or_location || '');
      setPrepNotes(interview.prep_notes || '');
      setResultNotes(interview.result_notes || '');
    } else {
      setInterviewType('HR');
      // Default to tomorrow 10:00 AM
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      tmrw.setHours(10, 0, 0, 0);
      const pad = (n: number) => String(n).padStart(2, '0');
      const formatted = `${tmrw.getFullYear()}-${pad(tmrw.getMonth() + 1)}-${pad(tmrw.getDate())}T${pad(tmrw.getHours())}:${pad(tmrw.getMinutes())}`;
      setScheduledAt(formatted);
      setInterviewer('');
      setLinkOrLocation('');
      setPrepNotes('');
      setResultNotes('');
    }
    setErrorMessage(null);
  }, [interview, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt) {
      setErrorMessage('Please select date and time for the interview.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit({
        interview_type: interviewType,
        scheduled_at: scheduledAt.replace('T', ' ') + ':00',
        interviewer: interviewer.trim() || null,
        link_or_location: linkOrLocation.trim() || null,
        prep_notes: prepNotes.trim() || null,
        result_notes: resultNotes.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save interview.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 select-none">
      <div className="w-full max-w-lg bg-[#ffffff] border border-[#e2e8f0] rounded-[12px] flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0f766e]" />
            <h2 className="text-sm font-semibold text-[#0f172a]">
              {isEditing ? 'Edit interview' : 'Schedule interview'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-[6px] text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-[8px] bg-[#fee2e2] border border-[#fecaca] text-[#991b1b] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="interview-type" className="block text-xs font-medium text-[#0f172a] mb-1">
                Interview stage
              </label>
              <select
                id="interview-type"
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-[#0f172a] outline-none cursor-pointer"
              >
                <option value="HR">HR / Initial screen</option>
                <option value="Technical">Technical round</option>
                <option value="System Design">System design</option>
                <option value="Managerial">Managerial</option>
                <option value="Final">Final round</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="scheduled-at" className="block text-xs font-medium text-[#0f172a] mb-1">
                Date & time (Asia/KL) <span className="text-[#991b1b]">*</span>
              </label>
              <input
                id="scheduled-at"
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-[#0f172a] outline-none tabular-nums"
              />
            </div>
          </div>

          <div>
            <label htmlFor="interviewer-name" className="block text-xs font-medium text-[#0f172a] mb-1">
              Interviewer name & role
            </label>
            <input
              id="interviewer-name"
              type="text"
              value={interviewer}
              onChange={(e) => setInterviewer(e.target.value)}
              placeholder="e.g. Ahmad Razak (Engineering Director)"
              className="w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-[#0f172a] placeholder:text-[#64748b] outline-none"
            />
          </div>

          <div>
            <label htmlFor="link-location" className="block text-xs font-medium text-[#0f172a] mb-1">
              Meeting link or physical address
            </label>
            <input
              id="link-location"
              type="text"
              value={linkOrLocation}
              onChange={(e) => setLinkOrLocation(e.target.value)}
              placeholder="e.g. https://meet.google.com/xyz or Bangsar South office"
              className="w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-[#0f172a] placeholder:text-[#64748b] outline-none"
            />
          </div>

          <div>
            <label htmlFor="prep-notes" className="block text-xs font-medium text-[#0f172a] mb-1">
              Preparation notes
            </label>
            <textarea
              id="prep-notes"
              rows={3}
              value={prepNotes}
              onChange={(e) => setPrepNotes(e.target.value)}
              placeholder="Topics to review, questions to ask the interviewer, system architecture talking points..."
              className="w-full p-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-[#0f172a] placeholder:text-[#64748b] outline-none"
            />
          </div>

          <div>
            <label htmlFor="result-notes" className="block text-xs font-medium text-[#0f172a] mb-1">
              Result / Post-interview feedback
            </label>
            <textarea
              id="result-notes"
              rows={2}
              value={resultNotes}
              onChange={(e) => setResultNotes(e.target.value)}
              placeholder="How did it go? Feedback received, expected timeline for next steps..."
              className="w-full p-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-[#0f172a] placeholder:text-[#64748b] outline-none"
            />
          </div>

          <div className="pt-4 border-t border-[#f1f5f9] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] hover:bg-[#f8fafc] font-medium text-[#0f172a] cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-4 rounded-[8px] bg-[#0f766e] hover:bg-[#115e59] text-[#ffffff] font-medium cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update interview' : 'Schedule interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
