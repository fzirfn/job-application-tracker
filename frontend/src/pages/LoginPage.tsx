import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { Compass, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.errors) {
          setFieldErrors(err.errors);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while signing in.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center px-4 py-12 select-none">
      <div className="w-full max-w-sm">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-[10px] bg-[#0f766e] text-[#ffffff] flex items-center justify-center font-bold">
            <Compass className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-[#0f172a]">
            KerjaTrack
          </span>
        </div>

        {/* Login Box */}
        <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-[12px] p-7">
          <div className="mb-6">
            <h1 className="font-serif text-2xl font-normal text-[#0f172a] tracking-tight italic">
              Welcome back
            </h1>
            <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
              Sign in to your private job application pipeline & career journal.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-[8px] bg-[#fee2e2] border border-[#fecaca] text-[#991b1b] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-[#0f172a] mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className={`w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border text-xs text-[#0f172a] placeholder:text-[#64748b] outline-none transition-colors ${
                  fieldErrors.email
                    ? 'border-[#991b1b] focus:ring-1 focus:ring-[#991b1b]'
                    : 'border-[#e2e8f0] focus:border-[#0f766e]'
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-[11px] text-[#991b1b]">{fieldErrors.email[0]}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-[#0f172a]"
                >
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border text-xs text-[#0f172a] placeholder:text-[#64748b] outline-none transition-colors ${
                  fieldErrors.password
                    ? 'border-[#991b1b] focus:ring-1 focus:ring-[#991b1b]'
                    : 'border-[#e2e8f0] focus:border-[#0f766e]'
                }`}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-[11px] text-[#991b1b]">{fieldErrors.password[0]}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-9 mt-2 rounded-[8px] bg-[#0f766e] hover:bg-[#115e59] text-[#ffffff] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign in'}</span>
              {!isSubmitting && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>
        </div>

        {/* Region & time note */}
        <p className="text-center text-[11px] text-[#64748b] mt-6">
          Malaysia Defaults · Asia/Kuala_Lumpur · DD/MM/YYYY · MYR
        </p>
      </div>
    </div>
  );
};

