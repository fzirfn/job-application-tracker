import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (kind: 'cv' | 'cover_letter', file: File) => Promise<void>;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [kind, setKind] = useState<'cv' | 'cover_letter'>('cv');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please choose a file to upload.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit(kind, selectedFile);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 select-none">
      <div className="w-full max-w-md bg-[#ffffff] border border-[#e2e8f0] rounded-[12px] flex flex-col">
        <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0f766e]" />
            <h2 className="text-sm font-semibold text-[#0f172a]">
              Upload document
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-[8px] bg-[#fee2e2] border border-[#fecaca] text-[#991b1b] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#0f172a] mb-1.5">
              Document kind
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setKind('cv')}
                className={`py-2 px-3 rounded-[8px] border text-xs font-medium cursor-pointer transition-colors ${
                  kind === 'cv'
                    ? 'bg-[#0f766e] text-[#ffffff] border-[#0f766e]'
                    : 'bg-[#ffffff] text-[#0f172a] border-[#e2e8f0] hover:bg-[#f8fafc]'
                }`}
              >
                Curriculum Vitae (CV)
              </button>
              <button
                type="button"
                onClick={() => setKind('cover_letter')}
                className={`py-2 px-3 rounded-[8px] border text-xs font-medium cursor-pointer transition-colors ${
                  kind === 'cover_letter'
                    ? 'bg-[#0f766e] text-[#ffffff] border-[#0f766e]'
                    : 'bg-[#ffffff] text-[#0f172a] border-[#e2e8f0] hover:bg-[#f8fafc]'
                }`}
              >
                Cover Letter
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#0f172a] mb-1.5">
              File (PDF, DOCX, TXT up to 15MB)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.rtf"
              onChange={handleFileChange}
              className="hidden"
              id="doc-file-input"
            />
            {selectedFile ? (
              <div className="p-3 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-[#0f766e] shrink-0" />
                  <span className="truncate text-xs font-medium text-[#0f172a]">
                    {selectedFile.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-xs text-[#991b1b] hover:underline shrink-0 ml-2 cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <label
                htmlFor="doc-file-input"
                className="h-24 rounded-[8px] border border-dashed border-[#cbd5e1] hover:border-[#0f766e] flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-[#f8fafc] hover:bg-[#f0fdfa] transition-colors"
              >
                <Upload className="w-4 h-4 text-[#0f766e]" />
                <span className="text-xs font-medium text-[#0f172a]">Choose file to upload</span>
                <span className="text-[11px] text-[#64748b]">PDF, DOCX, or TXT</span>
              </label>
            )}
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
              disabled={isSubmitting || !selectedFile}
              className="h-9 px-4 rounded-[8px] bg-[#0f766e] hover:bg-[#115e59] text-[#ffffff] font-medium cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Uploading...' : 'Upload document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

