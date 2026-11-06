import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  BookUp, 
  Search, 
  UserCheck, 
  BookOpen, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { db } from '../services/db';
import { Book, Student, BookIssue } from '../services/types';
import { IssueReceiptModal } from '../components/issues/IssueReceiptModal';
import { useToast } from '../contexts/ToastContext';

export const IssueBookPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  // Input states
  const [studentQuery, setStudentQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [bookQuery, setBookQuery] = useState(searchParams.get('bookId') || '');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const [issueDate, setIssueDate] = useState(db.getTodayString());
  const [borrowDays, setBorrowDays] = useState(14);
  const [notes, setNotes] = useState('');

  const [studentHistory, setStudentHistory] = useState<{
    activeCount: number;
    unpaidFineTotal: number;
  }>({ activeCount: 0, unpaidFineTotal: 0 });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedResult, setIssuedResult] = useState<BookIssue | null>(null);
  const [formError, setFormError] = useState('');

  const settings = db.getSettings();

  useEffect(() => {
    Promise.all([db.getStudents(), db.getBooks()]).then(([sList, bList]) => {
      setStudents(sList);
      setBooks(bList);

      // Pre-select book if query param provided
      const paramBookId = searchParams.get('bookId');
      if (paramBookId) {
        const found = bList.find((b) => b.id === paramBookId || b.isbn === paramBookId);
        if (found) {
          setSelectedBook(found);
          setBookQuery(found.title);
        }
      }
    });
  }, [searchParams]);

  // Handle student search & selection
  const handleStudentSelect = async (student: Student) => {
    setSelectedStudent(student);
    setStudentQuery(`${student.full_name} (${student.id})`);
    setFormError('');

    // Fetch live borrow stats for this student
    const hist = await db.getStudentBorrowingHistory(student.id);
    setStudentHistory({
      activeCount: hist.activeCount,
      unpaidFineTotal: hist.unpaidFineTotal,
    });
  };

  // Handle book search & selection
  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    setBookQuery(`${book.title} [${book.id}]`);
    setFormError('');
  };

  // Calculate Due Date string
  const calculateDueDateStr = () => {
    const d = new Date(issueDate);
    d.setDate(d.getDate() + Number(borrowDays));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedStudent) {
      setFormError('Please select a registered student from the registry.');
      return;
    }

    if (!selectedBook) {
      setFormError('Please select an available book from the catalogue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const issue = await db.issueBook({
        student_id: selectedStudent.id,
        book_id: selectedBook.id,
        issue_date: issueDate,
        borrow_days: Number(borrowDays),
        notes: notes.trim(),
      });

      setIssuedResult(issue);
      success(`Book "${selectedBook.title}" successfully issued to ${selectedStudent.full_name}!`);

      // Reset form
      setSelectedBook(null);
      setBookQuery('');
      // update student history
      const hist = await db.getStudentBorrowingHistory(selectedStudent.id);
      setStudentHistory({
        activeCount: hist.activeCount,
        unpaidFineTotal: hist.unpaidFineTotal,
      });

      // Reload fresh books list to reflect updated availability
      const updatedBooks = await db.getBooks();
      setBooks(updatedBooks);
    } catch (err: any) {
      setFormError(err.message || 'Failed to issue book');
      error(err.message || 'Issue operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Student suggestions
  const matchingStudents = studentQuery.trim() && !selectedStudent
    ? students.filter(
        (s) =>
          s.full_name.toLowerCase().includes(studentQuery.toLowerCase()) ||
          s.id.toLowerCase().includes(studentQuery.toLowerCase()) ||
          s.email.toLowerCase().includes(studentQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  // Book suggestions
  const matchingBooks = bookQuery.trim() && !selectedBook
    ? books.filter(
        (b) =>
          b.title.toLowerCase().includes(bookQuery.toLowerCase()) ||
          b.isbn.toLowerCase().includes(bookQuery.toLowerCase()) ||
          b.id.toLowerCase().includes(bookQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Issue Book to Student
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Process borrowing transactions with quota verification and inventory synchronization
        </p>
      </div>

      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-rose-900">Circulation Rule Violation</h4>
            <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{formError}</p>
          </div>
        </div>
      )}

      {/* Main Issue Form */}
      <form onSubmit={handleIssueSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Student Lookup */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">1. Select Student Patron</h3>
                <p className="text-xs text-slate-500">Search by student name or Student ID</p>
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Name or ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Type student name (e.g. Aarav) or ID..."
                  value={studentQuery}
                  onChange={(e) => {
                    setStudentQuery(e.target.value);
                    setSelectedStudent(null);
                  }}
                  className="w-full pl-9.5 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {matchingStudents.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100">
                  {matchingStudents.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleStudentSelect(s)}
                      className="w-full p-3 text-left hover:bg-blue-50 transition flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{s.full_name}</p>
                        <p className="text-[11px] text-slate-500">{s.department} • {s.course}</p>
                      </div>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {s.id}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Student Preview */}
            {selectedStudent ? (
              <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-sm text-blue-900">{selectedStudent.full_name}</span>
                  <span className="font-mono font-semibold text-blue-700">{selectedStudent.id}</span>
                </div>
                <p className="text-slate-600">{selectedStudent.department} • {selectedStudent.year_of_study}</p>
                <div className="pt-2 border-t border-blue-200 flex items-center justify-between text-[11px]">
                  <span>Active Borrowed: <strong>{studentHistory.activeCount} / {selectedStudent.max_allowed_books}</strong></span>
                  <span className={selectedStudent.status === 'Active' ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                    Status: {selectedStudent.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                Type above to search & select student
              </div>
            )}
          </div>

          {/* Card 2: Book Lookup */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">2. Select Book from Stock</h3>
                <p className="text-xs text-slate-500">Search by Title, ISBN, or Book ID</p>
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Book Title, ISBN, or ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Type book title, ISBN or ID..."
                  value={bookQuery}
                  onChange={(e) => {
                    setBookQuery(e.target.value);
                    setSelectedBook(null);
                  }}
                  className="w-full pl-9.5 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {matchingBooks.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100">
                  {matchingBooks.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleBookSelect(b)}
                      className="w-full p-3 text-left hover:bg-indigo-50 transition flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{b.title}</p>
                        <p className="text-[11px] text-slate-500">{b.author} • Shelf {b.shelf_number}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                        b.available_copies > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {b.available_copies > 0 ? `${b.available_copies} Avail` : 'Out of Stock'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Book Preview */}
            {selectedBook ? (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-sm text-indigo-900 line-clamp-1">{selectedBook.title}</span>
                  <span className="font-mono font-semibold text-indigo-700 shrink-0">{selectedBook.id}</span>
                </div>
                <p className="text-slate-600">By {selectedBook.author} • {selectedBook.category}</p>
                <div className="pt-2 border-t border-indigo-200 flex items-center justify-between text-[11px]">
                  <span>Shelf: <strong>{selectedBook.shelf_number}</strong></span>
                  <span className={selectedBook.available_copies > 0 ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                    Stock: {selectedBook.available_copies} of {selectedBook.total_copies} available
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                Type above to search & select book
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Borrowing Terms & Dates */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">3. Issue Schedule & Borrowing Terms</h3>
              <p className="text-xs text-slate-500">Standard lending period and due date calculation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Issue Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Issue Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
              />
            </div>

            {/* Loan Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lending Period (Days)
              </label>
              <select
                value={borrowDays}
                onChange={(e) => setBorrowDays(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
              >
                <option value={7}>7 Days (1 Week - Short Loan)</option>
                <option value={14}>14 Days (Standard 2 Weeks)</option>
                <option value={21}>21 Days (3 Weeks)</option>
                <option value={30}>30 Days (Semester / Project Loan)</option>
              </select>
            </div>

            {/* Calculated Due Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scheduled Return Due Date
              </label>
              <div className="px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-xl font-bold text-xs sm:text-sm text-blue-800 flex items-center justify-between">
                <span>{calculateDueDateStr()}</span>
                <span className="text-[10px] uppercase font-bold text-blue-600">Auto-Computed</span>
              </div>
            </div>

            {/* Notes */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Circulation Notes / Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Approved for final year project research"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/books')}
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedStudent || !selectedBook}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-2 disabled:opacity-50"
          >
            <BookUp className="w-4 h-4" />
            <span>{isSubmitting ? 'Issuing Book...' : 'Issue Book & Generate Slip'}</span>
          </button>
        </div>
      </form>

      {/* Celebratory Receipt Modal */}
      <IssueReceiptModal
        isOpen={Boolean(issuedResult)}
        issue={issuedResult}
        onClose={() => setIssuedResult(null)}
      />
    </div>
  );
};
