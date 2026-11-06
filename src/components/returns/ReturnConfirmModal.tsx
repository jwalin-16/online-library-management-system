import React, { useState } from 'react';
import { X, BookDown, AlertCircle, CheckCircle2, CircleDollarSign } from 'lucide-react';
import { BookIssue } from '../../services/types';
import { db } from '../../services/db';

interface ReturnConfirmModalProps {
  isOpen: boolean;
  issue: BookIssue | null;
  onClose: () => void;
  onConfirm: (options: {
    return_date: string;
    pay_fine_now: boolean;
    payment_method?: 'Cash' | 'UPI' | 'Card' | 'Online';
  }) => Promise<void>;
}

export const ReturnConfirmModal: React.FC<ReturnConfirmModalProps> = ({
  isOpen,
  issue,
  onClose,
  onConfirm,
}) => {
  const [returnDate, setReturnDate] = useState(db.getTodayString());
  const [payFineNow, setPayFineNow] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Online'>('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const settings = db.getSettings();

  if (!isOpen || !issue) return null;

  // Calculate overdue days and fine dynamically based on selected return date
  const overdueDays = db.calculateOverdueDays(issue.due_date, returnDate);
  const fineAmount = overdueDays > 0 ? overdueDays * settings.fine_per_day : 0;
  const isOverdue = overdueDays > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm({
        return_date: returnDate,
        pay_fine_now: isOverdue ? payFineNow : true,
        payment_method: paymentMethod,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-xl">
              <BookDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Process Book Return</h3>
              <p className="text-xs text-slate-300">Transaction: {issue.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Book:</span>
              <span className="font-bold text-slate-900 text-right max-w-[70%]">{issue.book_title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Borrower:</span>
              <span className="font-medium text-slate-800">{issue.student_name} ({issue.student_id})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Issue Date:</span>
              <span className="font-medium text-slate-700">{issue.issue_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Original Due Date:</span>
              <span className="font-bold text-slate-800">{issue.due_date}</span>
            </div>
          </div>

          {/* Return Date selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Actual Return Date
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
            />
          </div>

          {/* Overdue & Fine Status Banner */}
          {isOverdue ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-900">Overdue by {overdueDays} Day(s)</h4>
                  <p className="text-xs text-rose-700 mt-0.5">
                    Rate: {settings.currency_symbol}{settings.fine_per_day} per overdue day. Total fine: <span className="font-extrabold text-sm">{settings.currency_symbol}{fineAmount}</span>.
                  </p>
                </div>
              </div>

              {/* Payment checkbox */}
              <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-rose-900">
                  <input
                    type="checkbox"
                    checked={payFineNow}
                    onChange={(e) => setPayFineNow(e.target.checked)}
                    className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span>Collect and mark fine as Paid now</span>
                </label>
              </div>

              {payFineNow && (
                <div>
                  <label className="block text-[11px] font-semibold text-rose-900 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-rose-300 rounded-xl outline-hidden"
                  >
                    <option value="Cash">Cash at Desk</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Online">Online NetBanking</option>
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold">Returned On Time (or Early)</p>
                <p className="text-[11px] text-emerald-700">No overdue fines applicable. Total fine is ₹0.</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing...' : 'Confirm Return'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
