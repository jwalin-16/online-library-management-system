export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'Super Admin' | 'Librarian' | 'Assistant';
  avatar?: string;
  lastLogin?: string;
}

export type BookCategory = 
  | 'Computer Science' 
  | 'Mathematics' 
  | 'Physics' 
  | 'Literature' 
  | 'Engineering' 
  | 'Business' 
  | 'Medicine' 
  | 'History'
  | 'General Science';

export interface Book {
  id: string;              // e.g., "BK-1001"
  isbn: string;            // e.g., "978-0132350884"
  title: string;
  author: string;
  publisher: string;
  category: BookCategory;
  publication_year: number;
  total_copies: number;
  available_copies: number;
  shelf_number: string;    // e.g., "CS-04-B"
  description?: string;
  created_at: string;
}

export type StudentStatus = 'Active' | 'Suspended' | 'Inactive';

export interface Student {
  id: string;              // e.g., "STU-2024-001"
  full_name: string;
  email: string;
  phone: string;
  department: string;     // e.g., "Computer Science & Engineering"
  course: string;         // e.g., "B.Tech"
  year_of_study: string;  // e.g., "3rd Year"
  registration_date: string;
  status: StudentStatus;
  max_allowed_books: number;
}

export type IssueStatus = 'Issued' | 'Returned' | 'Overdue';

export interface BookIssue {
  id: string;              // e.g., "ISS-8492"
  student_id: string;
  student_name: string;
  book_id: string;
  book_title: string;
  book_isbn: string;
  issue_date: string;      // YYYY-MM-DD
  due_date: string;        // YYYY-MM-DD
  return_date?: string | null;   // YYYY-MM-DD
  status: IssueStatus;
  fine_amount: number;
  fine_paid: boolean;
  notes?: string;
  created_at: string;
}

export type FineStatus = 'Unpaid' | 'Paid' | 'Waived';

export interface Fine {
  id: string;              // e.g., "FIN-5021"
  issue_id: string;
  student_id: string;
  student_name: string;
  book_title: string;
  issue_date: string;
  due_date: string;
  return_date?: string | null;
  overdue_days: number;
  amount: number;
  status: FineStatus;
  payment_method?: 'Cash' | 'UPI' | 'Card' | 'Online' | 'Waived';
  payment_date?: string | null;
  receipt_no?: string;
}

export interface LibrarySettings {
  library_name: string;
  institution_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  fine_per_day: number;          // Default ₹5
  default_borrowing_days: number; // Default 14
  max_books_per_student: number; // Default 3
  currency_symbol: string;       // Default '₹'
}
