import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Search, 
  BookUp, 
  BookDown, 
  CircleDollarSign, 
  History, 
  Settings, 
  LogOut,
  Library,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/db';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const settings = db.getSettings();
  const stats = db.getDashboardStats();

  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Book Management', to: '/books', icon: BookOpen },
    { name: 'Students', to: '/students', icon: Users },
    { name: 'Search Books', to: '/search', icon: Search },
    { name: 'Issue Book', to: '/issue-book', icon: BookUp, highlight: true },
    { name: 'Return Book', to: '/return-book', icon: BookDown, highlight: true },
    { 
      name: 'Overdue Fines', 
      to: '/fines', 
      icon: CircleDollarSign, 
      badge: stats.overdueBooks > 0 ? `${stats.overdueBooks}` : undefined,
      badgeColor: 'bg-rose-500'
    },
    { name: 'Transactions', to: '/transactions', icon: History },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity" 
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/40">
          <NavLink to="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
              <Library className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white tracking-tight truncate leading-tight">
                {settings.library_name.split(' ')[0]} Library
              </h1>
              <p className="text-[11px] font-medium text-blue-400 tracking-wide uppercase">Admin Portal</p>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Core Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span className="truncate">{item.name}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${item.badgeColor || 'bg-blue-500'}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Fine Alert Footer */}
        {stats.pendingFines > 0 && (
          <div className="px-4 py-3 mx-3 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
            <div>
              <span className="font-semibold block">Pending Fines</span>
              <span className="text-[11px] opacity-80">{stats.overdueBooks} overdue books</span>
            </div>
            <span className="font-bold text-sm text-amber-400">{settings.currency_symbol}{stats.pendingFines}</span>
          </div>
        )}

        {/* Admin Profile & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-850 transition">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'Admin'}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/30"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@library.edu'}</p>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
