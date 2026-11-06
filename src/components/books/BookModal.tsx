import React, { useState, useEffect } from 'react';
import { X, BookOpen, AlertCircle } from 'lucide-react';
import { Book, BookCategory } from '../../services/types';

interface BookModalProps {
  isOpen: boolean;
  book?: Book | null;
  onClose: () => void;
  onSubmit: (bookData: Omit<Book, 'id' | 'created_at'>) => Promise<void>;
}

const CATEGORIES: BookCategory[] = [
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

export const BookModal: React.FC<BookModalProps> = ({
  isOpen,
  book,
  onClose,
  onSubmit,
}) => {
  const isEditing = Boolean(book);

  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    category: 'Computer Science' as BookCategory,
    publication_year: new Date().getFullYear(),
    total_copies: 5,
    available_copies: 5,
    shelf_number: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (book) {
      setFormData({
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        category: book.category,
        publication_year: book.publication_year,
        total_copies: book.total_copies,
        available_copies: book.available_copies,
        shelf_number: book.shelf_number,
        description: book.description || '',
      });
    } else {
      setFormData({
        isbn: '',
        title: '',
        author: '',
        publisher: '',
        category: 'Computer Science',
        publication_year: new Date().getFullYear(),
        total_copies: 5,
        available_copies: 5,
        shelf_number: '',
        description: '',
      });
    }
    setErrors({});
  }, [book, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!formData.author.trim()) errs.author = 'Author name is required';
    if (!formData.isbn.trim()) errs.isbn = 'ISBN is required';
    if (!formData.publisher.trim()) errs.publisher = 'Publisher is required';
    if (!formData.shelf_number.trim()) errs.shelf_number = 'Shelf number is required (e.g. CS-02-A)';
    
    const year = Number(formData.publication_year);
    if (!year || year < 1000 || year > new Date().getFullYear() + 1) {
      errs.publication_year = 'Enter a valid 4-digit publication year';
    }

    const total = Number(formData.total_copies);
    if (isNaN(total) || total < 1) {
      errs.total_copies = 'Total copies must be at least 1';
    }

    const avail = Number(formData.available_copies);
    if (isNaN(avail) || avail < 0) {
      errs.available_copies = 'Available copies cannot be negative';
    } else if (avail > total) {
      errs.available_copies = 'Available copies cannot exceed total copies';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        isbn: formData.isbn.trim(),
        title: formData.title.trim(),
        author: formData.author.trim(),
        publisher: formData.publisher.trim(),
        category: formData.category,
        publication_year: Number(formData.publication_year),
        total_copies: Number(formData.total_copies),
        available_copies: Number(formData.available_copies),
        shelf_number: formData.shelf_number.trim(),
        description: formData.description.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save book' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sync available copies when total copies changes on add
  const handleTotalCopiesChange = (val: number) => {
    setFormData((prev) => ({
      ...prev,
      total_copies: val,
      available_copies: !isEditing ? val : Math.min(prev.available_copies, val),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? `Edit Book: ${book?.id}` : 'Add New Book to Catalogue'}
              </h3>
              <p className="text-xs text-slate-300">
                {isEditing ? 'Update book details and stock levels' : 'Enter bibliographic information & shelf location'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errors.form && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errors.form}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Book Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Introduction to Algorithms (4th Edition)"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-3.5 py-2 text-sm bg-slate-50 border rounded-xl outline-hidden transition ${
                  errors.title ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:bg-white focus:border-blue-500'
                }`}
              />
              {errors.title && <p className="text-[11px] text-rose-600 mt-1">{errors.title}</p>}
            </div>

            {/* Author */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Author(s) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Thomas H. Cormen"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className={`w-full px-3.5 py-2 text-sm bg-slate-50 border rounded-xl outline-hidden transition ${
                  errors.author ? 'border-rose-400' : 'border-slate-200 focus:bg-white focus:border-blue-500'
                }`}
              />
              {errors.author && <p className="text-[11px] text-rose-600 mt-1">{errors.author}</p>}
            </div>

            {/* ISBN */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ISBN <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 978-0262033848"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                className={`w-full px-3.5 py-2 text-sm bg-slate-50 border rounded-xl outline-hidden transition ${
                  errors.isbn ? 'border-rose-400' : 'border-slate-200 focus:bg-white focus:border-blue-500'
                }`}
              />
              {errors.isbn && <p className="text-[11px] text-rose-600 mt-1">{errors.isbn}</p>}
            </div>

            {/* Publisher */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Publisher <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. MIT Press"
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                className={`w-full px-3.5 py-2 text-sm bg-slate-50 border rounded-xl outline-hidden transition ${
                  errors.publisher ? 'border-rose-400' : 'border-slate-200 focus:bg-white focus:border-blue-500'
                }`}
              />
              {errors.publisher && <p className="text-[11px] text-rose-600 mt-1">{errors.publisher}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as BookCategory })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Publication Year */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Publication Year <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={formData.publication_year}
                onChange={(e) => setFormData({ ...formData, publication_year: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
              />
              {errors.publication_year && <p className="text-[11px] text-rose-600 mt-1">{errors.publication_year}</p>}
            </div>

            {/* Shelf Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shelf Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. CS-02-B, RACK-4"
                value={formData.shelf_number}
                onChange={(e) => setFormData({ ...formData, shelf_number: e.target.value })}
                className={`w-full px-3.5 py-2 text-sm bg-slate-50 border rounded-xl outline-hidden transition ${
                  errors.shelf_number ? 'border-rose-400' : 'border-slate-200 focus:bg-white focus:border-blue-500'
                }`}
              />
              {errors.shelf_number && <p className="text-[11px] text-rose-600 mt-1">{errors.shelf_number}</p>}
            </div>

            {/* Total Copies */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Copies in Stock <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.total_copies}
                onChange={(e) => handleTotalCopiesChange(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
              />
              {errors.total_copies && <p className="text-[11px] text-rose-600 mt-1">{errors.total_copies}</p>}
            </div>

            {/* Available Copies */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Available Copies (Not Issued) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max={formData.total_copies}
                value={formData.available_copies}
                onChange={(e) => setFormData({ ...formData, available_copies: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
              />
              {errors.available_copies && <p className="text-[11px] text-rose-600 mt-1">{errors.available_copies}</p>}
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Book Synopsis / Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Brief summary or subject notes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition resize-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
