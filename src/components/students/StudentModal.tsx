import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { Student, StudentStatus } from '../../services/types';

interface StudentModalProps {
  isOpen: boolean;
  student?: Student | null;
  onClose: () => void;
  onSubmit: (studentData: Omit<Student, 'id' | 'registration_date'>) => Promise<void>;
}

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biotechnology & Medicine',
  'School of Management',
  'Humanities & Social Sciences',
  'Mathematics & Computing',
  'Physics & Applied Sciences',
];

const COURSES = ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc', 'MBA', 'BBA', 'Ph.D.', 'M.A. Literature'];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  student,
  onClose,
  onSubmit,
}) => {
  const isEditing = Boolean(student);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: DEPARTMENTS[0],
    course: COURSES[0],
    year_of_study: YEARS[0],
    status: 'Active' as StudentStatus,
    max_allowed_books: 3,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (student) {
      setFormData({
        full_name: student.full_name,
        email: student.email,
        phone: student.phone,
        department: student.department,
        course: student.course,
        year_of_study: student.year_of_study,
        status: student.status,
        max_allowed_books: student.max_allowed_books,
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        department: DEPARTMENTS[0],
        course: COURSES[0],
        year_of_study: YEARS[0],
        status: 'Active',
        max_allowed_books: 3,
      });
    }
    setErrors({});
  }, [student, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.full_name.trim()) errs.full_name = 'Full name is required';
    if (!formData.email.trim() || !formData.email.includes('@')) errs.email = 'Valid email is required';
    if (!formData.phone.trim() || formData.phone.length < 8) errs.phone = 'Valid phone number is required';
    if (formData.max_allowed_books < 1) errs.max_allowed_books = 'Limit must be at least 1 book';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        department: formData.department,
        course: formData.course,
        year_of_study: formData.year_of_study,
        status: formData.status,
        max_allowed_books: Number(formData.max_allowed_books),
      });
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save student profile' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? `Edit Student: ${student?.id}` : 'Register New Student'}
              </h3>
              <p className="text-xs text-slate-300">
                {isEditing ? 'Update student records and borrowing privileges' : 'Create student library account'}
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
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Aarav Sharma"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className={`w-full px-3.5 py-2 text-sm bg-slate-50 border rounded-xl outline-hidden transition ${
                  errors.full_name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:bg-white focus:border-blue-500'
                }`}
              />
              {errors.full_name && <p className="text-[11px] text-rose-600 mt-1">{errors.full_name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institutional Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                placeholder="aarav.s@student.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3.5 py-2 text-sm bg-slate-50 border rounded-xl outline-hidden transition ${
                  errors.email ? 'border-rose-400' : 'border-slate-200 focus:bg-white focus:border-blue-500'
                }`}
              />
              {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-3.5 py-2 text-sm bg-slate-50 border rounded-xl outline-hidden transition ${
                  errors.phone ? 'border-rose-400' : 'border-slate-200 focus:bg-white focus:border-blue-500'
                }`}
              />
              {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>}
            </div>

            {/* Department */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Course */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Course Program <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
              >
                {COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Year of Study <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.year_of_study}
                onChange={(e) => setFormData({ ...formData, year_of_study: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as StudentStatus })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
              >
                <option value="Active">Active (Eligible to borrow)</option>
                <option value="Suspended">Suspended (Blocked from borrowing)</option>
                <option value="Inactive">Inactive (Graduated / Withdrawn)</option>
              </select>
            </div>

            {/* Max Allowed Books */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Borrowing Limit (Max Books)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.max_allowed_books}
                onChange={(e) => setFormData({ ...formData, max_allowed_books: parseInt(e.target.value) || 1 })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-hidden transition"
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Register Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
