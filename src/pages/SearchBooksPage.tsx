import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, BookOpen, MapPin, Hash, BookUp, Filter, Sparkles, AlertCircle } from 'lucide-react';
import { db } from '../services/db';
import { Book, BookCategory } from '../services/types';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

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

export const SearchBooksPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialQuery = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories');
  const [searchBy, setSearchBy] = useState<'all' | 'title' | 'author' | 'isbn'>('all');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getBooks().then((res) => {
      setBooks(res);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== searchTerm) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  // Filtering
  const filtered = books.filter((b) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term && categoryFilter === 'All Categories') return true;

    let matchesTerm = true;
    if (term) {
      if (searchBy === 'title') matchesTerm = b.title.toLowerCase().includes(term);
      else if (searchBy === 'author') matchesTerm = b.author.toLowerCase().includes(term);
      else if (searchBy === 'isbn') matchesTerm = b.isbn.toLowerCase().includes(term);
      else {
        matchesTerm =
          b.title.toLowerCase().includes(term) ||
          b.author.toLowerCase().includes(term) ||
          b.isbn.toLowerCase().includes(term) ||
          b.id.toLowerCase().includes(term) ||
          b.category.toLowerCase().includes(term);
      }
    }

    const matchesCategory =
      categoryFilter === 'All Categories' || b.category === categoryFilter;

    return matchesTerm && matchesCategory;
  });

  const handleClear = () => {
    setSearchTerm('');
    setCategoryFilter('All Categories');
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Catalogue Search & Shelf Locator
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Find books across library collections by title, author, ISBN, or field of study
        </p>
      </div>

      {/* Main Search Box Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md shadow-blue-900/5 space-y-4">
        {/* Input box */}
        <div className="relative">
          <Search className="w-5 h-5 text-blue-600 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, author name, ISBN (e.g. 978-0132350884), or call number..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSearchParams(e.target.value ? { q: e.target.value } : {});
            }}
            className="w-full pl-12 pr-4 py-3.5 text-sm sm:text-base bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-2xl outline-hidden transition shadow-inner font-medium"
            autoFocus
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Search by radio pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider px-2">Match:</span>
            {[
              { id: 'all', label: 'All Fields' },
              { id: 'title', label: 'Title Only' },
              { id: 'author', label: 'Author Only' },
              { id: 'isbn', label: 'ISBN' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSearchBy(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  searchBy === tab.id
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
          <span>
            Showing <strong className="text-slate-800">{filtered.length}</strong> books matching criteria
          </span>
          {(searchTerm || categoryFilter !== 'All Categories') && (
            <button
              onClick={handleClear}
              className="text-blue-600 hover:text-blue-800 transition"
            >
              Reset Search & Filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
            Searching catalogue...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No Matching Books Found"
            description={`We could not locate any books matching "${searchTerm || categoryFilter}". Please verify the spelling, check the ISBN format, or try searching with another keyword.`}
            actionText="Clear Search Criteria"
            onAction={handleClear}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((book) => {
              const isOutOfStock = book.available_copies === 0;
              const isLowStock = book.available_copies > 0 && book.available_copies <= 2;

              return (
                <div
                  key={book.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                          {book.id}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          {book.category}
                        </span>
                      </div>
                      <Badge
                        variant={isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success'}
                        size="sm"
                      >
                        {isOutOfStock ? 'Out of Stock' : `${book.available_copies} of ${book.total_copies} Available`}
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug mb-1">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-600 mb-3 font-medium">
                      By <span className="text-slate-800">{book.author}</span> • {book.publisher} ({book.publication_year})
                    </p>

                    {book.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {book.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                        <MapPin className="w-3.5 h-3.5" />
                        Shelf {book.shelf_number}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px] hidden sm:inline">
                        ISBN: {book.isbn}
                      </span>
                    </div>

                    {book.available_copies > 0 ? (
                      <button
                        onClick={() => navigate(`/issue-book?bookId=${book.id}`)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
                      >
                        <BookUp className="w-3.5 h-3.5" />
                        <span>Issue Copy</span>
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-rose-500 px-3 py-1.5 bg-rose-50 rounded-xl border border-rose-100">
                        All Copies Borrowed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
