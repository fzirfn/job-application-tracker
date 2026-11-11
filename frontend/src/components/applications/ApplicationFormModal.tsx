import React, { useState, useEffect, useRef } from 'react';
import type { Application, ApplicationStatus, Company } from '../../types';
import { getCompaniesApi, lookupCompanyApi } from '../../api/companies';
import { uploadScreenshotApi } from '../../api/applications';
import { getTodayInputDate } from '../../utils/date';
import { ALL_STATUSES } from '../ui/StatusBadge';
import {
  X,
  Upload,
  Trash2,
  AlertCircle,
  Sparkles,
  Check,
  RefreshCw,
  Building
} from 'lucide-react';

interface ApplicationFormModalProps {
  application?: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Record<string, unknown>) => Promise<void>;
  sourcesList?: string[];
}

export const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({
  application,
  isOpen,
  onClose,
  onSubmit,
  sourcesList = [
    'JobStreet',
    'LinkedIn',
    'MyFutureJobs',
    'MauKerja',
    'TechStreet',
    'Hiredly',
    'Indeed',
    'Company Site',
    'Email',
    'Referral',
    'Other',
  ],
}) => {
  const isEditing = Boolean(application);

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [source, setSource] = useState('JobStreet');
  const [dateApplied, setDateApplied] = useState(getTodayInputDate());
  const [location, setLocation] = useState('Kuala Lumpur');
  const [jobDescription, setJobDescription] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('Applied');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');

  // AI & Lookup states
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupSource, setLookupSource] = useState<'database' | 'ai' | 'none' | null>(null);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);

  // Screenshot upload states
  const [screenshotPath, setScreenshotPath] = useState<string | null>(null);
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<string | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Company suggestions autocomplete
  const [suggestions, setSuggestions] = useState<Company[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Submission & Validation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (application) {
      setCompanyName(application.company?.name || '');
      setCompanyId(application.company_id || null);
      setCompanyWebsite(application.company?.website || '');
      setCompanyIndustry(application.company?.industry || '');
      setCompanySize(application.company?.size || '');
      setJobTitle(application.job_title || '');
      setJobUrl(application.job_url || '');
      setSource(application.source || 'JobStreet');
      setDateApplied(application.date_applied ? String(application.date_applied).slice(0, 10) : getTodayInputDate());
      setLocation(application.location || 'Kuala Lumpur');
      setJobDescription(application.job_description || '');
      setStatus(application.status || 'Applied');
      setFollowUpDate(application.follow_up_date ? String(application.follow_up_date).slice(0, 10) : '');
      setNotes(application.notes || '');
      setScreenshotPath(application.screenshot_path || null);
      setScreenshotPreviewUrl(application.screenshot_url || (application.screenshot_path ? `/storage/${application.screenshot_path}` : null));
      setLookupSource(null);
      setLookupMessage(null);
      setShowCompanyDetails(Boolean(application.company?.website || application.company?.industry));
    } else {
      setCompanyName('');
      setCompanyId(null);
      setCompanyWebsite('');
      setCompanyIndustry('');
      setCompanySize('');
      setJobTitle('');
      setJobUrl('');
      setSource('JobStreet');
      setDateApplied(getTodayInputDate());
      setLocation('Kuala Lumpur');
      setJobDescription('');
      setStatus('Applied');
      setFollowUpDate('');
      setNotes('');
      setScreenshotPath(null);
      setScreenshotPreviewUrl(null);
      setLookupSource(null);
      setLookupMessage(null);
      setShowCompanyDetails(false);
    }
    setErrorMessage(null);
  }, [application, isOpen]);

  // Handle company search input & auto-fill lookup
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCompanyName(val);
    setCompanyId(null);
    setLookupSource(null);
    setLookupMessage(null);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (val.trim().length >= 2) {
      // 1. Fetch autocomplete suggestions from database immediately
      getCompaniesApi(val.trim())
        .then((res) => {
          setSuggestions(res.companies);
          setShowSuggestions(res.companies.length > 0);
        })
        .catch(() => setSuggestions([]));

      // 2. Trigger auto-fill lookup after 500ms pause
      debounceTimer.current = setTimeout(async () => {
        setIsLookingUp(true);
        try {
          const res = await lookupCompanyApi(val.trim());
          if (res.found && res.company) {
            setLookupSource(res.source);
            if (res.source === 'database' && res.company.id) {
              setCompanyId(res.company.id);
            }
            if (res.company.website && !companyWebsite) {
              setCompanyWebsite(res.company.website);
              setShowCompanyDetails(true);
            }
            if (res.company.industry && !companyIndustry) {
              setCompanyIndustry(res.company.industry);
              setShowCompanyDetails(true);
            }
            if (res.company.size && !companySize) {
              setCompanySize(res.company.size);
              setShowCompanyDetails(true);
            }
            if (res.company.location) {
              setLocation(res.company.location);
            }

            if (res.source === 'database') {
              setLookupMessage('Loaded existing company profile from your database.');
            } else if (res.source === 'ai') {
              setLookupMessage('Auto-filled company details suggested by AI. You can review and edit below.');
            }
          }
        } catch (err) {
          console.warn('Company auto-fill lookup error:', err);
        } finally {
          setIsLookingUp(false);
        }
      }, 500);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLookingUp(false);
    }
  };

  const handleSelectSuggestion = (c: Company) => {
    setCompanyName(c.name);
    setCompanyId(c.id);
    if (c.website) setCompanyWebsite(c.website);
    if (c.industry) setCompanyIndustry(c.industry);
    if (c.size) setCompanySize(c.size);
    if (c.location) setLocation(c.location);
    setLookupSource('database');
    setLookupMessage('Loaded from your database records.');
    setShowSuggestions(false);
    setShowCompanyDetails(true);
  };

  // Handle screenshot file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingScreenshot(true);
    setErrorMessage(null);
    try {
      const res = await uploadScreenshotApi(file);
      setScreenshotPath(res.path);
      setScreenshotPreviewUrl(res.url);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Screenshot upload failed');
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshotPath(null);
    setScreenshotPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!companyName.trim()) {
      setErrorMessage('Please specify the company name.');
      return;
    }
    if (!jobTitle.trim()) {
      setErrorMessage('Please specify the job title.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        company_name: companyName.trim(),
        company_id: companyId,
        company_website: companyWebsite.trim() || null,
        company_industry: companyIndustry.trim() || null,
        company_size: companySize.trim() || null,
        job_title: jobTitle.trim(),
        job_url: jobUrl.trim() || null,
        source,
        date_applied: dateApplied,
        location: location.trim() || 'Kuala Lumpur',
        job_description: jobDescription.trim() || null,
        screenshot_path: screenshotPath,
        status,
        follow_up_date: followUpDate || null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to save application.');
      }
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
      <div className="w-full max-w-2xl bg-[#ffffff] border border-[#e2e8f0] rounded-[12px] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#0f172a]">
              {isEditing ? 'Edit job application' : 'Record job application'}
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              Record job details, posting link, source, and text job description.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close form"
            className="p-1.5 rounded-[6px] text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-[8px] bg-[#fee2e2] border border-[#fecaca] text-[#991b1b] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          {/* Row: Company & Job Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="company-name" className="block text-xs font-medium text-[#0f172a]">
                  Company name <span className="text-[#991b1b]">*</span>
                </label>
                {isLookingUp && (
                  <span className="text-[11px] text-[#0f766e] flex items-center gap-1 font-medium">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Looking up...</span>
                  </span>
                )}
              </div>
              <input
                id="company-name"
                type="text"
                required
                value={companyName}
                onChange={handleCompanyChange}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="e.g. Grab, Shopee, Petronas"
                autoComplete="off"
                className="w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-xs text-[#0f172a] placeholder:text-[#64748b] outline-none transition-colors"
              />

              {/* Autocomplete Suggestions from DB */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] z-30 max-h-40 overflow-y-auto text-xs divide-y divide-[#f1f5f9]">
                  {suggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(c)}
                      className="w-full text-left px-3 py-2 hover:bg-[#f8fafc] flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-medium text-[#0f172a]">{c.name}</span>
                      <span className="text-[11px] text-[#64748b]">{c.location || 'Kuala Lumpur'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="job-title" className="block text-xs font-medium text-[#0f172a] mb-1">
                Job title <span className="text-[#991b1b]">*</span>
              </label>
              <input
                id="job-title"
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                className="w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-xs text-[#0f172a] placeholder:text-[#64748b] outline-none transition-colors"
              />
            </div>
          </div>

          {/* AI / Database Auto-fill Banner */}
          {lookupMessage && (
            <div
              className={`p-3 rounded-[8px] text-xs flex items-center justify-between ${
                lookupSource === 'ai'
                  ? 'bg-[#f0fdfa] border border-[#ccfbf1] text-[#0f766e]'
                  : 'bg-[#dcfce7] border border-[#bbf7d0] text-[#166534]'
              }`}
            >
              <div className="flex items-center gap-2">
                {lookupSource === 'ai' ? (
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <Check className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="text-[11px] font-medium leading-tight">{lookupMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCompanyDetails(!showCompanyDetails)}
                className="text-[11px] underline font-medium hover:opacity-80 shrink-0 ml-2 cursor-pointer"
              >
                {showCompanyDetails ? 'Hide details' : 'Edit details'}
              </button>
            </div>
          )}

          {/* Collapsible / Expandable Company Attributes (Website, Industry, Size) */}
          {(showCompanyDetails || Boolean(companyWebsite || companyIndustry || companySize)) && (
            <div className="p-4 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] space-y-3 text-xs">
              <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                <span className="font-semibold text-[#0f172a] flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#0f766e]" />
                  Company details
                </span>
                {lookupSource && (
                  <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[#ffffff] border border-[#e2e8f0] font-medium text-[#0f766e]">
                    {lookupSource === 'ai' ? 'AI suggestion (editable)' : 'Database record'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="company-website" className="block text-[11px] font-medium text-[#0f172a] mb-1">
                    Website URL
                  </label>
                  <input
                    id="company-website"
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-8 px-2.5 rounded-[6px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-xs outline-none text-[#0f172a] placeholder:text-[#64748b]"
                  />
                </div>

                <div>
                  <label htmlFor="company-industry" className="block text-[11px] font-medium text-[#0f172a] mb-1">
                    Industry
                  </label>
                  <input
                    id="company-industry"
                    type="text"
                    value={companyIndustry}
                    onChange={(e) => setCompanyIndustry(e.target.value)}
                    placeholder="e.g. Fintech, Logistics"
                    className="w-full h-8 px-2.5 rounded-[6px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-xs outline-none text-[#0f172a] placeholder:text-[#64748b]"
                  />
                </div>

                <div>
                  <label htmlFor="company-size" className="block text-[11px] font-medium text-[#0f172a] mb-1">
                    Employee size
                  </label>
                  <input
                    id="company-size"
                    type="text"
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    placeholder="e.g. 500-1000 employees"
                    className="w-full h-8 px-2.5 rounded-[6px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-xs outline-none text-[#0f172a] placeholder:text-[#64748b]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Row: Job Posting URL & Source */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="job-url" className="block text-xs font-medium text-[#0f172a] mb-1">
                Job posting URL
              </label>
              <input
                id="job-url"
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://..."
                className="w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-xs text-[#0f172a] placeholder:text-[#64748b] outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="source-select" className="block text-xs font-medium text-[#0f172a] mb-1">
                Portal source <span className="text-[#991b1b]">*</span>
              </label>
              <select
                id="source-select"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-xs text-[#0f172a] outline-none cursor-pointer"
              >
                {sourcesList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: Date Applied, Status, Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="date-applied" className="block text-xs font-medium text-[#0f172a] mb-1">
                Date applied <span className="text-[#991b1b]">*</span>
              </label>
              <input
                id="date-applied"
                type="date"
                required
                value={dateApplied}
                onChange={(e) => setDateApplied(e.target.value)}
                className="w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-xs text-[#0f172a] outline-none tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="status-select" className="block text-xs font-medium text-[#0f172a] mb-1">
                Stage / Status
              </label>
              <select
                id="status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-xs text-[#0f172a] outline-none cursor-pointer"
              >
                {ALL_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="location-input" className="block text-xs font-medium text-[#0f172a] mb-1">
                Location
              </label>
              <input
                id="location-input"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Kuala Lumpur"
                className="w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-xs text-[#0f172a] placeholder:text-[#64748b] outline-none"
              />
            </div>
          </div>

          {/* Row: Follow-up Date */}
          <div>
            <label htmlFor="follow-up-date" className="block text-xs font-medium text-[#0f172a] mb-1">
              Follow-up reminder date (optional)
            </label>
            <input
              id="follow-up-date"
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full md:w-1/2 h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-xs text-[#0f172a] outline-none tabular-nums"
            />
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="block text-xs font-medium text-[#0f172a] mb-1.5">
              Posting screenshot (optional)
            </label>
            {screenshotPreviewUrl ? (
              <div className="p-3 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[6px] bg-[#ffffff] border border-[#e2e8f0] overflow-hidden flex items-center justify-center">
                    <img
                      src={screenshotPreviewUrl}
                      alt="Posting screenshot preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs">
                    <div className="font-medium text-[#0f172a]">Screenshot attached</div>
                    <div className="text-[11px] text-[#64748b] truncate max-w-xs">{screenshotPath}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveScreenshot}
                  className="p-1.5 rounded-[6px] text-[#64748b] hover:text-[#991b1b] hover:bg-[#fee2e2] transition-colors cursor-pointer"
                  title="Remove screenshot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="screenshot-input"
                />
                <label
                  htmlFor="screenshot-input"
                  className={`h-9 px-3.5 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] hover:border-[#0f766e] text-xs text-[#0f172a] flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isUploadingScreenshot ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-[#0f766e]" />
                  <span>{isUploadingScreenshot ? 'Uploading image...' : 'Upload screenshot image'}</span>
                </label>
                <span className="text-[11px] text-[#64748b]">
                  PNG, JPG, or WebP up to 10MB
                </span>
              </div>
            )}
          </div>

          {/* Job Description Text */}
          <div>
            <label htmlFor="job-description" className="block text-xs font-medium text-[#0f172a] mb-1">
              Job description text
            </label>
            <textarea
              id="job-description"
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste full job posting text here (since postings get taken down)..."
              className="w-full p-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-xs text-[#0f172a] placeholder:text-[#64748b] outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes-input" className="block text-xs font-medium text-[#0f172a] mb-1">
              Notes
            </label>
            <textarea
              id="notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Referral contact, interview questions discussed, salary expectations..."
              className="w-full p-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-xs text-[#0f172a] placeholder:text-[#64748b] outline-none"
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-4 border-t border-[#f1f5f9] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] hover:bg-[#f8fafc] text-xs font-medium text-[#0f172a] cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingScreenshot}
              className="h-9 px-4 rounded-[8px] bg-[#0f766e] hover:bg-[#115e59] text-[#ffffff] text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving application...' : isEditing ? 'Update application' : 'Save application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
