import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  BookUp, 
  LayoutGrid, 
  List, 
  Layers, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { db } from '../services/db';
import { Book, BookCategory } from '../services/types';
import { Badge } from '../components/common/Badge';
import { BookModal } from '../components/books/BookModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';

const CATEGORIES: (BookCategory | 'All Categories')[] = [
  'All Categories',
  'Computer Science',
  'Mathematics',
  'Physics',
  'Literature',
  'Engineering',
  'Business',
  'Medicine',
  'History',
  'General Science',
];

export const BooksPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [stockFilter, setStockFilter] = useState<'All' | 'Available' | 'Low Stock' | 'Out of Stock'>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const loadBooks = async () => {
    setLoading(true);
    const data = await db.getBooks();
    setBooks(data);
    setLoading(false);
  };

  useEffect(() => {
    loadBooks();
  }, []);

  // Filtered books
  const filteredBooks = books.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.isbn.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      b.shelf_number.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === 'All Categories' || b.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'Available') matchesStock = b.available_copies > 0;
    else if (stockFilter === 'Low Stock') matchesStock = b.available_copies > 0 && b.available_copies <= 2;
    else if (stockFilter === 'Out of Stock') matchesStock = b.available_copies === 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalPages = Math.ceil(filteredBooks.length / pageSize) || 1;
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleOpenAdd = () => {
    setEditingBook(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (book: Book) => {
    setEditingBook(book);
    setIsModalOpen(true);
  };

  const handleSaveBook = async (bookData: Omit<Book, 'id' | 'created_at'>) => {
    if (editingBook) {
      await db.updateBook(editingBook.id, bookData);
      success(`Book "${bookData.title}" updated successfully.`);
    } else {
      await db.addBook(bookData);
      success(`Book "${bookData.title}" added to catalogue.`);
    }
    loadBooks();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBook) return;
    setIsDeleting(true);
    try {
      await db.deleteBook(deletingBook.id);
      success(`Book "${deletingBook.title}" was removed.`);
      setDeletingBook(null);
      loadBooks();
    } catch (err: any) {
      error(err.message || 'Cannot delete book');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Book Inventory & Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage copies, shelf locations, ISBNs, and stock availability ({books.length} total titles)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Book</span>
        </button>
      </div>

      {/* Search, Filter & View Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Bar */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, author, ISBN, or shelf number..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter & View Toggle */}
          <div className="flex items-center gap-2">
            <select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="flex-1 px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
            >
              <option value="All">All Stock</option>
              <option value="Available">Available Only</option>
              <option value="Low Stock">Low Stock (≤ 2)</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>

            <div className="flex items-center p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Grid Cards View"
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Books Content */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
          Loading book catalogue...
        </div>
      ) : filteredBooks.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Books Found"
          description={
            searchQuery || selectedCategory !== 'All Categories'
              ? 'No books match your current search query or filter criteria. Try resetting filters.'
              : 'Your library catalogue has no books yet. Add your first book now.'
          }
          actionText={searchQuery ? 'Clear Filters' : 'Add New Book'}
          onAction={() => {
            if (searchQuery || selectedCategory !== 'All Categories') {
              setSearchQuery('');
              setSelectedCategory('All Categories');
              setStockFilter('All');
            } else {
              handleOpenAdd();
            }
          }}
        />
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Book Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">ISBN</th>
                  <th className="py-3 px-4">Shelf Location</th>
                  <th className="py-3 px-4 text-center">Copies (Avail / Total)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {paginatedBooks.map((book) => {
                  const issuedCopies = book.total_copies - book.available_copies;
                  const isOutOfStock = book.available_copies === 0;
                  const isLowStock = book.available_copies > 0 && book.available_copies <= 2;

                  return (
                    <tr key={book.id} className="hover:bg-slate-50/80 transition group">
                      {/* Title & Author */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 font-bold text-xs">
                            {book.id.replace('BK-', '')}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{book.title}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {book.author} • {book.publisher} ({book.publication_year})
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-xs font-medium px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                          {book.category}
                        </span>
                      </td>

                      {/* ISBN */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {book.isbn}
                      </td>

                      {/* Shelf */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          <MapPin className="w-3 h-3" />
                          {book.shelf_number}
                        </span>
                      </td>

                      {/* Copies */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-extrabold text-slate-900">{book.available_copies}</span>
                        <span className="text-slate-400"> / {book.total_copies}</span>
                        {issuedCopies > 0 && (
                          <span className="block text-[11px] text-slate-400 font-medium">
                            ({issuedCopies} borrowed)
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Badge
                          variant={isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success'}
                          size="sm"
                        >
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {book.available_copies > 0 && (
                            <button
                              onClick={() => navigate(`/issue-book?bookId=${book.id}`)}
                              title="Issue this book to student"
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                            >
                              <BookUp className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(book)}
                            title="Edit Book Details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingBook(book)}
                            title="Delete Book"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
              {Math.min(currentPage * pageSize, filteredBooks.length)} of {filteredBooks.length} books
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
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginatedBooks.map((book) => {
            const isOutOfStock = book.available_copies === 0;
            const isLowStock = book.available_copies > 0 && book.available_copies <= 2;

            return (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {book.id}
                    </span>
                    <Badge
                      variant={isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success'}
                      size="sm"
                    >
                      {isOutOfStock ? 'Out of Stock' : `${book.available_copies} Left`}
                    </Badge>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mb-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">{book.author}</p>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Category:</span>
                      <span className="font-medium text-slate-800">{book.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Shelf:</span>
                      <span className="font-mono font-bold text-indigo-700">{book.shelf_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">ISBN:</span>
                      <span className="font-mono text-[11px] text-slate-600">{book.isbn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Copies:</span>
                      <span className="font-bold text-slate-800">{book.total_copies}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {book.available_copies > 0 ? (
                    <button
                      onClick={() => navigate(`/issue-book?bookId=${book.id}`)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition flex items-center gap-1.5"
                    >
                      <BookUp className="w-3.5 h-3.5" />
                      <span>Issue</span>
                    </button>
                  ) : (
                    <span className="text-xs text-rose-500 font-semibold">Unavailable</span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(book)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingBook(book)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Add/Edit Modal */}
      <BookModal
        isOpen={isModalOpen}
        book={editingBook}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveBook}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingBook)}
        title="Delete Book Record"
        message={`Are you sure you want to delete "${deletingBook?.title}" (${deletingBook?.id}) from the library catalogue? This action cannot be undone.`}
        confirmLabel="Delete Book"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingBook(null)}
      />
    </div>
  );
};
