import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Library, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim()) {
      setFormError('Please enter your administrator email.');
      return;
    }
    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      success('Logged in successfully. Welcome to the Library Admin Portal!');
      navigate(from, { replace: true });
    } else {
      setFormError(result.error || 'Authentication failed. Please verify credentials.');
      error(result.error || 'Invalid credentials');
    }
  };

  const handleFillDemoAdmin = () => {
    setEmail('admin@library.edu');
    setPassword('admin123');
    setFormError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-500/25 mb-4 border border-blue-400/20 animate-in zoom-in-90 duration-300">
            <Library className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Library Admin Portal
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            Online Library Management & Circulation System
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Administrator Sign In</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your authorized staff credentials to continue
            </p>
          </div>

          {formError && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@library.edu"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition shadow-2xs font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> <span>Show</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition shadow-2xs font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Demo Fill Helper */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleFillDemoAdmin}
              className="w-full py-2 px-3 rounded-xl bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 text-xs font-semibold flex items-center justify-center gap-2 border border-blue-200/60 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Fill Default Demo Admin (admin@library.edu / admin123)</span>
            </button>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Protected by Supabase PostgreSQL & Session Tokens</span>
        </div>
      </div>
    </div>
  );
};
