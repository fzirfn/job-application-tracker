import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Application, ApplicationStatus, Interview, Contact } from '../types';
import {
  getApplicationApi,
  updateApplicationApi,
  updateApplicationStatusApi,
  deleteApplicationApi,
  type CreateApplicationPayload,
} from '../api/applications';
import {
  createInterviewApi,
  updateInterviewApi,
  deleteInterviewApi,
} from '../api/interviews';
import {
  createContactApi,
  updateContactApi,
  deleteContactApi,
} from '../api/contacts';
import {
  uploadDocumentApi,
  deleteDocumentApi,
} from '../api/documents';
import { formatDateMY, formatDateTimeMY } from '../utils/date';
import { StatusSelector } from '../components/ui/StatusSelector';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CompanyAvatar } from '../components/ui/CompanyAvatar';
import { ApplicationFormModal } from '../components/applications/ApplicationFormModal';
import { InterviewModal } from '../components/applications/InterviewModal';
import { ContactModal } from '../components/applications/ContactModal';
import { DocumentUploadModal } from '../components/applications/DocumentUploadModal';
import { ScreenshotModal } from '../components/applications/ScreenshotModal';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  MapPin,
  Clock,
  UserPlus,
  FileText,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Mail,
  Phone,
  AlertTriangle,
  Image as ImageIcon,
  Copy,
  Check,
  ChevronRight
} from 'lucide-react';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'interviews' | 'contacts' | 'documents' | 'history'>('overview');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isScreenshotOpen, setIsScreenshotOpen] = useState(false);

  const [copiedJd, setCopiedJd] = useState(false);

  const fetchApplication = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await getApplicationApi(Number(id));
      setApplication(res.application);
    } catch (err) {
      console.error('Failed to load application:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!application) return;
    try {
      const res = await updateApplicationStatusApi(application.id, newStatus);
      setApplication(res.application);
    } catch (err) {
      console.error('Status update failed:', err);
      alert('Failed to change stage.');
    }
  };

  const handleEditApplication = async (formData: Record<string, unknown>) => {
    if (!application) return;
    await updateApplicationApi(application.id, formData as Partial<CreateApplicationPayload>);
    await fetchApplication();
  };

  const handleDeleteApplication = async () => {
    if (!application) return;
    if (!window.confirm(`Delete application for "${application.job_title}" at ${application.company?.name}?`)) {
      return;
    }
    try {
      await deleteApplicationApi(application.id);
      navigate('/applications');
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete application.');
    }
  };

  // Interview actions
  const handleSaveInterview = async (data: {
    interview_type: string;
    scheduled_at: string;
    interviewer?: string | null;
    link_or_location?: string | null;
    prep_notes?: string | null;
    result_notes?: string | null;
  }) => {
    if (!application) return;
    if (editingInterview) {
      await updateInterviewApi(editingInterview.id, data);
    } else {
      await createInterviewApi(application.id, data);
    }
    await fetchApplication();
  };

  const handleDeleteInterview = async (interviewId: number) => {
    if (!window.confirm('Delete this scheduled interview?')) return;
    await deleteInterviewApi(interviewId);
    await fetchApplication();
  };

  // Contact actions
  const handleSaveContact = async (data: {
    name: string;
    role?: string | null;
    email?: string | null;
    phone?: string | null;
    linkedin_url?: string | null;
  }) => {
    if (!application) return;
    if (editingContact) {
      await updateContactApi(editingContact.id, data);
    } else {
      await createContactApi(application.id, data);
    }
    await fetchApplication();
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!window.confirm('Delete this contact?')) return;
    await deleteContactApi(contactId);
    await fetchApplication();
  };

  // Document actions
  const handleUploadDocument = async (kind: 'cv' | 'cover_letter', file: File) => {
    if (!application) return;
    await uploadDocumentApi(application.id, kind, file);
    await fetchApplication();
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!window.confirm('Delete this document attachment?')) return;
    await deleteDocumentApi(docId);
    await fetchApplication();
  };

  const copyJdToClipboard = () => {
    if (!application?.job_description) return;
    navigator.clipboard.writeText(application.job_description);
    setCopiedJd(true);
    setTimeout(() => setCopiedJd(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-[#6b6b6b]">
        Loading application details...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-12 text-center space-y-3">
        <p className="text-xs text-[#6b6b6b]">Application not found.</p>
        <Link
          to="/applications"
          className="inline-block px-3 py-1.5 rounded-[6px] bg-[#141414] text-[#ffffff] text-xs font-medium"
        >
          Back to applications
        </Link>
      </div>
    );
  }

  // Check if follow-up is overdue
  const isOverdue =
    application.follow_up_date &&
    new Date(application.follow_up_date) <= new Date() &&
    !['Accepted', 'Rejected', 'Ghosted', 'Withdrawn'].includes(application.status);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/applications"
          className="inline-flex items-center gap-1.5 text-xs text-[#6b6b6b] hover:text-[#0a0a0a] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to applications</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="h-8 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] hover:border-[#0f766e] text-xs font-medium text-[#0f172a] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            onClick={handleDeleteApplication}
            className="h-8 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] hover:bg-[#fee2e2] hover:text-[#991b1b] text-xs font-medium text-[#64748b] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="p-6 rounded-[10px] bg-[#ffffff] border border-[#e2e8f0] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <CompanyAvatar name={application.company?.name || 'Company'} size="lg" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-[#0f172a]">
                  {application.job_title}
                </h1>
                {application.job_url && (
                  <a
                    href={application.job_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#94a3b8] hover:text-[#0f172a]"
                    title="Open job posting"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[#64748b]">
                <span className="font-semibold text-[#0f172a]">
                  {application.company?.name}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#94a3b8]" />
                  {application.location || 'Kuala Lumpur'}
                </span>
                <span>·</span>
                <span>Portal: <strong className="text-[#0f172a] font-medium">{application.source}</strong></span>
                {application.company?.website && (
                  <>
                    <span>·</span>
                    <a
                      href={application.company.website.startsWith('http') ? application.company.website : `https://${application.company.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0f766e] hover:underline"
                    >
                      company website
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[11px] text-[#64748b] mb-1 font-medium">Pipeline stage</div>
              <StatusSelector
                currentStatus={application.status}
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>
        </div>

        {/* Visual Pipeline Progression Ribbon */}
        <div className="pt-3 border-t border-[#f1f5f9]">
          <div className="text-[11px] font-medium text-[#64748b] mb-2">Stage progression (click to advance)</div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['Saved', 'Applied', 'Screening', 'Interview', 'Technical Test', 'Offer', 'Accepted'].map((st, idx, arr) => {
              const isCurrent = application.status === st;
              const pipelineOrder = ['Saved', 'Applied', 'Screening', 'Interview', 'Technical Test', 'Offer', 'Accepted'];
              const currentIdx = pipelineOrder.indexOf(application.status);
              const isPast = currentIdx > -1 && idx < currentIdx;

              return (
                <React.Fragment key={st}>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(st as ApplicationStatus)}
                    className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                      isCurrent
                        ? 'bg-[#0f766e] text-[#ffffff] font-semibold'
                        : isPast
                        ? 'bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1]'
                        : 'bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0] hover:text-[#0f172a]'
                    }`}
                  >
                    {st}
                  </button>
                  {idx < arr.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-[#cbd5e1] shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Warning if follow-up is overdue */}
        {isOverdue && (
          <div className="p-3 rounded-[8px] bg-[#fef3c7] border border-[#fde68a] text-[#92400e] text-xs flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Follow-up is overdue ({formatDateMY(application.follow_up_date)}). Consider emailing the recruiter today.
            </span>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#e2e8f0] flex items-center gap-1 text-xs">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'interviews', label: `Interviews (${application.interviews?.length || 0})` },
          { id: 'contacts', label: `Contacts (${application.contacts?.length || 0})` },
          { id: 'documents', label: `Documents (${application.documents?.length || 0})` },
          { id: 'history', label: `Stage History (${application.status_history?.length || 0})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2.5 font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#0f766e] text-[#0f766e] font-semibold'
                : 'border-transparent text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Job Description & Notes (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            {/* Job Description card */}
            <div className="p-6 rounded-[12px] bg-[#ffffff] border border-[#e2e8f0] space-y-3">
              <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
                <h3 className="text-xs font-semibold text-[#0f172a]">
                  Job description
                </h3>
                {application.job_description && (
                  <button
                    onClick={copyJdToClipboard}
                    className="text-[11px] text-[#64748b] hover:text-[#0f766e] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedJd ? <Check className="w-3 h-3 text-[#166534]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedJd ? 'Copied' : 'Copy JD'}</span>
                  </button>
                )}
              </div>

              {application.job_description ? (
                <div className="text-xs text-[#0f172a] leading-relaxed whitespace-pre-wrap font-sans bg-[#f8fafc] p-4 rounded-[8px] border border-[#e2e8f0] max-h-96 overflow-y-auto">
                  {application.job_description}
                </div>
              ) : (
                <p className="text-xs text-[#64748b] italic py-3 text-center">
                  No job description text was pasted for this application.
                </p>
              )}
            </div>

            {/* Notes card */}
            <div className="p-6 rounded-[12px] bg-[#ffffff] border border-[#e2e8f0] space-y-3">
              <h3 className="text-xs font-semibold text-[#0f172a] border-b border-[#f1f5f9] pb-3">
                Application notes
              </h3>
              {application.notes ? (
                <p className="text-xs text-[#0f172a] leading-relaxed whitespace-pre-wrap">
                  {application.notes}
                </p>
              ) : (
                <p className="text-xs text-[#64748b] italic py-3 text-center">
                  No private notes recorded yet.
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Metadata & Screenshot (1 col) */}
          <div className="space-y-6">
            {/* Metadata Card */}
            <div className="p-6 rounded-[12px] bg-[#ffffff] border border-[#e2e8f0] space-y-3">
              <h3 className="text-xs font-semibold text-[#0f172a] border-b border-[#f1f5f9] pb-3">
                Application metadata
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#f1f5f9]">
                  <span className="text-[#64748b]">Date applied</span>
                  <span className="font-medium text-[#0f172a] tabular-nums">
                    {formatDateMY(application.date_applied)}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-[#f1f5f9]">
                  <span className="text-[#64748b]">Follow-up date</span>
                  <span className={`font-medium tabular-nums ${isOverdue ? 'text-[#991b1b] font-bold' : 'text-[#0f172a]'}`}>
                    {application.follow_up_date ? formatDateMY(application.follow_up_date) : 'None set'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-[#f1f5f9]">
                  <span className="text-[#64748b]">Company industry</span>
                  <span className="text-[#0f172a]">
                    {application.company?.industry || 'Unspecified'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-[#f1f5f9]">
                  <span className="text-[#64748b]">Company size</span>
                  <span className="text-[#0f172a]">
                    {application.company?.size || 'Unspecified'}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-[#64748b]">Portal source</span>
                  <span className="text-[#0f172a] font-medium">
                    {application.source}
                  </span>
                </div>
              </div>
            </div>

            {/* Posting Screenshot Card */}
            <div className="p-6 rounded-[12px] bg-[#ffffff] border border-[#e2e8f0] space-y-3">
              <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
                <h3 className="text-xs font-semibold text-[#0f172a]">
                  Posting screenshot
                </h3>
                {application.screenshot_url && (
                  <button
                    onClick={() => setIsScreenshotOpen(true)}
                    className="text-[11px] text-[#0f766e] hover:underline cursor-pointer font-medium"
                  >
                    View full size
                  </button>
                )}
              </div>

              {application.screenshot_url ? (
                <div
                  onClick={() => setIsScreenshotOpen(true)}
                  className="rounded-[8px] border border-[#e2e8f0] overflow-hidden cursor-pointer hover:opacity-90 transition-opacity max-h-48 flex items-center justify-center bg-[#f8fafc]"
                >
                  <img
                    src={application.screenshot_url}
                    alt="Job posting preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="p-6 rounded-[8px] border border-dashed border-[#cbd5e1] text-center text-xs text-[#64748b] space-y-2">
                  <ImageIcon className="w-6 h-6 text-[#94a3b8] mx-auto" />
                  <p>No posting screenshot attached.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Interviews */}
      {activeTab === 'interviews' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#0f172a]">
              Scheduled interviews
            </h2>
            <button
              onClick={() => {
                setEditingInterview(null);
                setIsInterviewModalOpen(true);
              }}
              className="h-9 px-4 rounded-[8px] bg-[#0f766e] hover:bg-[#115e59] text-[#ffffff] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule interview</span>
            </button>
          </div>

          {!application.interviews || application.interviews.length === 0 ? (
            <div className="p-12 rounded-[12px] bg-[#ffffff] border border-[#e2e8f0] text-center space-y-2">
              <Calendar className="w-8 h-8 text-[#94a3b8] mx-auto" />
              <p className="text-xs text-[#64748b]">No interviews scheduled yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {application.interviews.map((iv) => (
                <div
                  key={iv.id}
                  className="p-5 rounded-[12px] bg-[#ffffff] border border-[#e2e8f0] space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded-[4px] bg-[#f0fdfa] text-[#0f766e] text-[11px] font-medium border border-[#ccfbf1]">
                        {iv.interview_type} Round
                      </span>
                      <div className="text-sm font-semibold text-[#0f172a] mt-1.5 tabular-nums flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#0f766e]" />
                        {formatDateTimeMY(iv.scheduled_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingInterview(iv);
                          setIsInterviewModalOpen(true);
                        }}
                        className="p-1.5 rounded-[6px] text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                        title="Edit interview"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteInterview(iv.id)}
                        className="p-1.5 rounded-[6px] text-[#64748b] hover:text-[#991b1b] hover:bg-[#fee2e2] transition-colors cursor-pointer"
                        title="Delete interview"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-[#64748b] space-y-1">
                    {iv.interviewer && (
                      <div>Interviewer: <strong className="text-[#0f172a] font-medium">{iv.interviewer}</strong></div>
                    )}
                    {iv.link_or_location && (
                      <div className="truncate">
                        Meeting: <span className="text-[#0f172a]">{iv.link_or_location}</span>
                      </div>
                    )}
                  </div>

                  {iv.prep_notes && (
                    <div className="p-3 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] text-xs">
                      <div className="text-[11px] font-medium text-[#64748b] mb-1">Prep notes</div>
                      <p className="text-[#0f172a] whitespace-pre-wrap">{iv.prep_notes}</p>
                    </div>
                  )}

                  {iv.result_notes && (
                    <div className="p-3 rounded-[8px] bg-[#dcfce7] border border-[#bbf7d0] text-xs">
                      <div className="text-[11px] font-medium text-[#166534] mb-1">Result / Feedback</div>
                      <p className="text-[#166534] whitespace-pre-wrap">{iv.result_notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Contacts */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#0f172a]">
              Recruiter & hiring manager contacts
            </h2>
            <button
              onClick={() => {
                setEditingContact(null);
                setIsContactModalOpen(true);
              }}
              className="h-9 px-4 rounded-[8px] bg-[#0f766e] hover:bg-[#115e59] text-[#ffffff] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add contact</span>
            </button>
          </div>

          {!application.contacts || application.contacts.length === 0 ? (
            <div className="p-12 rounded-[12px] bg-[#ffffff] border border-[#e2e8f0] text-center space-y-2">
              <UserPlus className="w-8 h-8 text-[#94a3b8] mx-auto" />
              <p className="text-xs text-[#64748b]">No contacts linked to this application yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {application.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-5 rounded-[12px] bg-[#ffffff] border border-[#e2e8f0] space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-[#0f172a]">{contact.name}</div>
                      <div className="text-xs text-[#64748b] mt-0.5">{contact.role || 'Recruiter'}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingContact(contact);
                          setIsContactModalOpen(true);
                        }}
                        className="p-1.5 rounded-[6px] text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                        title="Edit contact"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-1.5 rounded-[6px] text-[#64748b] hover:text-[#991b1b] hover:bg-[#fee2e2] transition-colors cursor-pointer"
                        title="Delete contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 text-xs">
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#64748b]" />
                        <a href={`mailto:${contact.email}`} className="text-[#0f766e] hover:underline">
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#64748b]" />
                        <a href={`tel:${contact.phone}`} className="text-[#0f172a] hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                    )}
                    {contact.linkedin_url && (
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-[#0f766e] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.53 1.53 0 0 0 0-3.06 1.53 1.53 0 0 0 0 3.06m1.4 9.74V9.93H5.06v8.57h2.8z"/>
                        </svg>
                        <a
                          href={contact.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0f766e] hover:underline truncate max-w-xs"
                        >
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Documents (CV & Cover Letter) */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#0f172a]">
              CV & cover letter versions used
            </h2>
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="h-9 px-4 rounded-[8px] bg-[#0f766e] hover:bg-[#115e59] text-[#ffffff] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload document</span>
            </button>
          </div>

          {!application.documents || application.documents.length === 0 ? (
            <div className="p-12 rounded-[12px] bg-[#ffffff] border border-[#e2e8f0] text-center space-y-2">
              <FileText className="w-8 h-8 text-[#94a3b8] mx-auto" />
              <p className="text-xs text-[#64748b]">No CV or cover letter uploaded for this application.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {application.documents.map((doc) => {
                const docUrl = doc.url || `/storage/${doc.file_path}`;
                return (
                  <div
                    key={doc.id}
                    className="p-4 rounded-[12px] bg-[#ffffff] border border-[#e2e8f0] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 truncate pr-3">
                      <div className="w-10 h-10 rounded-[8px] bg-[#f0fdfa] border border-[#ccfbf1] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-[#0f766e]" />
                      </div>
                      <div className="truncate text-xs">
                        <div className="font-medium text-[#0f172a] truncate">{doc.file_name}</div>
                        <div className="text-[11px] text-[#64748b] font-medium">
                          {doc.kind === 'cv' ? 'Curriculum Vitae' : 'Cover Letter'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={docUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-[6px] bg-[#ffffff] border border-[#e2e8f0] hover:border-[#0f766e] text-xs font-medium text-[#0f172a] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                      </a>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 rounded-[6px] text-[#64748b] hover:text-[#991b1b] hover:bg-[#fee2e2] transition-colors cursor-pointer"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Stage History */}
      {activeTab === 'history' && (
        <div className="p-6 rounded-[12px] bg-[#ffffff] border border-[#e2e8f0] space-y-4">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
            <h2 className="text-sm font-semibold text-[#0f172a]">
              Stage history timeline
            </h2>
            <span className="text-xs text-[#64748b]">
              Every stage change is automatically logged
            </span>
          </div>

          {!application.status_history || application.status_history.length === 0 ? (
            <p className="text-xs text-[#64748b] italic py-3 text-center">No history records found.</p>
          ) : (
            <div className="relative border-l-2 border-[#e2e8f0] ml-4 pl-5 space-y-5">
              {application.status_history.map((item, idx) => (
                <div key={item.id || idx} className="relative">
                  <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-[#0f766e] border-2 border-[#ffffff]" />
                  <div className="p-4 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      {item.from_status ? (
                        <>
                          <StatusBadge status={item.from_status} size="sm" />
                          <span className="text-[#94a3b8]">→</span>
                          <StatusBadge status={item.to_status} size="sm" />
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#64748b]">Initial stage:</span>
                          <StatusBadge status={item.to_status} size="sm" />
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-[#64748b] tabular-nums">
                      Logged on {formatDateTimeMY(item.changed_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Application Modal */}
      <ApplicationFormModal
        isOpen={isEditModalOpen}
        application={application}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditApplication}
      />

      {/* Interview Modal */}
      <InterviewModal
        isOpen={isInterviewModalOpen}
        interview={editingInterview}
        onClose={() => {
          setIsInterviewModalOpen(false);
          setEditingInterview(null);
        }}
        onSubmit={handleSaveInterview}
      />

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        contact={editingContact}
        onClose={() => {
          setIsContactModalOpen(false);
          setEditingContact(null);
        }}
        onSubmit={handleSaveContact}
      />

      {/* Document Modal */}
      <DocumentUploadModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onSubmit={handleUploadDocument}
      />

      {/* Screenshot Modal */}
      {isScreenshotOpen && (
        <ScreenshotModal
          url={application.screenshot_url || (application.screenshot_path ? `/storage/${application.screenshot_path}` : null)}
          title={`${application.job_title} at ${application.company?.name}`}
          onClose={() => setIsScreenshotOpen(false)}
        />
      )}
    </div>
  );
};
