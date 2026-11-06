import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { db } from '../services/db';
import { BookIssue } from '../services/types';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';

export const TransactionsPage: React.FC = () => {
  const { success } = useToast();

  const [transactions, setTransactions] = useState<BookIssue[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Issued' | 'Returned' | 'Overdue'>('All');
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const settings = db.getSettings();

  const loadTransactions = async () => {
    setLoading(true);
    const data = await db.getTransactions();
    setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.id.toLowerCase().includes(q) ||
      t.student_name.toLowerCase().includes(q) ||
      t.student_id.toLowerCase().includes(q) ||
      t.book_title.toLowerCase().includes(q) ||
      t.book_isbn.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const issueTime = new Date(t.issue_date).getTime();
      const now = new Date().getTime();
      const diffDays = Math.floor((now - issueTime) / (1000 * 60 * 60 * 24));
      if (dateFilter === '7days') matchesDate = diffDays <= 7;
      if (dateFilter === '30days') matchesDate = diffDays <= 30;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginated = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Student Name',
      'Student ID',
      'Book Title',
      'ISBN',
      'Issue Date',
      'Due Date',
      'Return Date',
      'Status',
      'Fine Amount',
      'Fine Paid',
    ];

    const rows = filteredTransactions.map((t) => [
      t.id,
      `"${t.student_name}"`,
      t.student_id,
      `"${t.book_title.replace(/"/g, '""')}"`,
      t.book_isbn,
      t.issue_date,
      t.due_date,
      t.return_date || 'Pending',
      t.status,
      t.fine_amount,
      t.fine_paid ? 'Yes' : 'No',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `library_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Transaction records exported as CSV successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Circulation & Transaction History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit trail of all book issues, due dates, returns, and historical penalty events
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filteredTransactions.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl border border-slate-200/80 shadow-2xs transition self-start sm:self-auto disabled:opacity-40"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Transaction ID, student name, ID, book title..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
            >
              <option value="All">All Statuses ({transactions.length})</option>
              <option value="Issued">Issued (Active Loans)</option>
              <option value="Returned">Returned (Completed)</option>
              <option value="Overdue">Overdue (Action Required)</option>
            </select>
          </div>

          <div>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
            >
              <option value="all">All Dates</option>
              <option value="7days">Issued Last 7 Days</option>
              <option value="30days">Issued Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
          Loading circulation history...
        </div>
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Transactions Found"
          description="No circulation history records match your search query and filters."
          actionText={searchQuery ? 'Clear Filters' : undefined}
          onAction={() => {
            setSearchQuery('');
            setStatusFilter('All');
            setDateFilter('all');
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Student Patron</th>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Return Date</th>
                  <th className="py-3 px-4 text-center">Fine (₹)</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {paginated.map((t) => {
                  const isReturned = t.status === 'Returned';
                  const isOverdue = t.status === 'Overdue';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-700 whitespace-nowrap">
                        {t.id}
                      </td>

                      {/* Student */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900">{t.student_name}</p>
                        <p className="font-mono text-[11px] text-slate-500">{t.student_id}</p>
                      </td>

                      {/* Book */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-slate-800 truncate">{t.book_title}</p>
                        <p className="font-mono text-[11px] text-slate-400">{t.book_isbn}</p>
                      </td>

                      {/* Issue Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {t.issue_date}
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                          {t.due_date}
                        </span>
                      </td>

                      {/* Return Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {t.return_date ? (
                          <span className="font-semibold text-emerald-700">{t.return_date}</span>
                        ) : (
                          <span className="text-slate-400 italic">Not Returned</span>
                        )}
                      </td>

                      {/* Fine */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {t.fine_amount > 0 ? (
                          <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                            t.fine_paid ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                          }`}>
                            {settings.currency_symbol}{t.fine_amount} ({t.fine_paid ? 'Paid' : 'Unpaid'})
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Badge
                          variant={isReturned ? 'success' : isOverdue ? 'danger' : 'info'}
                          size="sm"
                        >
                          {t.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length} records
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold px-2 text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
