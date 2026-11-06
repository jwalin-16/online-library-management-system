import React, { useState, useEffect } from 'react';
import { 
  CircleDollarSign, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Receipt, 
  ArrowDownRight, 
  Wallet,
  ShieldAlert,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { db } from '../services/db';
import { Fine } from '../services/types';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import { PayFineModal } from '../components/fines/PayFineModal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';

export const FinesPage: React.FC = () => {
  const { success, error } = useToast();

  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Unpaid' | 'Paid' | 'Waived'>('All');

  // Modal
  const [selectedFineToPay, setSelectedFineToPay] = useState<Fine | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const settings = db.getSettings();
  const stats = db.getDashboardStats();

  const loadFines = async () => {
    setLoading(true);
    const data = await db.getFines();
    setFines(data);
    setLoading(false);
  };

  useEffect(() => {
    loadFines();
  }, []);

  const filteredFines = fines.filter((f) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      f.student_name.toLowerCase().includes(q) ||
      f.student_id.toLowerCase().includes(q) ||
      f.book_title.toLowerCase().includes(q) ||
      f.id.toLowerCase().includes(q) ||
      (f.receipt_no && f.receipt_no.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'All' || f.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredFines.length / pageSize) || 1;
  const paginatedFines = filteredFines.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePaySuccess = async (fineId: string, method: 'Cash' | 'UPI' | 'Card' | 'Online') => {
    try {
      const updated = await db.payFine(fineId, method);
      success(`Fine of ${settings.currency_symbol}${updated.amount} settled via ${method}. Receipt: ${updated.receipt_no}`);
      loadFines();
    } catch (err: any) {
      error(err.message || 'Payment failed');
    }
  };

  const handleWaiveSuccess = async (fineId: string, reason: string) => {
    try {
      const updated = await db.waiveFine(fineId, reason);
      success(`Fine of ${settings.currency_symbol}${updated.amount} waived successfully. Reason recorded.`);
      loadFines();
    } catch (err: any) {
      error(err.message || 'Waiver failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Overdue Fine Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Track overdue penalties, record fee collections, and issue official payment receipts
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Pending Fines"
          value={`${settings.currency_symbol}${stats.pendingFines}`}
          subtitle={`${fines.filter((f) => f.status === 'Unpaid').length} unpaid records`}
          icon={AlertCircle}
          colorScheme={stats.pendingFines > 0 ? 'rose' : 'emerald'}
        />

        <StatCard
          title="Total Collected Fines"
          value={`${settings.currency_symbol}${stats.collectedFines}`}
          subtitle="Cleared revenue at counter"
          icon={Wallet}
          colorScheme="emerald"
        />

        <StatCard
          title="Current Daily Rate"
          value={`${settings.currency_symbol}${settings.fine_per_day} / day`}
          subtitle="Configured in library policy"
          icon={CircleDollarSign}
          colorScheme="blue"
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search fines by student name, ID, book title, or receipt number..."
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
              <option value="All">All Fines ({fines.length})</option>
              <option value="Unpaid">Unpaid Only</option>
              <option value="Paid">Paid / Settled</option>
              <option value="Waived">Waived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fines Table */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
          Loading overdue fine records...
        </div>
      ) : filteredFines.length === 0 ? (
        <EmptyState
          icon={CircleDollarSign}
          title="No Fine Records"
          description={
            searchQuery || statusFilter !== 'All'
              ? 'No fines match the current search or status filter.'
              : 'There are no overdue fines recorded in the system.'
          }
          actionText={searchQuery ? 'Reset Filters' : undefined}
          onAction={() => {
            setSearchQuery('');
            setStatusFilter('All');
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Fine ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4 text-center">Overdue Days</th>
                  <th className="py-3 px-4 text-center">Amount</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {paginatedFines.map((fine) => {
                  const isUnpaid = fine.status === 'Unpaid';
                  const isPaid = fine.status === 'Paid';
                  const isWaived = fine.status === 'Waived';

                  return (
                    <tr key={fine.id} className="hover:bg-slate-50/80 transition">
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-600 whitespace-nowrap">
                        {fine.id}
                      </td>

                      {/* Student */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900">{fine.student_name}</p>
                        <p className="text-[11px] font-mono text-slate-500">{fine.student_id}</p>
                      </td>

                      {/* Book */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-slate-800 truncate">{fine.book_title}</p>
                        <p className="text-[11px] text-slate-500">Ref: {fine.issue_id}</p>
                      </td>

                      {/* Timeline */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                        <p>Due: <span className="font-semibold text-rose-600">{fine.due_date}</span></p>
                        <p className="text-[11px] text-slate-400">
                          {fine.return_date ? `Returned: ${fine.return_date}` : 'Still Not Returned'}
                        </p>
                      </td>

                      {/* Overdue Days */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-bold text-rose-600">
                        {fine.overdue_days} days
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="text-base font-extrabold text-slate-900">
                          {settings.currency_symbol}{fine.amount}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Badge
                          variant={isPaid ? 'success' : isWaived ? 'purple' : 'danger'}
                          size="sm"
                        >
                          {fine.status}
                        </Badge>
                        {isPaid && fine.payment_method && (
                          <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
                            via {fine.payment_method}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isUnpaid ? (
                          <button
                            onClick={() => setSelectedFineToPay(fine)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-2xs transition"
                          >
                            Collect Fine
                          </button>
                        ) : isPaid ? (
                          <span className="font-mono text-[11px] text-emerald-700 font-semibold px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
                            {fine.receipt_no || 'Paid'}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Waived</span>
                        )}
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
              {Math.min(currentPage * pageSize, filteredFines.length)} of {filteredFines.length} records
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

      {/* Pay Fine Modal */}
      <PayFineModal
        isOpen={Boolean(selectedFineToPay)}
        fine={selectedFineToPay}
        onClose={() => setSelectedFineToPay(null)}
        onPaySuccess={handlePaySuccess}
        onWaiveSuccess={handleWaiveSuccess}
      />
    </div>
  );
};
