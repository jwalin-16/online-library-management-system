import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  History, 
  Mail, 
  Phone, 
  GraduationCap, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { db } from '../services/db';
import { Student } from '../services/types';
import { Badge } from '../components/common/Badge';
import { StudentModal } from '../components/students/StudentModal';
import { StudentHistoryModal } from '../components/students/StudentHistoryModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

export const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Suspended' | 'Inactive'>('All');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [viewingHistoryStudent, setViewingHistoryStudent] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const loadStudents = async () => {
    setLoading(true);
    const data = await db.getStudents();
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.full_name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      s.phone.includes(q);

    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (studentData: Omit<Student, 'id' | 'registration_date'>) => {
    if (editingStudent) {
      await db.updateStudent(editingStudent.id, studentData);
      success(`Student "${studentData.full_name}" profile updated.`);
    } else {
      await db.addStudent(studentData);
      success(`Student "${studentData.full_name}" registered successfully.`);
    }
    loadStudents();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    setIsDeleting(true);
    try {
      await db.deleteStudent(deletingStudent.id);
      success(`Student record for "${deletingStudent.full_name}" was deleted.`);
      setDeletingStudent(null);
      loadStudents();
    } catch (err: any) {
      error(err.message || 'Cannot delete student');
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
            Student Registry & Membership
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Registered university patrons eligible for book loans ({students.length} total students)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Student</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by student name, ID (e.g. STU-2024-001), email, or department..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Suspended">Suspended</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
          Loading student records...
        </div>
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Students Found"
          description={
            searchQuery || statusFilter !== 'All'
              ? 'No student accounts match the query. Try adjusting your search term.'
              : 'No students registered in the system yet. Register your first student.'
          }
          actionText={searchQuery ? 'Clear Search' : 'Register Student'}
          onAction={() => {
            if (searchQuery || statusFilter !== 'All') {
              setSearchQuery('');
              setStatusFilter('All');
            } else {
              handleOpenAdd();
            }
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Department & Course</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Max Books</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {paginatedStudents.map((student) => {
                  const isActive = student.status === 'Active';
                  const isSuspended = student.status === 'Suspended';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition group">
                      {/* Name & Year */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {student.full_name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{student.full_name}</p>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {student.year_of_study} • Enrolled {student.registration_date}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                        {student.id}
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-medium text-slate-800 truncate">{student.department}</p>
                        <p className="text-xs text-slate-500 truncate">{student.course}</p>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5 text-xs text-slate-600">
                          <p className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{student.email}</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{student.phone}</span>
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Badge
                          variant={isActive ? 'success' : isSuspended ? 'danger' : 'neutral'}
                          size="sm"
                        >
                          {student.status}
                        </Badge>
                      </td>

                      {/* Quota */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-bold text-slate-800">
                          {student.max_allowed_books}
                        </span>
                        <span className="text-slate-400 text-xs"> max</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingHistoryStudent(student)}
                            title="View Borrowing History"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(student)}
                            title="Edit Student"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingStudent(student)}
                            title="Delete Student"
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
              {Math.min(currentPage * pageSize, filteredStudents.length)} of {filteredStudents.length} students
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
      )}

      {/* Student Add/Edit Modal */}
      <StudentModal
        isOpen={isModalOpen}
        student={editingStudent}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveStudent}
      />

      {/* Student History Modal */}
      <StudentHistoryModal
        isOpen={Boolean(viewingHistoryStudent)}
        student={viewingHistoryStudent}
        onClose={() => setViewingHistoryStudent(null)}
        onGoToReturn={(issueId) => navigate(`/return-book?issueId=${issueId}`)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingStudent)}
        title="Delete Student Profile"
        message={`Are you sure you want to delete student "${deletingStudent?.full_name}" (${deletingStudent?.id})? Students with active borrowed books cannot be deleted.`}
        confirmLabel="Delete Student"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingStudent(null)}
      />
    </div>
  );
};
