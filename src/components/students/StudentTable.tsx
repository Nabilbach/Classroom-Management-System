import React from 'react';
import { Typography, Button, Select, Option } from "@material-tailwind/react";
import { FaEdit, FaTrash, FaInfoCircle } from 'react-icons/fa';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableStudentRow from './SortableStudentRow';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  trackNumber: string;
  sectionId: string;
  gender: string;
  dateOfBirth: string;
  studentNumberInSection?: number;
  badge: string;
}

interface StudentTableProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
  onDetail: (student: Student) => void;
  onAssess: (student: Student) => void; // New prop
  onBadgeChange: (studentId: string, newBadge: string) => void;
}

function StudentTable({ students, onEdit, onDelete, onDetail, onAssess, onBadgeChange }: StudentTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr className="bg-blue-gray-50/50">
            <th className="px-4 py-3 text-right text-blue-gray-900 font-semibold text-sm">ر.ت</th>
            <th className="px-4 py-3 text-right text-blue-gray-900 font-semibold text-sm">الرمز</th>
            <th className="px-4 py-3 text-right text-blue-gray-900 font-semibold text-sm">النسب</th>
            <th className="px-4 py-3 text-right text-blue-gray-900 font-semibold text-sm">الاسم</th>
            <th className="px-4 py-3 text-right text-blue-gray-900 font-semibold text-sm">النوع</th>
            <th className="px-4 py-3 text-right text-blue-gray-900 font-semibold text-sm">تاريخ الازدياد</th>
            <th className="px-4 py-3 text-right text-blue-gray-900 font-semibold text-sm">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          <SortableContext items={students.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {students.length > 0 ? (
              students.map((student, index) => (
                <SortableStudentRow
                  key={student.id}
                  student={student}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDetail={onDetail}
                  onAssess={onAssess} // Pass prop
                  onBadgeChange={onBadgeChange}
                  rowIndex={index} // Pass index for R.T.
                />
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-blue-gray-500 text-sm"> {/* Adjusted colSpan */}
                  لا يوجد طلاب في هذا القسم أو لا توجد نتائج للبحث/التصفية.
                </td>
              </tr>
            )}
          </SortableContext>
        </tbody>
      </table>
    </div>
  );
}

export default StudentTable;