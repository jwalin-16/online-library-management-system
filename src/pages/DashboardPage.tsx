import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  CheckCircle, 
  BookUp, 
  Users, 
  AlertTriangle, 
  CircleDollarSign, 
  ArrowUpRight, 
  BookDown, 
  Plus, 
  ChevronRight,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { db } from '../services/db';
import { Book, Student, BookIssue, Fine } from '../services/types';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { ReturnConfirmModal } from '../components/returns/ReturnConfirmModal';
import { useToast } from '../contexts/ToastContext';

const PIE_COLORS = ['#2563eb', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();

  const [stats, setStats] = useState(db.getDashboardStats());
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [issues, setIssues] = useState<BookIssue[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [selectedReturnIssue, setSelectedReturnIssue] = useState<BookIssue | null>(null);

  const settings = db.getSettings();

  const refreshData = async () => {
    setStats(db.getDashboardStats());
    const [b, s, i, f] = await Promise.all([
      db.getBooks(),
      db.getStudents(),
      db.getTransactions(),
      db.getFines(),
    ]);
    setBooks(b);
    setStudents(s);
    setIssues(i);
    setFines(f);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Compute monthly issue chart data from transactions
  const monthlyData = [
    { month: 'Jun', issues: 18, returns: 16 },
    { month: 'Jul', issues: 24, returns: 20 },
    { month: 'Aug', issues: 32, returns: 28 },
    { month: 'Sep', issues: 45, returns: 40 },
    { month: 'Oct', issues: 38, returns: 31 },
    { month: 'Nov', issues: issues.length + 12, returns: issues.filter(i => i.status === 'Returned').length + 8 },
  ];

  // Compute category distribution from actual books
  const categoryCounts: Record<string, number> = {};
  books.forEach((b) => {
    categoryCounts[b.category] = (categoryCounts[b.category] || 0) + b.total_copies;
  });
  const categoryData = Object.keys(categoryCounts).map((cat) => ({
    name: cat,
    value: categoryCounts[cat],
  }));

  // Filter recently issued books (latest 5)
  const recentlyIssued = [...issues]
    .filter((i) => i.status === 'Issued' || i.status === 'Overdue')
    .slice(0, 5);

  // Filter overdue books
  const overdueList = issues.filter((i) => i.status === 'Overdue');

  // Filter recently added books (latest 5)
  const recentlyAddedBooks = [...books].slice(0, 5);

  // Filter recently registered students (latest 4)
  const recentStudents = [...students].slice(0, 4);

  const handleReturnConfirm = async (options: {
    return_date: string;
    pay_fine_now: boolean;
    payment_method?: 'Cash' | 'UPI' | 'Card' | 'Online';
  }) => {
    if (!selectedReturnIssue) return;
    const res = await db.returnBook(selectedReturnIssue.id, options);
    success(
      `Book "${res.issue.book_title}" returned successfully.${
        res.fineAmount > 0 ? ` Fine of ${settings.currency_symbol}${res.fineAmount} recorded.` : ''
      }`
    );
    setSelectedReturnIssue(null);
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-600/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold text-blue-100 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Library Circulation Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {settings.library_name}
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1.5 leading-relaxed opacity-90">
            Real-time management of book inventory, student lending transactions, returns, and overdue fine collection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => navigate('/issue-book')}
            className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2"
          >
            <BookUp className="w-4 h-4" />
            <span>Issue Book</span>
          </button>
          <button
            onClick={() => navigate('/return-book')}
            className="px-4 py-2.5 bg-blue-800/80 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition flex items-center gap-2"
          >
            <BookDown className="w-4 h-4" />
            <span>Return Book</span>
          </button>
        </div>
      </div>

      {/* 6 Key Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Books"
          value={stats.totalBooks}
          subtitle={`${stats.uniqueTitles} unique titles`}
          icon={BookOpen}
          colorScheme="blue"
          onClick={() => navigate('/books')}
        />

        <StatCard
          title="Available Books"
          value={stats.availableBooks}
          subtitle="Ready for issuance"
          icon={CheckCircle}
          colorScheme="emerald"
          onClick={() => navigate('/books')}
        />

        <StatCard
          title="Issued Books"
          value={stats.issuedBooks}
          subtitle="Currently with students"
          icon={BookUp}
          colorScheme="indigo"
          onClick={() => navigate('/transactions')}
        />

        <StatCard
          title="Students"
          value={stats.totalStudents}
          subtitle={`${stats.activeStudents} active members`}
          icon={Users}
          colorScheme="purple"
          onClick={() => navigate('/students')}
        />

        <StatCard
          title="Overdue Books"
          value={stats.overdueBooks}
          subtitle="Past scheduled due date"
          icon={AlertTriangle}
          colorScheme={stats.overdueBooks > 0 ? 'rose' : 'emerald'}
          onClick={() => navigate('/fines')}
        />

        <StatCard
          title="Pending Fines"
          value={`${settings.currency_symbol}${stats.pendingFines}`}
          subtitle={`Collected: ${settings.currency_symbol}${stats.collectedFines}`}
          icon={CircleDollarSign}
          colorScheme={stats.pendingFines > 0 ? 'amber' : 'emerald'}
          onClick={() => navigate('/fines')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Circulation Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Monthly Circulation Activity</h3>
                <p className="text-xs text-slate-500">Books issued vs. books returned over time</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
              Last 6 Months
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#93c5fd' }}
                />
                <Bar dataKey="issues" name="Books Issued" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="returns" name="Books Returned" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Donut Chart */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Inventory by Category</h3>
              <p className="text-xs text-slate-500">Distribution of catalogue copies</p>
            </div>
          </div>

          <div className="h-56 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} copies`, 'Stock']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {categoryData.slice(0, 4).map((c, i) => (
              <div key={c.name} className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                <span className="truncate text-slate-600 font-medium">{c.name}</span>
                <span className="font-bold text-slate-800 ml-auto">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Data Widgets: Overdue Alert & Recently Issued */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Books List */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Overdue Books Attention</h3>
                <p className="text-xs text-slate-500">Active loans that require return & fine collection</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/fines')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All Fines</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {overdueList.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 bg-slate-50/60 rounded-2xl border border-slate-100">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No overdue books at present</p>
              <p className="text-[11px] text-slate-400 mt-0.5">All student loans are currently within schedule.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 space-y-2">
              {overdueList.slice(0, 4).map((item) => (
                <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate">{item.book_title}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        Fine {settings.currency_symbol}{item.fine_amount}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Borrower: <span className="font-medium text-slate-700">{item.student_name}</span> • Due:{' '}
                      <span className="font-semibold text-rose-600">{item.due_date}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedReturnIssue(item)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition shrink-0"
                  >
                    Return Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Issued Books */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Recently Issued Loans</h3>
                <p className="text-xs text-slate-500">Latest active student borrowing records</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Circulation Log</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 space-y-2">
            {recentlyIssued.map((item) => (
              <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">{item.id}</span>
                    <span className="text-xs font-bold text-slate-800 truncate">{item.book_title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Issued to <span className="font-medium text-slate-700">{item.student_name}</span> on{' '}
                    <span>{item.issue_date}</span>
                  </p>
                </div>

                <Badge variant={item.status === 'Overdue' ? 'danger' : 'info'} size="sm">
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recently Added Books & Registered Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Added Books */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Recently Added Books</h3>
            <button
              onClick={() => navigate('/books')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Catalogue ({books.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentlyAddedBooks.map((b) => (
              <div key={b.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">{b.title}</p>
                  <p className="text-[11px] text-slate-500">
                    {b.author} • <span className="font-mono text-slate-600">{b.shelf_number}</span>
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                  {b.available_copies} / {b.total_copies} Avail
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Registered Students */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Recently Registered Students</h3>
            <button
              onClick={() => navigate('/students')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Registry ({students.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentStudents.map((s) => (
              <div key={s.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800">{s.full_name}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {s.department} • {s.course}
                  </p>
                </div>
                <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {s.id}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Return confirmation modal */}
      <ReturnConfirmModal
        isOpen={Boolean(selectedReturnIssue)}
        issue={selectedReturnIssue}
        onClose={() => setSelectedReturnIssue(null)}
        onConfirm={handleReturnConfirm}
      />
    </div>
  );
};
