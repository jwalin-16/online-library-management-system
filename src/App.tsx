/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/common/Layout';
import { BookModal } from './components/books/BookModal';
import { db } from './services/db';
import { Book } from './services/types';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { BooksPage } from './pages/BooksPage';
import { StudentsPage } from './pages/StudentsPage';
import { SearchBooksPage } from './pages/SearchBooksPage';
import { IssueBookPage } from './pages/IssueBookPage';
import { ReturnBookPage } from './pages/ReturnBookPage';
import { FinesPage } from './pages/FinesPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SettingsPage } from './pages/SettingsPage';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  onOpenAddBook: () => void;
}> = ({ children, onOpenAddBook }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-slate-300">
          Loading Library Management System...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Layout onOpenAddBook={onOpenAddBook}>{children}</Layout>;
};

function AppContent() {
  const [globalAddBookOpen, setGlobalAddBookOpen] = useState(false);
  const { success } = useToast();

  const handleGlobalAddBook = async (bookData: Omit<Book, 'id' | 'created_at'>) => {
    await db.addBook(bookData);
    success(`Book "${bookData.title}" added to catalogue successfully!`);
    // Trigger window event so any active page listening can refresh
    window.dispatchEvent(new CustomEvent('library_data_changed'));
  };

  return (
    <>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Admin Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute onOpenAddBook={() => setGlobalAddBookOpen(true)}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/books"
          element={
            <ProtectedRoute onOpenAddBook={() => setGlobalAddBookOpen(true)}>
              <BooksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute onOpenAddBook={() => setGlobalAddBookOpen(true)}>
              <StudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute onOpenAddBook={() => setGlobalAddBookOpen(true)}>
              <SearchBooksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/issue-book"
          element={
            <ProtectedRoute onOpenAddBook={() => setGlobalAddBookOpen(true)}>
              <IssueBookPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/return-book"
          element={
            <ProtectedRoute onOpenAddBook={() => setGlobalAddBookOpen(true)}>
              <ReturnBookPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fines"
          element={
            <ProtectedRoute onOpenAddBook={() => setGlobalAddBookOpen(true)}>
              <FinesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute onOpenAddBook={() => setGlobalAddBookOpen(true)}>
              <TransactionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute onOpenAddBook={() => setGlobalAddBookOpen(true)}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Add Book Modal accessible from Topbar */}
      <BookModal
        isOpen={globalAddBookOpen}
        onClose={() => setGlobalAddBookOpen(false)}
        onSubmit={handleGlobalAddBook}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
