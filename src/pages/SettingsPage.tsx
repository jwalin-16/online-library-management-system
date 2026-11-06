import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Building, 
  User, 
  Lock, 
  ShieldCheck, 
  Database, 
  Save, 
  RotateCcw, 
  Copy, 
  Check, 
  LogOut, 
  AlertCircle,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { db } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { isSupabaseConfigured, getSupabaseStatus } from '../lib/supabase';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'general' | 'policy' | 'admin' | 'database'>('general');

  // Library & Policy settings
  const [settings, setSettings] = useState(db.getSettings());
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Admin profile
  const [adminName, setAdminName] = useState(user?.name || '');
  const [adminEmail, setAdminEmail] = useState(user?.email || '');
  const [adminRole, setAdminRole] = useState(user?.role || 'Super Admin');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // SQL schema copy state
  const [copiedSql, setCopiedSql] = useState(false);

  // Reset database modal
  const [showResetModal, setShowResetModal] = useState(false);

  const supabaseStatus = getSupabaseStatus();

  // Save General & Policy settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const updated = await db.updateSettings(settings);
      setSettings(updated);
      success('Library configuration and circulation policies updated successfully.');
    } catch (err: any) {
      error(err.message || 'Failed to update settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Save Admin profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: adminName.trim(),
        email: adminEmail.trim(),
        role: adminRole as any,
      });
      success('Administrator profile updated successfully.');
    } catch (err: any) {
      error(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    const storedPass = localStorage.getItem('lms_admin_password') || 'admin123';
    if (currentPassword !== storedPass) {
      setPasswordError('Current password does not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsSavingPassword(true);
    localStorage.setItem('lms_admin_password', newPassword);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsSavingPassword(false);
    success('Administrator password changed successfully. Use the new password on next sign in.');
  };

  // Copy PostgreSQL schema script
  const handleCopySchema = () => {
    const sql = db.getPostgresSchemaSql();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    success('PostgreSQL / Supabase schema SQL script copied to clipboard!');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Reset database to defaults
  const handleResetData = () => {
    db.resetToDefaults();
    setSettings(db.getSettings());
    setShowResetModal(false);
    success('Library database reset to initial demonstration records successfully.');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          System Settings & Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure institutional details, lending fine rates, administrator credentials, and database schemas
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        {[
          { id: 'general', label: 'Library Details', icon: Building },
          { id: 'policy', label: 'Circulation & Fine Policy', icon: SettingsIcon },
          { id: 'admin', label: 'Admin Profile & Security', icon: User },
          { id: 'database', label: 'Supabase & Database SQL', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: General Library Info */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Library Institutional Information</h3>
            <p className="text-xs text-slate-500">Official details printed on receipts and circulation slips</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Library Name
              </label>
              <input
                type="text"
                value={settings.library_name}
                onChange={(e) => setSettings({ ...settings, library_name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parent University / Institution
              </label>
              <input
                type="text"
                value={settings.institution_name}
                onChange={(e) => setSettings({ ...settings, institution_name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.contact_email}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Help Desk Phone
              </label>
              <input
                type="text"
                value={settings.contact_phone}
                onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Physical Campus Address
              </label>
              <textarea
                rows={2}
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden resize-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? 'Saving...' : 'Save Library Information'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Policy & Circulation */}
      {activeTab === 'policy' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Lending Rules & Overdue Fine Policies</h3>
            <p className="text-xs text-slate-500">Fine calculations and duration limits automatically apply to all book transactions</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fine per Day */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Fine Rate Per Overdue Day ({settings.currency_symbol})
              </label>
              <p className="text-[11px] text-slate-500">
                Penalty levied per 24 hours past the scheduled due date. Default is ₹5.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="font-bold text-base text-slate-700">{settings.currency_symbol}</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={settings.fine_per_day}
                  onChange={(e) => setSettings({ ...settings, fine_per_day: parseFloat(e.target.value) || 0 })}
                  className="w-32 px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-blue-500 outline-hidden"
                />
              </div>
            </div>

            {/* Borrowing Period */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Standard Borrowing Period (Days)
              </label>
              <p className="text-[11px] text-slate-500">
                Default loan timeframe given to students upon issuing books. Default is 14 days.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={settings.default_borrowing_days}
                  onChange={(e) => setSettings({ ...settings, default_borrowing_days: parseInt(e.target.value) || 1 })}
                  className="w-32 px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-blue-500 outline-hidden"
                />
                <span className="text-xs font-medium text-slate-600">days</span>
              </div>
            </div>

            {/* Max Books */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Maximum Books Quota per Student
              </label>
              <p className="text-[11px] text-slate-500">
                Maximum concurrent active borrowed copies allowed per registered student account.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.max_books_per_student}
                  onChange={(e) => setSettings({ ...settings, max_books_per_student: parseInt(e.target.value) || 1 })}
                  className="w-32 px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-blue-500 outline-hidden"
                />
                <span className="text-xs font-medium text-slate-600">books concurrently</span>
              </div>
            </div>

            {/* Currency Symbol */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Display Currency Symbol
              </label>
              <p className="text-[11px] text-slate-500">
                Symbol used for fine invoices, reports, and payments (e.g. ₹ or $).
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  maxLength={3}
                  value={settings.currency_symbol}
                  onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
                  className="w-24 px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-blue-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? 'Saving...' : 'Update Circulation Policies'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Admin Profile & Security */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Administrator Profile</h3>
              <p className="text-xs text-slate-500">Update staff details and active account role</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administrator Name
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Login Account)
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role Classification
                </label>
                <select
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden"
                >
                  <option value="Super Admin">Super Admin (Full Access)</option>
                  <option value="Librarian">Librarian (Circulation & Catalogue)</option>
                  <option value="Assistant">Assistant (Circulation Desk)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
              >
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>

          {/* Password Change Form */}
          <form onSubmit={handleChangePassword} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Change Admin Password</h3>
              <p className="text-xs text-slate-500">Secure your administrator account</p>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Min. 6 chars"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Default password for demo account is `admin123`.</span>
              <button
                type="submit"
                disabled={isSavingPassword}
                className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition"
              >
                {isSavingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>

          {/* Session Logout Action */}
          <div className="p-6 bg-rose-50/60 rounded-3xl border border-rose-200/80 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-rose-900">Sign Out of Admin Portal</h4>
              <p className="text-xs text-rose-700 mt-0.5">End active administrator session on this browser</p>
            </div>
            <button
              onClick={() => logout()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Database & Supabase */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${isSupabaseConfigured ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Database Engine: {isSupabaseConfigured ? 'Supabase Live Connection' : 'High-Performance Persistent Engine'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isSupabaseConfigured
                      ? `Connected to remote Supabase endpoint: ${supabaseStatus.url}`
                      : 'Running with complete browser persistence across reloads. Ready for Supabase connection via environment variables.'}
                  </p>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isSupabaseConfigured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {isSupabaseConfigured ? 'Connected' : 'Active & Persistent'}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-slate-800">
                To connect to an external Supabase PostgreSQL Project:
              </p>
              <p>1. Open your project in Supabase or create a free project at <span className="font-mono text-blue-600">supabase.com</span>.</p>
              <p>2. Set <span className="font-mono text-slate-800">VITE_SUPABASE_URL</span> and <span className="font-mono text-slate-800">VITE_SUPABASE_ANON_KEY</span> in environment variables.</p>
              <p>3. Execute the SQL migration script below in your Supabase SQL Editor to initialize all 5 tables and RLS security policies.</p>
            </div>
          </div>

          {/* SQL Script Viewer */}
          <div className="bg-slate-900 text-slate-200 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Supabase PostgreSQL Schema Script</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                    5 Tables + RLS Policies
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tables: `admins`, `books`, `students`, `book_issues`, `fines` with check constraints
                </p>
              </div>

              <button
                onClick={handleCopySchema}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 max-h-72 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre leading-relaxed">
              {db.getPostgresSchemaSql()}
            </div>
          </div>

          {/* Reset / Re-seed Data */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Reset Demonstration Data</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Restores standard seed catalog of 10 books, 7 students, sample active/overdue issues, and fine records.
              </p>
            </div>

            <button
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition flex items-center gap-2 shrink-0"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Reset Sample Data</span>
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        title="Reset Library Data to Initial Demo State"
        message="This will reload the demonstration catalogue with realistic sample books, registered students, active loans, and fine records. Any unsaved custom entries will be reset."
        confirmLabel="Reset Data"
        cancelLabel="Keep Current Data"
        onConfirm={handleResetData}
        onClose={() => setShowResetModal(false)}
      />
    </div>
  );
};
