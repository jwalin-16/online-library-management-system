import React, { useEffect } from 'react';
import { CheckCircle2, Printer, Copy, Check, X, Calendar, BookOpen, User, Hash } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BookIssue } from '../../services/types';
import { db } from '../../services/db';

interface IssueReceiptModalProps {
  isOpen: boolean;
  issue: BookIssue | null;
  onClose: () => void;
}

export const IssueReceiptModal: React.FC<IssueReceiptModalProps> = ({
  isOpen,
  issue,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);
  const settings = db.getSettings();

  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#3b82f6', '#10b981', '#f59e0b'],
        });
      } catch (e) {
        // Safe confetti fallback
      }
    }
  }, [isOpen]);

  if (!isOpen || !issue) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(issue.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner backdrop-blur-xs">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>

          <h3 className="text-xl font-bold tracking-tight">Book Issued Successfully</h3>
          <p className="text-xs text-blue-100 mt-1">Official Library Circulation Slip</p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-mono font-semibold">
            <span>{issue.id}</span>
            <button 
              onClick={handleCopyId}
              title="Copy ID"
              className="hover:text-amber-300 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Receipt Details */}
        <div className="p-6 space-y-4">
          <div className="space-y-3 divide-y divide-slate-100 text-sm">
            <div className="flex items-start justify-between gap-3 pt-2">
              <span className="text-slate-500 text-xs font-semibold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                Book Title
              </span>
              <span className="text-right font-bold text-slate-800 text-xs sm:text-sm max-w-[65%]">
                {issue.book_title}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-slate-500 text-xs font-semibold flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                ISBN / Book ID
              </span>
              <span className="font-mono text-xs text-slate-700">{issue.book_isbn}</span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-slate-500 text-xs font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                Student Name
              </span>
              <span className="font-bold text-slate-800 text-xs sm:text-sm">
                {issue.student_name} <span className="text-xs font-mono font-normal text-slate-500">({issue.student_id})</span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-slate-500 text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Issue Date
              </span>
              <span className="font-semibold text-slate-700 text-xs sm:text-sm">{issue.issue_date}</span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
              <span className="text-blue-900 text-xs font-bold flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Return Due Date
              </span>
              <span className="font-extrabold text-blue-700 text-sm">{issue.due_date}</span>
            </div>
          </div>

          {/* Policy Note */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
            <span className="font-bold">Overdue Policy:</span> Please return on or before {issue.due_date}. An overdue fine of {settings.currency_symbol}{settings.fine_per_day} per day applies for late returns.
          </div>
        </div>

        {/* Buttons */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Slip</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
