import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@material-tailwind/react";
import { FaEdit, FaTrash, FaInfoCircle, FaGripVertical, FaStar } from 'react-icons/fa';

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

interface SortableStudentRowProps {
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
  onDetail: (student: Student) => void;
  onAssess: (student: Student) => void;
  onBadgeChange: (studentId: string, newBadge: string) => void;
  rowIndex: number; // This prop is no longer used for display
}

function SortableStudentRow({ student, onEdit, onDelete, onDetail, onAssess, rowIndex }: SortableStudentRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: student.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-blue-gray-100 hover:bg-blue-gray-50"
    >
      <td className="px-4 py-3 text-sm flex items-center">
        <Button variant="text" size="sm" {...listeners} {...attributes} className="cursor-grab mr-2 p-0">
          <FaGripVertical />
        </Button>
        {/* CORRECTED: Using the student's actual property instead of the array index */}
        {student.studentNumberInSection}
      </td>
      <td className="px-4 py-3 text-sm">{student.trackNumber}</td>
      <td className="px-4 py-3 text-sm">{student.lastName}</td>
      <td className="px-4 py-3 text-sm">{student.firstName}</td>
      <td className="px-4 py-3 text-sm">{student.gender}</td>
      <td className="px-4 py-3 text-sm">{student.dateOfBirth}</td>
      <td className="px-4 py-3 text-sm">
        <div className="flex gap-2">
          <Button variant="text" size="sm" color="yellow" className="p-1" onClick={() => onAssess(student)}>
            <FaStar />
          </Button>
          <Button variant="text" size="sm" color="blue" className="p-1" onClick={() => onEdit(student)}>
            <FaEdit />
          </Button>
          <Button variant="text" size="sm" color="red" className="p-1" onClick={() => onDelete(student.id)}>
            <FaTrash />
          </Button>
          <Button variant="text" size="sm" color="gray" className="p-1" onClick={() => onDetail(student)}>
            <FaInfoCircle />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default SortableStudentRow;
