 import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSettingsApi, updateSettingsApi, type AppSettingsData } from '../api/settings';
import { changePasswordApi } from '../api/auth';
import { getUsersApi, createUserApi, type UserItem } from '../api/users';
import { ApiError } from '../api/client';
import {
  Sliders,
  Plus,
  X,
  Check,
  Clock,
  Globe,
  Lock,
  Users,
  ShieldCheck,
  Shield,
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

type TabKey = 'general' | 'security' | 'users';

export const SettingsPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.email?.toLowerCase() === 'markirfan512@gmail.com';

  const [activeTab, setActiveTab] = useState<TabKey>('general');

  // General Settings State
  const [reminderDays, setReminderDays] = useState<number>(7);
  const [sources, setSources] = useState<string[]>([]);
  const [newSource, setNewSource] = useState<string>('');
  const [defaultLocation, setDefaultLocation] = useState<string>('Kuala Lumpur');
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [settingsSuccess, setSettingsSuccess] = useState<boolean>(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Security / Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [pwSuccessMessage, setPwSuccessMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwFieldErrors, setPwFieldErrors] = useState<Record<string, string[]>>({});

  // Users State
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userSuccessMessage, setUserSuccessMessage] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [userFieldErrors, setUserFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    getSettingsApi()
      .then((data: AppSettingsData) => {
        setReminderDays(data.reminder_days || 7);
        setSources(data.sources || []);
        setDefaultLocation(data.default_location || 'Kuala Lumpur');
      })
      .catch((err) => {
        console.error('Failed to load settings:', err);
        setSettingsError('Failed to load app settings.');
      })
      .finally(() => setIsLoadingSettings(false));
  }, []);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await getUsersApi();
      setUsersList(res.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  // General tab actions
  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSource.trim();
    if (!trimmed || sources.includes(trimmed)) return;
    setSources([...sources, trimmed]);
    setNewSource('');
  };

  const handleRemoveSource = (srcToRemove: string) => {
    setSources(sources.filter((s) => s !== srcToRemove));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSuccess(false);
    setSettingsError(null);

    try {
      await updateSettingsApi({
        reminder_days: reminderDays,
        sources,
        default_location: defaultLocation.trim() || 'Kuala Lumpur',
      });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3500);
    } catch (err: unknown) {
      console.error('Failed to update settings:', err);
      setSettingsError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Change password action
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwFieldErrors({});
    setPwSuccessMessage(null);

    if (!currentPassword) {
      setPwError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New password confirmation does not match.');
      return;
    }

    setIsChangingPw(true);
    try {
      const res = await changePasswordApi({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      setPwSuccessMessage(res.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setPwError(err.message);
        if (err.errors) {
          setPwFieldErrors(err.errors);
        }
      } else if (err instanceof Error) {
        setPwError(err.message);
      } else {
        setPwError('Failed to change password. Please check your credentials.');
      }
    } finally {
      setIsChangingPw(false);
    }
  };

  // Add user action
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);
    setUserFieldErrors({});
    setUserSuccessMessage(null);

    if (!newUserName.trim()) {
      setUserError('Name is required.');
      return;
    }
    if (!newUserEmail.trim()) {
      setUserError('Email address is required.');
      return;
    }
    if (newUserPassword.length < 8) {
      setUserError('Password must be at least 8 characters.');
      return;
    }

    setIsCreatingUser(true);
    try {
      const res = await createUserApi({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
      });
      setUserSuccessMessage(`User "${res.user.name}" created successfully.`);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setUsersList((prev) => [res.user, ...prev]);
      setTimeout(() => setUserSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setUserError(err.message);
        if (err.errors) {
          setUserFieldErrors(err.errors);
        }
      } else if (err instanceof Error) {
        setUserError(err.message);
      } else {
        setUserError('Failed to create user. Please try again.');
      }
    } finally {
      setIsCreatingUser(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-[#f0fdfa] text-[#0f766e] flex items-center justify-center border border-[#ccfbf1]">
            <Sliders className="w-4 h-4 stroke-[2]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#0f172a]">
            Settings & Workspace
          </h1>
        </div>
        <p className="text-xs text-[#64748b] mt-1">
          Manage reminder thresholds, portal sources, security, and authorized team accounts.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-[#e2e8f0] gap-6 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`pb-2.5 cursor-pointer transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'general'
              ? 'text-[#0f766e] font-semibold'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>General & Portals</span>
          {activeTab === 'general' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0f766e] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`pb-2.5 cursor-pointer transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'security'
              ? 'text-[#0f766e] font-semibold'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Security & Password</span>
          {activeTab === 'security' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0f766e] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`pb-2.5 cursor-pointer transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'text-[#0f766e] font-semibold'
              : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users & Access</span>
          {activeTab === 'users' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0f766e] rounded-full" />
          )}
        </button>
      </div>

      {/* TAB 1: General & Portals */}
      {activeTab === 'general' && (
        <>
          {isLoadingSettings ? (
            <div className="p-12 text-center text-xs text-[#64748b]">Loading settings...</div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
              {settingsError && (
                <div className="p-3 rounded-[8px] bg-[#fee2e2] border border-[#fecaca] text-[#991b1b] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{settingsError}</span>
                </div>
              )}

              {/* Reminder Threshold Setting */}
              <div className="p-5 rounded-[12px] bg-[#ffffff] border border-[#e2e8f0] space-y-3">
                <div>
                  <h2 className="text-xs font-semibold text-[#0f172a]">
                    Stale application reminder threshold
                  </h2>
                  <p className="text-[#64748b] text-[11px] mt-0.5">
                    Applications in the Applied stage with no reply for this many days will be flagged automatically on your dashboard.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    required
                    value={reminderDays}
                    onChange={(e) => setReminderDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] outline-none tabular-nums font-semibold text-center text-[#0f172a]"
                  />
                  <span className="text-xs text-[#0f172a]">days of inactivity (default: 7 days)</span>
                </div>
              </div>

              {/* Application Sources Setting */}
              <div className="p-5 rounded-[12px] bg-[#ffffff] border border-[#e2e8f0] space-y-4">
                <div>
                  <h2 className="text-xs font-semibold text-[#0f172a]">
                    Pre-listed application portals
                  </h2>
                  <p className="text-[#64748b] text-[11px] mt-0.5">
                    Customize the job sources available in the application form dropdown.
                  </p>
                </div>

                <div className="flex items-center gap-2 max-w-sm">
                  <input
                    type="text"
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    placeholder="e.g. MyFutureJobs, MauKerja, TechStreet"
                    className="flex-1 h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] outline-none text-[#0f172a] placeholder:text-[#64748b]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSource}
                    disabled={!newSource.trim()}
                    className="h-9 px-3 rounded-[8px] bg-[#0f766e] hover:bg-[#115e59] text-[#ffffff] font-medium flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {sources.map((src) => (
                    <span
                      key={src}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] text-xs font-medium"
                    >
                      <span>{src}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSource(src)}
                        className="text-[#94a3b8] hover:text-[#991b1b] p-0.5 cursor-pointer"
                        title={`Remove ${src}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Regional Preferences */}
              <div className="p-5 rounded-[12px] bg-[#ffffff] border border-[#e2e8f0] space-y-4">
                <div>
                  <h2 className="text-xs font-semibold text-[#0f172a]">
                    Regional defaults
                  </h2>
                  <p className="text-[#64748b] text-[11px] mt-0.5">
                    Pre-configured Malaysia regional defaults according to requirements.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#0f172a] mb-1">
                    Default city / area
                  </label>
                  <input
                    type="text"
                    value={defaultLocation}
                    onChange={(e) => setDefaultLocation(e.target.value)}
                    className="w-64 h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] outline-none text-[#0f172a]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px] text-[#64748b]">
                  <div className="p-3.5 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0]">
                    <div className="flex items-center gap-1 text-[#0f172a] font-medium">
                      <Clock className="w-3 h-3 text-[#0f766e]" />
                      Timezone
                    </div>
                    <div className="mt-1 font-semibold text-[#0f172a]">Asia/Kuala_Lumpur</div>
                    <div className="text-[10px] text-[#64748b] mt-0.5">UTC+08:00 Malaysia</div>
                  </div>

                  <div className="p-3.5 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0]">
                    <div className="flex items-center gap-1 text-[#0f172a] font-medium">
                      <Globe className="w-3 h-3 text-[#0f766e]" />
                      Date format
                    </div>
                    <div className="mt-1 font-semibold text-[#0f172a]">DD/MM/YYYY</div>
                    <div className="text-[10px] text-[#64748b] mt-0.5">Malaysian standard</div>
                  </div>

                  <div className="p-3.5 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0]">
                    <div className="text-[#0f172a] font-medium">Currency</div>
                    <div className="mt-1 font-semibold text-[#0f172a]">MYR (RM)</div>
                    <div className="text-[10px] text-[#64748b] mt-0.5">Ringgit Malaysia</div>
                  </div>
                </div>
              </div>

              {/* Submit Bar */}
              <div className="flex items-center justify-between pt-2">
                {settingsSuccess ? (
                  <div className="text-xs text-[#166534] font-medium flex items-center gap-1.5 bg-[#dcfce7] px-3 py-1.5 rounded-[6px] border border-[#bbf7d0]">
                    <Check className="w-4 h-4" />
                    <span>Settings saved successfully.</span>
                  </div>
                ) : (
                  <div />
                )}

                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="h-9 px-5 rounded-[8px] bg-[#0f766e] hover:bg-[#115e59] text-[#ffffff] font-medium cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isSavingSettings ? 'Saving...' : 'Save settings'}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* TAB 2: Security & Password */}
      {activeTab === 'security' && (
        <div className="space-y-6 text-xs">
          <div className="p-6 rounded-[12px] bg-[#ffffff] border border-[#e2e8f0] space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#f0fdfa] text-[#0f766e] flex items-center justify-center border border-[#ccfbf1] shrink-0">
                <ShieldCheck className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-[#0f172a]">
                  Change Password
                </h2>
                <p className="text-[#64748b] text-[11px] mt-0.5 leading-relaxed">
                  Update your authentication credentials. Choose a secure passphrase with at least 8 characters.
                </p>
              </div>
            </div>

            {pwSuccessMessage && (
              <div className="p-3 rounded-[8px] bg-[#dcfce7] border border-[#bbf7d0] text-[#166534] text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{pwSuccessMessage}</span>
              </div>
            )}

            {pwError && (
              <div className="p-3 rounded-[8px] bg-[#fee2e2] border border-[#fecaca] text-[#991b1b] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md pt-2">
              <div>
                <label className="block text-xs font-medium text-[#0f172a] mb-1.5">
                  Current password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className={`w-full h-9 px-3 pr-9 rounded-[8px] bg-[#ffffff] border text-xs text-[#0f172a] placeholder:text-[#64748b] outline-none transition-colors ${
                      pwFieldErrors.current_password
                        ? 'border-[#991b1b] focus:ring-1 focus:ring-[#991b1b]'
                        : 'border-[#e2e8f0] focus:border-[#0f766e]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-2.5 top-2.5 text-[#64748b] hover:text-[#0f172a] cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwFieldErrors.current_password && (
                  <p className="mt-1 text-[11px] text-[#991b1b]">{pwFieldErrors.current_password[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0f172a] mb-1.5">
                  New password (min. 8 characters)
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className={`w-full h-9 px-3 pr-9 rounded-[8px] bg-[#ffffff] border text-xs text-[#0f172a] placeholder:text-[#64748b] outline-none transition-colors ${
                      pwFieldErrors.new_password
                        ? 'border-[#991b1b] focus:ring-1 focus:ring-[#991b1b]'
                        : 'border-[#e2e8f0] focus:border-[#0f766e]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-2.5 top-2.5 text-[#64748b] hover:text-[#0f172a] cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwFieldErrors.new_password && (
                  <p className="mt-1 text-[11px] text-[#991b1b]">{pwFieldErrors.new_password[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0f172a] mb-1.5">
                  Confirm new password
                </label>
                <input
                  type={showNewPw ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border border-[#e2e8f0] focus:border-[#0f766e] text-xs text-[#0f172a] placeholder:text-[#64748b] outline-none transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPw}
                  className="h-9 px-5 rounded-[8px] bg-[#0f766e] hover:bg-[#115e59] text-[#ffffff] font-medium cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isChangingPw ? 'Updating password...' : 'Update password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: Users & Access */}
      {activeTab === 'users' && (
        <div className="space-y-6 text-xs">
          {isAdmin ? (
            /* Add User Form Card (Authorized for Admin only) */
            <div className="p-6 rounded-[12px] bg-[#ffffff] border border-[#e2e8f0] space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-[#f0fdfa] text-[#0f766e] flex items-center justify-center border border-[#ccfbf1] shrink-0">
                  <UserPlus className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-[#0f172a]">
                    Add New User
                  </h2>
                  <p className="text-[#64748b] text-[11px] mt-0.5 leading-relaxed">
                    Register another team member or personal login to access this tracker instance.
                  </p>
                </div>
              </div>

              {userSuccessMessage && (
                <div className="p-3 rounded-[8px] bg-[#dcfce7] border border-[#bbf7d0] text-[#166534] text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{userSuccessMessage}</span>
                </div>
              )}

              {userError && (
                <div className="p-3 rounded-[8px] bg-[#fee2e2] border border-[#fecaca] text-[#991b1b] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{userError}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4 max-w-md pt-2">
                <div>
                  <label className="block text-xs font-medium text-[#0f172a] mb-1.5">
                    Full name / Username
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Sarah"
                    className={`w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border text-xs text-[#0f172a] placeholder:text-[#64748b] outline-none transition-colors ${
                      userFieldErrors.name
                        ? 'border-[#991b1b] focus:ring-1 focus:ring-[#991b1b]'
                        : 'border-[#e2e8f0] focus:border-[#0f766e]'
                    }`}
                  />
                  {userFieldErrors.name && (
                    <p className="mt-1 text-[11px] text-[#991b1b]">{userFieldErrors.name[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#0f172a] mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="e.g. member@company.com"
                    className={`w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border text-xs text-[#0f172a] placeholder:text-[#64748b] outline-none transition-colors ${
                      userFieldErrors.email
                        ? 'border-[#991b1b] focus:ring-1 focus:ring-[#991b1b]'
                        : 'border-[#e2e8f0] focus:border-[#0f766e]'
                    }`}
                  />
                  {userFieldErrors.email && (
                    <p className="mt-1 text-[11px] text-[#991b1b]">{userFieldErrors.email[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#0f172a] mb-1.5">
                    Temporary password (min. 8 characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`w-full h-9 px-3 rounded-[8px] bg-[#ffffff] border text-xs text-[#0f172a] placeholder:text-[#64748b] outline-none transition-colors ${
                      userFieldErrors.password
                        ? 'border-[#991b1b] focus:ring-1 focus:ring-[#991b1b]'
                        : 'border-[#e2e8f0] focus:border-[#0f766e]'
                    }`}
                  />
                  {userFieldErrors.password && (
                    <p className="mt-1 text-[11px] text-[#991b1b]">{userFieldErrors.password[0]}</p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isCreatingUser}
                    className="h-9 px-5 rounded-[8px] bg-[#0f766e] hover:bg-[#115e59] text-[#ffffff] font-medium cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isCreatingUser ? 'Creating user...' : 'Create user'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Restricted Notice for Non-Admin Users */
            <div className="p-5 rounded-[12px] bg-[#f8fafc] border border-[#e2e8f0] flex items-start gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#ffffff] text-[#0f766e] flex items-center justify-center border border-[#e2e8f0] shrink-0">
                <Shield className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-[#0f172a]">
                  User Provisioning Restricted
                </h2>
                <p className="text-[#64748b] text-[11px] mt-0.5 leading-relaxed">
                  Only the primary administrator (<span className="font-semibold text-[#0f172a]">markirfan512@gmail.com</span>) is authorized to add or register new accounts in this system.
                </p>
              </div>
            </div>
          )}

          {/* User List Card */}
          <div className="p-6 rounded-[12px] bg-[#ffffff] border border-[#e2e8f0] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold text-[#0f172a]">
                  Active User Accounts
                </h2>
                <p className="text-[#64748b] text-[11px] mt-0.5">
                  Users registered in the system who can authenticate and manage job applications.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#0f766e] bg-[#f0fdfa] border border-[#ccfbf1] px-2.5 py-0.5 rounded-full">
                {usersList.length} {usersList.length === 1 ? 'user' : 'users'}
              </span>
            </div>

            {isLoadingUsers ? (
              <div className="py-6 text-center text-xs text-[#64748b]">Loading user accounts...</div>
            ) : usersList.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#64748b]">No users found.</div>
            ) : (
              <div className="divide-y divide-[#f1f5f9] border border-[#e2e8f0] rounded-[8px] overflow-hidden">
                {usersList.map((u) => {
                  const isUserAdmin = u.email.toLowerCase() === 'markirfan512@gmail.com';
                  return (
                    <div key={u.id} className="p-3.5 bg-[#ffffff] hover:bg-[#f8fafc] flex items-center justify-between transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f1f5f9] text-[#0f766e] font-semibold text-xs flex items-center justify-center border border-[#e2e8f0]">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[#0f172a]">{u.name}</div>
                          <div className="text-[11px] text-[#64748b]">{u.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {isUserAdmin ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#0f766e] bg-[#f0fdfa] border border-[#ccfbf1] px-2 py-0.5 rounded-full font-semibold">
                            Admin / Owner
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#166534] bg-[#dcfce7] border border-[#bbf7d0] px-2 py-0.5 rounded-full font-medium">
                            Active Member
                          </span>
                        )}
                        <div className="text-[10px] text-[#64748b] mt-0.5">
                          Added {u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB') : 'recently'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
