import React, { useState, useEffect } from 'react';
import { X, BookOpen, Clock, AlertTriangle, CheckCircle2, CircleDollarSign } from 'lucide-react';
import { Student, BookIssue, Fine } from '../../services/types';
import { db } from '../../services/db';
import { Badge } from '../common/Badge';

interface StudentHistoryModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onGoToReturn?: (issueId: string) => void;
}

export const StudentHistoryModal: React.FC<StudentHistoryModalProps> = ({
  isOpen,
  student,
  onClose,
  onGoToReturn,
}) => {
  const [history, setHistory] = useState<{
    issues: BookIssue[];
    fines: Fine[];
    activeCount: number;
    returnedCount: number;
    unpaidFineTotal: number;
  }>({
    issues: [],
    fines: [],
    activeCount: 0,
    returnedCount: 0,
    unpaidFineTotal: 0,
  });

  const [loading, setLoading] = useState(true);
  const settings = db.getSettings();

  useEffect(() => {
    if (student && isOpen) {
      setLoading(true);
      db.getStudentBorrowingHistory(student.id).then((data) => {
        setHistory(data);
        setLoading(false);
      });
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">{student.full_name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono">
                {student.id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {student.department} • {student.course} ({student.year_of_study})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Badges */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200/80 grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium uppercase">Active Borrowed</p>
              <p className="text-sm font-bold text-slate-800">
                {history.activeCount} / {student.max_allowed_books} books
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium uppercase">Returned</p>
              <p className="text-sm font-bold text-slate-800">{history.returnedCount} books</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${history.unpaidFineTotal > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
              <CircleDollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium uppercase">Unpaid Fines</p>
              <p className={`text-sm font-bold ${history.unpaidFineTotal > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {settings.currency_symbol}{history.unpaidFineTotal}
              </p>
            </div>
          </div>
        </div>

        {/* Loan History List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Circulation Log ({history.issues.length} records)
          </h4>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading history...</div>
          ) : history.issues.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No borrowing activity recorded for this student yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
              {history.issues.map((issue) => {
                const isOverdue = issue.status === 'Overdue';
                const isReturned = issue.status === 'Returned';

                return (
                  <div key={issue.id} className="p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs font-bold text-slate-600">{issue.id}</span>
                        <Badge variant={isReturned ? 'success' : isOverdue ? 'danger' : 'info'}>
                          {issue.status}
                        </Badge>
                        {issue.fine_amount > 0 && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            issue.fine_paid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            Fine: {settings.currency_symbol}{issue.fine_amount} ({issue.fine_paid ? 'Paid' : 'Unpaid'})
                          </span>
                        )}
                      </div>

                      <h5 className="text-sm font-bold text-slate-900 truncate">{issue.book_title}</h5>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Issued on <span className="font-medium text-slate-700">{issue.issue_date}</span> • Due on{' '}
                        <span className={`font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                          {issue.due_date}
                        </span>
                        {issue.return_date && (
                          <span> • Returned: <span className="font-medium text-emerald-700">{issue.return_date}</span></span>
                        )}
                      </p>
                    </div>

                    {!isReturned && onGoToReturn && (
                      <button
                        onClick={() => {
                          onClose();
                          onGoToReturn(issue.id);
                        }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition shrink-0"
                      >
                        Process Return
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
