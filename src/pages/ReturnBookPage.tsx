import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  BookDown, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  CircleDollarSign, 
  BookOpen, 
  User, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { db } from '../services/db';
import { BookIssue } from '../services/types';
import { Badge } from '../components/common/Badge';
import { ReturnConfirmModal } from '../components/returns/ReturnConfirmModal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';

export const ReturnBookPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { success, error } = useToast();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('issueId') || '');
  const [issues, setIssues] = useState<BookIssue[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [selectedIssue, setSelectedIssue] = useState<BookIssue | null>(null);

  const settings = db.getSettings();

  const loadData = async () => {
    setLoading(true);
    const all = await db.getTransactions();
    // Only active (Issued or Overdue) loans can be returned!
    const active = all.filter((i) => i.status === 'Issued' || i.status === 'Overdue');
    setIssues(active);
    setLoading(false);

    // If param provided, auto-select if found
    const paramId = searchParams.get('issueId');
    if (paramId) {
      const match = active.find((i) => i.id === paramId);
      if (match) setSelectedIssue(match);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchParams]);

  const filteredIssues = issues.filter((i) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      i.id.toLowerCase().includes(q) ||
      i.student_id.toLowerCase().includes(q) ||
      i.student_name.toLowerCase().includes(q) ||
      i.book_id.toLowerCase().includes(q) ||
      i.book_title.toLowerCase().includes(q) ||
      i.book_isbn.toLowerCase().includes(q)
    );
  });

  const handleReturnConfirm = async (options: {
    return_date: string;
    pay_fine_now: boolean;
    payment_method?: 'Cash' | 'UPI' | 'Card' | 'Online';
  }) => {
    if (!selectedIssue) return;
    try {
      const res = await db.returnBook(selectedIssue.id, options);
      success(
        `Book "${res.issue.book_title}" returned successfully! Inventory stock updated.${
          res.fineAmount > 0 ? ` Overdue fine of ${settings.currency_symbol}${res.fineAmount} recorded.` : ''
        }`
      );
      setSelectedIssue(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Return failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Return Book & Calculate Fines
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Process check-ins, compute live overdue days and automated late penalties, and restock catalogue copies
        </p>
      </div>

      {/* Quick Lookup Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Scan / Search by Transaction ID (e.g. TXN-9021), Student ID (STU-2024-001), or Book Title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-2xl outline-hidden transition shadow-2xs font-medium"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Found <strong className="text-slate-800">{filteredIssues.length}</strong> active borrowed loans ready for check-in
          </span>
          <span className="text-blue-600 font-semibold">
            Late Fine Policy: {settings.currency_symbol}{settings.fine_per_day} / overdue day
          </span>
        </div>
      </div>

      {/* Active Borrowed Books List */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
          Loading borrowed items...
        </div>
      ) : filteredIssues.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={searchQuery ? 'No Matching Active Loans' : 'No Books Currently Borrowed'}
          description={
            searchQuery
              ? `No active borrowed records match "${searchQuery}". Check if the book was already returned.`
              : 'All library books have been safely returned. Zero active loans currently outstanding.'
          }
          actionText={searchQuery ? 'Clear Search Filter' : undefined}
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIssues.map((issue) => {
            const today = db.getTodayString();
            const overdueDays = db.calculateOverdueDays(issue.due_date, today);
            const isOverdue = overdueDays > 0;
            const estimatedFine = isOverdue ? overdueDays * settings.fine_per_day : 0;

            return (
              <div
                key={issue.id}
                className={`bg-white rounded-3xl p-5 border shadow-xs hover:shadow-md transition flex flex-col justify-between ${
                  isOverdue ? 'border-rose-200 ring-1 ring-rose-200/50' : 'border-slate-200/80'
                }`}
              >
                <div>
                  {/* Top Tags */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {issue.id}
                    </span>
                    <Badge variant={isOverdue ? 'danger' : 'info'} size="sm">
                      {isOverdue ? `Overdue by ${overdueDays}d` : 'Active Loan'}
                    </Badge>
                  </div>

                  {/* Book Title */}
                  <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-1 mb-1">
                    {issue.book_title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    ISBN: <span className="font-mono">{issue.book_isbn}</span>
                  </p>

                  {/* Borrower Details Box */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Borrower:</span>
                      <span className="font-bold text-slate-800">{issue.student_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Student ID:</span>
                      <span className="font-mono font-semibold text-slate-700">{issue.student_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Issued Date:</span>
                      <span className="font-medium text-slate-700">{issue.issue_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Due Date:</span>
                      <span className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                        {issue.due_date}
                      </span>
                    </div>
                  </div>

                  {/* Overdue alert / Fine preview */}
                  {isOverdue ? (
                    <div className="px-3.5 py-2.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Late Fine Applicable:</span>
                      </div>
                      <span className="font-extrabold text-sm text-rose-700">
                        {settings.currency_symbol}{estimatedFine}
                      </span>
                    </div>
                  ) : (
                    <div className="px-3.5 py-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>On Schedule (No Fine)</span>
                      </div>
                      <span className="font-bold text-emerald-700">{settings.currency_symbol}0</span>
                    </div>
                  )}
                </div>

                {/* Return Action button */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => setSelectedIssue(issue)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                  >
                    <BookDown className="w-4 h-4" />
                    <span>Check In / Process Return</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return confirmation modal */}
      <ReturnConfirmModal
        isOpen={Boolean(selectedIssue)}
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onConfirm={handleReturnConfirm}
      />
    </div>
  );
};
