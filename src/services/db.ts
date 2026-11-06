import { 
  Book, 
  Student, 
  BookIssue, 
  Fine, 
  LibrarySettings, 
  AdminUser 
} from './types';
import { 
  INITIAL_ADMIN, 
  INITIAL_BOOKS, 
  INITIAL_STUDENTS, 
  INITIAL_ISSUES, 
  INITIAL_FINES, 
  INITIAL_SETTINGS 
} from '../data/seedData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEYS = {
  ADMIN: 'lms_admin',
  BOOKS: 'lms_books',
  STUDENTS: 'lms_students',
  ISSUES: 'lms_issues',
  FINES: 'lms_fines',
  SETTINGS: 'lms_settings',
  INITIALIZED: 'lms_initialized_v2',
};

// Helper: safe JSON parse
function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Failed to read ${key} from storage:`, err);
    return fallback;
  }
}

// Helper: safe JSON set
function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to write ${key} to storage:`, err);
  }
}

// Database Service Class
class DatabaseService {
  private books: Book[] = [];
  private students: Student[] = [];
  private issues: BookIssue[] = [];
  private fines: Fine[] = [];
  private settings: LibrarySettings = INITIAL_SETTINGS;
  private admin: AdminUser = INITIAL_ADMIN;

  constructor() {
    this.init();
  }

