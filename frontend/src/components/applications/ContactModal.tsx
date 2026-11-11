import React, { useState, useEffect } from 'react';
import type { Contact } from '../../types';
import { X, UserPlus, AlertCircle } from 'lucide-react';

interface ContactModalProps {
  contact?: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    role?: string | null;
    email?: string | null;
    phone?: string | null;
    linkedin_url?: string | null;
  }) => Promise<void>;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  contact,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const isEditing = Boolean(contact);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (contact) {
      setName(contact.name || '');
      setRole(contact.role || '');
      setEmail(contact.email || '');
      setPhone(contact.phone || '');
      setLinkedinUrl(contact.linkedin_url || '');
    } else {
      setName('');
      setRole('');
      setEmail('');
      setPhone('');
      setLinkedinUrl('');
    }
    setErrorMessage(null);
  }, [contact, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Contact name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit({
        name: name.trim(),
        role: role.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save contact.');
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
      <div className="w-full max-w-md bg-[#ffffff] border border-[#e2e8f0] rounded-[12px] flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#0f766e]" />
            <h2 className="text-sm font-semibold text-[#0f172a]">
              {isEditing ? 'Edit contact' : 'Add recruiter or contact'}
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

          <div>
            <label htmlFor="contact-name" className="block text-xs font-medium text-[#0f172a] mb-1">
              Full name <span className="text-[#991b1b]">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rachel Tan"
              className="w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-[#0f172a] placeholder:text-[#64748b] outline-none"
            />
          </div>

          <div>
            <label htmlFor="contact-role" className="block text-xs font-medium text-[#0f172a] mb-1">
              Role / Title
            </label>
            <input
              id="contact-role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Talent Acquisition Specialist"
              className="w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-[#0f172a] placeholder:text-[#64748b] outline-none"
            />
          </div>

          <div>
            <label htmlFor="contact-email" className="block text-xs font-medium text-[#0f172a] mb-1">
              Email address
            </label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rachel.tan@company.com"
              className="w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-[#0f172a] placeholder:text-[#64748b] outline-none"
            />
          </div>

          <div>
            <label htmlFor="contact-phone" className="block text-xs font-medium text-[#0f172a] mb-1">
              Phone number
            </label>
            <input
              id="contact-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+6012-345 6789"
              className="w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-[#0f172a] placeholder:text-[#64748b] outline-none"
            />
          </div>

          <div>
            <label htmlFor="contact-linkedin" className="block text-xs font-medium text-[#0f172a] mb-1">
              LinkedIn profile URL
            </label>
            <input
              id="contact-linkedin"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-[#0f172a] placeholder:text-[#64748b] outline-none"
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Update contact' : 'Add contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

