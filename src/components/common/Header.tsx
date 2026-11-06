import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Plus, 
  BookUp, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Bell, 
  LogOut, 
  Settings,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { db } from '../../services/db';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenAddBook?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenAddBook }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  
  const stats = db.getDashboardStats();

  // Page title mapping
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard Overview';
      case '/books': return 'Book Inventory & Catalogue';
      case '/students': return 'Student Registry';
      case '/search': return 'Search Catalogue';
      case '/issue-book': return 'Issue Book to Student';
      case '/return-book': return 'Return Book & Fines';
      case '/fines': return 'Overdue Fine Management';
      case '/transactions': return 'Circulation & Transaction History';
      case '/settings': return 'System Settings';
      default: return 'Online Library Management';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(quickSearch.trim())}`);
      setQuickSearch('');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {getPageTitle()}
          </h2>
          <p className="hidden md:block text-xs text-slate-500 font-medium">
            Academic Year 2026–2027 • Standard Circulation
          </p>
        </div>
      </div>

      {/* Middle: Quick search bar */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Quick search books by title, author, ISBN..."
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-hidden transition shadow-2xs"
          />
        </div>
      </form>

      {/* Right: Quick actions & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Supabase status chip */}
        <div 
          onClick={() => navigate('/settings')}
          title={isSupabaseConfigured ? 'Connected to Supabase PostgreSQL' : 'Using High-Performance Persistent Local Database. Click Settings to view/export SQL.'}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer border transition ${
            isSupabaseConfigured
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{isSupabaseConfigured ? 'Supabase Live' : 'Local DB Active'}</span>
        </div>

        {/* Action: Issue Book shortcut */}
        <button
          onClick={() => navigate('/issue-book')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-xl border border-blue-200/80 transition"
        >
          <BookUp className="w-3.5 h-3.5" />
          <span>Issue Book</span>
        </button>

        {/* Action: Add Book modal trigger */}
        {onOpenAddBook && (
          <button
            onClick={onOpenAddBook}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Book</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}

        {/* Overdue Notification Bell */}
        <button
          onClick={() => navigate('/fines')}
          title={`${stats.overdueBooks} overdue loans`}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
        >
          <Bell className="w-5 h-5" />
          {stats.overdueBooks > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
          )}
        </button>

        {/* Admin Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-slate-100 transition focus:outline-hidden"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'Admin'}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20"
            />
          </button>

          {showProfileMenu && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setShowProfileMenu(false)} 
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-800">{user?.name || 'Administrator'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email || 'admin@library.edu'}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {user?.role || 'Super Admin'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Settings & Configuration</span>
                </button>

                <div className="border-t border-slate-100 my-1" />

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