  public init() {
    const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInitialized) {
      this.resetToDefaults();
    } else {
      this.books = getFromStorage<Book[]>(STORAGE_KEYS.BOOKS, INITIAL_BOOKS);
      this.students = getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
      this.issues = getFromStorage<BookIssue[]>(STORAGE_KEYS.ISSUES, INITIAL_ISSUES);
      this.fines = getFromStorage<Fine[]>(STORAGE_KEYS.FINES, INITIAL_FINES);
      this.settings = getFromStorage<LibrarySettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
      this.admin = getFromStorage<AdminUser>(STORAGE_KEYS.ADMIN, INITIAL_ADMIN);
      this.recalculateOverdueStatus();
    }
  }

  public resetToDefaults() {
    this.books = JSON.parse(JSON.stringify(INITIAL_BOOKS));
    this.students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    this.issues = JSON.parse(JSON.stringify(INITIAL_ISSUES));
    this.fines = JSON.parse(JSON.stringify(INITIAL_FINES));
    this.settings = JSON.parse(JSON.stringify(INITIAL_SETTINGS));
    this.admin = JSON.parse(JSON.stringify(INITIAL_ADMIN));

    this.recalculateOverdueStatus();
    this.persistAll();
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  private persistAll() {
    setToStorage(STORAGE_KEYS.BOOKS, this.books);
    setToStorage(STORAGE_KEYS.STUDENTS, this.students);
    setToStorage(STORAGE_KEYS.ISSUES, this.issues);
    setToStorage(STORAGE_KEYS.FINES, this.fines);
    setToStorage(STORAGE_KEYS.SETTINGS, this.settings);
    setToStorage(STORAGE_KEYS.ADMIN, this.admin);
  }

  public getTodayString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Calculate overdue days between due date and target date (target = return date or today)
  public calculateOverdueDays(dueDateStr: string, returnDateStr?: string | null): number {
    const targetDate = returnDateStr ? new Date(returnDateStr) : new Date();
    const dueDate = new Date(dueDateStr);
    
    // Set hours to 0 to compare dates cleanly
    targetDate.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  // Live recalculate any overdue active issues and sync pending fines
  private recalculateOverdueStatus() {
    const today = this.getTodayString();
    let issuesChanged = false;
    let finesChanged = false;

    this.issues = this.issues.map(issue => {
      if (issue.status !== 'Returned') {
        const overdueDays = this.calculateOverdueDays(issue.due_date);
        if (overdueDays > 0) {
          const fineAmount = overdueDays * this.settings.fine_per_day;
          if (issue.status !== 'Overdue' || issue.fine_amount !== fineAmount) {
            issuesChanged = true;
            issue = {
              ...issue,
              status: 'Overdue',
              fine_amount: fineAmount,
            };

            // Check if fine record exists
            const fineIdx = this.fines.findIndex(f => f.issue_id === issue.id);
            if (fineIdx >= 0) {
              if (this.fines[fineIdx].status === 'Unpaid' && this.fines[fineIdx].amount !== fineAmount) {
                this.fines[fineIdx].amount = fineAmount;
                this.fines[fineIdx].overdue_days = overdueDays;
                finesChanged = true;
              }
            } else {
              this.fines.push({
                id: `FIN-${Math.floor(1000 + Math.random() * 9000)}`,
                issue_id: issue.id,
                student_id: issue.student_id,
                student_name: issue.student_name,
                book_title: issue.book_title,
                issue_date: issue.issue_date,
                due_date: issue.due_date,
                return_date: null,
                overdue_days: overdueDays,
                amount: fineAmount,
                status: 'Unpaid',
              });
              finesChanged = true;
            }
          }
        }
      }
      return issue;
    });

    if (issuesChanged) setToStorage(STORAGE_KEYS.ISSUES, this.issues);
    if (finesChanged) setToStorage(STORAGE_KEYS.FINES, this.fines);
  }

  // --- STATS ---
  public getDashboardStats() {
    this.recalculateOverdueStatus();

    const totalBooks = this.books.reduce((sum, b) => sum + b.total_copies, 0);
    const uniqueTitles = this.books.length;
    const availableBooks = this.books.reduce((sum, b) => sum + b.available_copies, 0);
    const issuedBooks = this.issues.filter(i => i.status === 'Issued' || i.status === 'Overdue').length;
    const totalStudents = this.students.length;
    const activeStudents = this.students.filter(s => s.status === 'Active').length;
    const overdueBooks = this.issues.filter(i => i.status === 'Overdue').length;

    // Total pending fines (all unpaid fines)
    const pendingFines = this.fines
      .filter(f => f.status === 'Unpaid')
      .reduce((sum, f) => sum + f.amount, 0);

    const collectedFines = this.fines
      .filter(f => f.status === 'Paid')
      .reduce((sum, f) => sum + f.amount, 0);

    return {
      totalBooks,
      uniqueTitles,
      availableBooks,
      issuedBooks,
      totalStudents,
      activeStudents,
      overdueBooks,
      pendingFines,
      collectedFines,
    };
  }

  // --- BOOKS CRUD ---
  public async getBooks(): Promise<Book[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    }
    return [...this.books];
  }

  public async getBookById(id: string): Promise<Book | undefined> {
    return this.books.find(b => b.id === id);
  }

  public async getBookByIsbn(isbn: string): Promise<Book | undefined> {
    return this.books.find(b => b.isbn.trim().toLowerCase() === isbn.trim().toLowerCase());
  }

  public async addBook(bookData: Omit<Book, 'id' | 'created_at'>): Promise<Book> {
    const nextNum = 1000 + this.books.length + 1;
    const newBook: Book = {
      ...bookData,
      id: `BK-${nextNum}`,
      available_copies: Number(bookData.available_copies),
      total_copies: Number(bookData.total_copies),
      publication_year: Number(bookData.publication_year),
      created_at: new Date().toISOString(),
    };

    // Rule: available copies cannot exceed total copies and cannot be negative
    if (newBook.available_copies > newBook.total_copies) {
      newBook.available_copies = newBook.total_copies;
    }
    if (newBook.available_copies < 0) {
      newBook.available_copies = 0;
    }

    this.books.unshift(newBook);
    setToStorage(STORAGE_KEYS.BOOKS, this.books);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('books').insert([newBook]);
      } catch (err) {
        console.warn('Supabase sync error on addBook:', err);
      }
    }

    return newBook;
  }

  public async updateBook(id: string, updates: Partial<Book>): Promise<Book> {
    const idx = this.books.findIndex(b => b.id === id);
    if (idx === -1) throw new Error('Book not found.');

    const current = this.books[idx];
    const total_copies = updates.total_copies !== undefined ? Number(updates.total_copies) : current.total_copies;
    let available_copies = updates.available_copies !== undefined ? Number(updates.available_copies) : current.available_copies;

    if (available_copies > total_copies) available_copies = total_copies;
    if (available_copies < 0) available_copies = 0;

    const updated: Book = {
      ...current,
      ...updates,
      total_copies,
      available_copies,
    };

    this.books[idx] = updated;
    setToStorage(STORAGE_KEYS.BOOKS, this.books);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('books').update(updated).eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error on updateBook:', err);
      }
    }

    return updated;
  }

  public async deleteBook(id: string): Promise<void> {
    // CRITICAL REQUIREMENT: Prevent deleting books that currently have active issue records!
    const activeIssues = this.issues.filter(
      i => i.book_id === id && (i.status === 'Issued' || i.status === 'Overdue')
    );
    if (activeIssues.length > 0) {
      throw new Error(
        `Cannot delete this book. There are currently ${activeIssues.length} active borrowed copy/copies with students.`
      );
    }

    this.books = this.books.filter(b => b.id !== id);
    setToStorage(STORAGE_KEYS.BOOKS, this.books);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('books').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error on deleteBook:', err);
      }
    }
  }

  // --- STUDENTS CRUD ---
  public async getStudents(): Promise<Student[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('students').select('*').order('registration_date', { ascending: false });
      if (!error && data && data.length > 0) return data;
    }
    return [...this.students];
  }

  public async getStudentById(id: string): Promise<Student | undefined> {
    return this.students.find(s => s.id === id);
  }

  public async addStudent(studentData: Omit<Student, 'id' | 'registration_date'>): Promise<Student> {
    const currentYear = new Date().getFullYear();
    const count = this.students.length + 1;
    const newStudent: Student = {
      ...studentData,
      id: `STU-${currentYear}-${String(count).padStart(3, '0')}`,
      registration_date: this.getTodayString(),
      max_allowed_books: studentData.max_allowed_books || this.settings.max_books_per_student || 3,
    };

    this.students.unshift(newStudent);
    setToStorage(STORAGE_KEYS.STUDENTS, this.students);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('students').insert([newStudent]);
      } catch (err) {
        console.warn('Supabase sync error on addStudent:', err);
      }
    }

    return newStudent;
  }

  public async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    const idx = this.students.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Student not found.');

    const updated: Student = {
      ...this.students[idx],
      ...updates,
    };

    this.students[idx] = updated;
    setToStorage(STORAGE_KEYS.STUDENTS, this.students);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('students').update(updated).eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error on updateStudent:', err);
      }
    }

    return updated;
  }

  public async deleteStudent(id: string): Promise<void> {
    // CRITICAL REQUIREMENT: Delete students only when they have NO active borrowed books!
    const activeIssues = this.issues.filter(
      i => i.student_id === id && (i.status === 'Issued' || i.status === 'Overdue')
    );
    if (activeIssues.length > 0) {
      throw new Error(
        `Cannot delete student ${id}. The student currently has ${activeIssues.length} active borrowed book(s). Please return all books first.`
      );
    }

    this.students = this.students.filter(s => s.id !== id);
    setToStorage(STORAGE_KEYS.STUDENTS, this.students);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('students').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase sync error on deleteStudent:', err);
      }
    }
  }

  public async getStudentBorrowingHistory(studentId: string) {
    const issues = this.issues.filter(i => i.student_id === studentId);
    const fines = this.fines.filter(f => f.student_id === studentId);
    const activeIssues = issues.filter(i => i.status === 'Issued' || i.status === 'Overdue');
    return {
      issues,
      fines,
      activeCount: activeIssues.length,
      returnedCount: issues.filter(i => i.status === 'Returned').length,
      unpaidFineTotal: fines.filter(f => f.status === 'Unpaid').reduce((acc, f) => acc + f.amount, 0),
    };
  }

  // --- ISSUE BOOK MODULE ---
  public async issueBook(params: {
    student_id: string;
    book_id: string;
    issue_date?: string;
    borrow_days?: number;
    notes?: string;
  }): Promise<BookIssue> {
    this.recalculateOverdueStatus();

    // 1. Verify student registration
    const student = this.students.find(s => s.id === params.student_id);
    if (!student) {
      throw new Error(`Student with ID "${params.student_id}" is not registered in the system.`);
    }
    if (student.status !== 'Active') {
      throw new Error(`Student ${student.full_name} is currently "${student.status}" and cannot borrow books.`);
    }

    // Check student borrow quota
    const activeBorrowCount = this.issues.filter(
      i => i.student_id === student.id && (i.status === 'Issued' || i.status === 'Overdue')
    ).length;
    const maxAllowed = student.max_allowed_books || this.settings.max_books_per_student || 3;
    if (activeBorrowCount >= maxAllowed) {
      throw new Error(
        `Student ${student.full_name} has already reached the maximum borrowing limit of ${maxAllowed} books.`
      );
    }

    // 2. Verify book availability
    const bookIdx = this.books.findIndex(b => b.id === params.book_id || b.isbn === params.book_id);
    if (bookIdx === -1) {
      throw new Error(`Book "${params.book_id}" not found in catalogue.`);
    }
    const book = this.books[bookIdx];

    if (book.available_copies <= 0) {
      throw new Error(`Book "${book.title}" is currently OUT OF STOCK (0 copies available).`);
    }

    // 3. Prevent duplicate active issue records for the same student and book!
    const hasActiveDuplicate = this.issues.some(
      i => i.student_id === student.id && i.book_id === book.id && (i.status === 'Issued' || i.status === 'Overdue')
    );
    if (hasActiveDuplicate) {
      throw new Error(
        `Student "${student.full_name}" already has an active issue record for "${book.title}". Duplicate active borrowings are not permitted.`
      );
    }

    // 4. Calculate issue and due date
    const issueDateStr = params.issue_date || this.getTodayString();
    const borrowDays = params.borrow_days || this.settings.default_borrowing_days || 14;

    const issueDate = new Date(issueDateStr);
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + borrowDays);

    const year = dueDate.getFullYear();
    const month = String(dueDate.getMonth() + 1).padStart(2, '0');
    const day = String(dueDate.getDate()).padStart(2, '0');
    const dueDateStr = `${year}-${month}-${day}`;

    // 5. Automatically decrease available book copies
    book.available_copies -= 1;
    if (book.available_copies < 0) book.available_copies = 0;
    this.books[bookIdx] = { ...book };
    setToStorage(STORAGE_KEYS.BOOKS, this.books);

    // 6. Generate unique issue transaction ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newIssue: BookIssue = {
      id: `TXN-${randomSuffix}`,
      student_id: student.id,
      student_name: student.full_name,
      book_id: book.id,
      book_title: book.title,
      book_isbn: book.isbn,
      issue_date: issueDateStr,
      due_date: dueDateStr,
      return_date: null,
      status: 'Issued',
      fine_amount: 0,
      fine_paid: false,
      notes: params.notes || '',
      created_at: new Date().toISOString(),
    };

    this.issues.unshift(newIssue);
    setToStorage(STORAGE_KEYS.ISSUES, this.issues);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('book_issues').insert([newIssue]);
        await supabase.from('books').update({ available_copies: book.available_copies }).eq('id', book.id);
      } catch (err) {
        console.warn('Supabase sync error on issueBook:', err);
      }
    }

    return newIssue;
  }

  // --- RETURN BOOK MODULE ---
  public async returnBook(issueId: string, options?: {
    return_date?: string;
    pay_fine_now?: boolean;
    payment_method?: 'Cash' | 'UPI' | 'Card' | 'Online';
  }): Promise<{
    issue: BookIssue;
    overdueDays: number;
    fineAmount: number;
    fineRecord?: Fine;
  }> {
    const issueIdx = this.issues.findIndex(i => i.id === issueId);
    if (issueIdx === -1) {
      throw new Error(`Issue transaction "${issueId}" not found.`);
    }

    const issue = this.issues[issueIdx];

    // Prevent duplicate returns
    if (issue.status === 'Returned') {
      throw new Error(`Book was already returned on ${issue.return_date}. Duplicate return is not allowed.`);
    }

    const returnDateStr = options?.return_date || this.getTodayString();
    
    // Fine calculation:
    // If book returned on or before due date, fine = ₹0
    // If overdue: fine = overdue days * fine_per_day
    const overdueDays = this.calculateOverdueDays(issue.due_date, returnDateStr);
    const fineAmount = overdueDays > 0 ? overdueDays * this.settings.fine_per_day : 0;
    const isPaidNow = fineAmount === 0 || Boolean(options?.pay_fine_now);

    // 1. Update book availability: Automatically increase available book copies exactly once
    const bookIdx = this.books.findIndex(b => b.id === issue.book_id);
    if (bookIdx !== -1) {
      const book = this.books[bookIdx];
      book.available_copies = Math.min(book.total_copies, book.available_copies + 1);
      this.books[bookIdx] = { ...book };
      setToStorage(STORAGE_KEYS.BOOKS, this.books);
    }

    // 2. Update issue record
    const updatedIssue: BookIssue = {
      ...issue,
      status: 'Returned',
      return_date: returnDateStr,
      fine_amount: fineAmount,
      fine_paid: isPaidNow,
    };
    this.issues[issueIdx] = updatedIssue;
    setToStorage(STORAGE_KEYS.ISSUES, this.issues);

    // 3. Handle fine record
    let fineRecord: Fine | undefined;
    if (fineAmount > 0) {
      const existingFineIdx = this.fines.findIndex(f => f.issue_id === issue.id);
      const receiptNo = isPaidNow ? `RCP-${Math.floor(10000 + Math.random() * 90000)}` : undefined;

      fineRecord = {
        id: existingFineIdx >= 0 ? this.fines[existingFineIdx].id : `FIN-${Math.floor(1000 + Math.random() * 9000)}`,
        issue_id: issue.id,
        student_id: issue.student_id,
        student_name: issue.student_name,
        book_title: issue.book_title,
        issue_date: issue.issue_date,
        due_date: issue.due_date,
        return_date: returnDateStr,
        overdue_days: overdueDays,
        amount: fineAmount,
        status: isPaidNow ? 'Paid' : 'Unpaid',
        payment_method: isPaidNow ? (options?.payment_method || 'Cash') : undefined,
        payment_date: isPaidNow ? returnDateStr : null,
        receipt_no: receiptNo,
      };

      if (existingFineIdx >= 0) {
        this.fines[existingFineIdx] = fineRecord;
      } else {
        this.fines.unshift(fineRecord);
      }
      setToStorage(STORAGE_KEYS.FINES, this.fines);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('book_issues').update(updatedIssue).eq('id', issue.id);
        if (bookIdx !== -1) {
          await supabase.from('books').update({ available_copies: this.books[bookIdx].available_copies }).eq('id', issue.book_id);
        }
        if (fineRecord) {
          await supabase.from('fines').upsert([fineRecord]);
        }
      } catch (err) {
        console.warn('Supabase sync error on returnBook:', err);
      }
    }

    return {
      issue: updatedIssue,
      overdueDays,
      fineAmount,
      fineRecord,
    };
  }

  // --- FINES MODULE ---
  public async getFines(): Promise<Fine[]> {
    this.recalculateOverdueStatus();
    return [...this.fines];
  }

  public async payFine(fineId: string, paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Online'): Promise<Fine> {
    const idx = this.fines.findIndex(f => f.id === fineId);
    if (idx === -1) throw new Error('Fine record not found.');

    const fine = this.fines[idx];
    if (fine.status === 'Paid') {
      throw new Error('This fine has already been paid.');
    }

    const today = this.getTodayString();
    const updated: Fine = {
      ...fine,
      status: 'Paid',
      payment_method: paymentMethod,
      payment_date: today,
      receipt_no: `RCP-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    this.fines[idx] = updated;
    setToStorage(STORAGE_KEYS.FINES, this.fines);

    // Also update corresponding issue fine_paid
    const issueIdx = this.issues.findIndex(i => i.id === fine.issue_id);
    if (issueIdx !== -1) {
      this.issues[issueIdx].fine_paid = true;
      setToStorage(STORAGE_KEYS.ISSUES, this.issues);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('fines').update(updated).eq('id', fineId);
        if (issueIdx !== -1) {
          await supabase.from('book_issues').update({ fine_paid: true }).eq('id', fine.issue_id);
        }
      } catch (err) {
        console.warn('Supabase sync error on payFine:', err);
      }
    }

    return updated;
  }

  public async waiveFine(fineId: string, reason: string): Promise<Fine> {
    const idx = this.fines.findIndex(f => f.id === fineId);
    if (idx === -1) throw new Error('Fine record not found.');

    const updated: Fine = {
      ...this.fines[idx],
      status: 'Waived',
      payment_method: 'Waived',
      payment_date: this.getTodayString(),
      receipt_no: `WAIVE-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    this.fines[idx] = updated;
    setToStorage(STORAGE_KEYS.FINES, this.fines);

    const issueIdx = this.issues.findIndex(i => i.id === this.fines[idx].issue_id);
    if (issueIdx !== -1) {
      this.issues[issueIdx].fine_paid = true;
      this.issues[issueIdx].notes = (this.issues[issueIdx].notes ? this.issues[issueIdx].notes + ' | ' : '') + `Fine waived: ${reason}`;
      setToStorage(STORAGE_KEYS.ISSUES, this.issues);
    }

    return updated;
  }

  // --- TRANSACTIONS ---
  public async getTransactions(): Promise<BookIssue[]> {
    this.recalculateOverdueStatus();
    return [...this.issues];
  }

  // --- SETTINGS ---
  public getSettings(): LibrarySettings {
    return { ...this.settings };
  }

  public async updateSettings(newSettings: Partial<LibrarySettings>): Promise<LibrarySettings> {
    this.settings = {
      ...this.settings,
      ...newSettings,
      fine_per_day: Number(newSettings.fine_per_day ?? this.settings.fine_per_day),
      default_borrowing_days: Number(newSettings.default_borrowing_days ?? this.settings.default_borrowing_days),
      max_books_per_student: Number(newSettings.max_books_per_student ?? this.settings.max_books_per_student),
    };
    setToStorage(STORAGE_KEYS.SETTINGS, this.settings);
    this.recalculateOverdueStatus();
    return { ...this.settings };
  }

  // --- ADMIN PROFILE ---
  public getAdmin(): AdminUser {
    return { ...this.admin };
  }

  public async updateAdmin(updates: Partial<AdminUser>): Promise<AdminUser> {
    this.admin = {
      ...this.admin,
      ...updates,
    };
    setToStorage(STORAGE_KEYS.ADMIN, this.admin);
    return { ...this.admin };
  }

  // --- SUPABASE SQL SCHEMA GENERATOR ---
  public getPostgresSchemaSql(): string {
    return `-- =====================================================================
-- ONLINE LIBRARY MANAGEMENT SYSTEM - SUPABASE POSTGRESQL SCHEMA
-- Author: Online Library Management System
-- Compatible with: Supabase / PostgreSQL 14+
-- =====================================================================

-- 1. Create Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Super Admin',
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Books Table
CREATE TABLE IF NOT EXISTS public.books (
  id TEXT PRIMARY KEY,
  isbn TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  publisher TEXT NOT NULL,
  category TEXT NOT NULL,
  publication_year INT NOT NULL,
  total_copies INT NOT NULL CHECK (total_copies >= 0),
  available_copies INT NOT NULL CHECK (available_copies >= 0 AND available_copies <= total_copies),
  shelf_number TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  department TEXT NOT NULL,
  course TEXT NOT NULL,
  year_of_study TEXT NOT NULL,
  registration_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Inactive')),
  max_allowed_books INT NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Book Issues Table
CREATE TABLE IF NOT EXISTS public.book_issues (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON UPDATE CASCADE,
  student_name TEXT NOT NULL,
  book_id TEXT NOT NULL REFERENCES public.books(id) ON UPDATE CASCADE,
  book_title TEXT NOT NULL,
  book_isbn TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  return_date DATE,
  status TEXT NOT NULL DEFAULT 'Issued' CHECK (status IN ('Issued', 'Returned', 'Overdue')),
  fine_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  fine_paid BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Fines Table
CREATE TABLE IF NOT EXISTS public.fines (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL REFERENCES public.book_issues(id) ON UPDATE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON UPDATE CASCADE,
  student_name TEXT NOT NULL,
  book_title TEXT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE,
  overdue_days INT NOT NULL DEFAULT 0,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Paid', 'Waived')),
  payment_method TEXT CHECK (payment_method IN ('Cash', 'UPI', 'Card', 'Online', 'Waived')),
  payment_date DATE,
  receipt_no TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_books_category ON public.books(category);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON public.books(isbn);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_issues_student_id ON public.book_issues(student_id);
CREATE INDEX IF NOT EXISTS idx_issues_book_id ON public.book_issues(book_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.book_issues(status);
CREATE INDEX IF NOT EXISTS idx_fines_status ON public.fines(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;

-- Default RLS Policies (Read public/anon, Write authenticated or service role)
CREATE POLICY "Public Read Books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Public Read Students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Public Read Issues" ON public.book_issues FOR SELECT USING (true);
CREATE POLICY "Public Read Fines" ON public.fines FOR SELECT USING (true);

-- Allow authenticated users full CRUD
CREATE POLICY "Auth Admins Full Access Books" ON public.books FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Admins Full Access Students" ON public.students FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Admins Full Access Issues" ON public.book_issues FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Admins Full Access Fines" ON public.fines FOR ALL USING (auth.role() = 'authenticated');
`;
  }
}

export const db = new DatabaseService();
