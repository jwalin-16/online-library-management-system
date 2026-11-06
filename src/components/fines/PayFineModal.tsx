import React, { useState } from 'react';
import { X, CircleDollarSign, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Fine } from '../../services/types';
import { db } from '../../services/db';

interface PayFineModalProps {
  isOpen: boolean;
  fine: Fine | null;
  onClose: () => void;
  onPaySuccess: (fineId: string, method: 'Cash' | 'UPI' | 'Card' | 'Online') => Promise<void>;
  onWaiveSuccess?: (fineId: string, reason: string) => Promise<void>;
}

export const PayFineModal: React.FC<PayFineModalProps> = ({
  isOpen,
  fine,
  onClose,
  onPaySuccess,
  onWaiveSuccess,
}) => {
  const [method, setMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Online'>('Cash');
  const [isWaiving, setIsWaiving] = useState(false);
  const [waiveReason, setWaiveReason] = useState('Medical leave approved by Dean');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const settings = db.getSettings();

  if (!isOpen || !fine) return null;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isWaiving && onWaiveSuccess) {
        await onWaiveSuccess(fine.id, waiveReason);
      } else {
        await onPaySuccess(fine.id, method);
      }
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
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-xl">
              <CircleDollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Settle Fine Record</h3>
              <p className="text-xs text-slate-300">Reference: {fine.id}</p>
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
        <form onSubmit={handlePay} className="p-6 space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Student:</span>
              <span className="font-bold text-slate-800">{fine.student_name} ({fine.student_id})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Book:</span>
              <span className="font-medium text-slate-800 text-right max-w-[65%] truncate">{fine.book_title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Overdue Duration:</span>
              <span className="font-bold text-rose-600">{fine.overdue_days} days late</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-slate-700 font-bold">Total Payable:</span>
              <span className="text-xl font-extrabold text-slate-900">{settings.currency_symbol}{fine.amount}</span>
            </div>
          </div>

          {/* Toggle between payment and waiver */}
          <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setIsWaiving(false)}
              className={`flex-1 py-2 rounded-lg transition ${
                !isWaiving ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Collect Payment
            </button>
            <button
              type="button"
              onClick={() => setIsWaiving(true)}
              className={`flex-1 py-2 rounded-lg transition ${
                isWaiving ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Waive Fine (Special)
            </button>
          </div>

          {!isWaiving ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Payment Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Cash', 'UPI', 'Card', 'Online'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition text-center ${
                      method === m
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {m === 'Cash' ? '💵 Cash at Counter' : m === 'UPI' ? '📱 UPI / QR Code' : m === 'Card' ? '💳 Debit / Card' : '🌐 Net Banking'}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Waiver Justification / Dean Approval
              </label>
              <input
                type="text"
                value={waiveReason}
                onChange={(e) => setWaiveReason(e.target.value)}
                placeholder="Reason for waiving fine..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-500 rounded-xl outline-hidden"
              />
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
              className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 ${
                isWaiving ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing...' : isWaiving ? 'Confirm Waiver' : 'Confirm & Generate Receipt'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
