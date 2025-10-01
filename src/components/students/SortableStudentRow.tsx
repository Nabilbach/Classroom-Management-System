// No explicit React import needed with react-jsx runtime
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@material-tailwind/react";
import { FaEdit, FaTrash, FaInfoCircle, FaGripVertical, FaStar } from 'react-icons/fa';
import { Student } from '../../types/student';
import { formatDateShort } from '../../utils/formatDate';

interface SortableStudentRowProps {
  lastAssessmentDate?: string;
  xp?: number;
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (studentId: number) => void;
  onDetail: (student: Student) => void;
  onAssess: (student: Student) => void;
  onUpdateNumber: (studentId: number, newNumber: number) => void;
  rowIndex: number;
  isAttendanceMode?: boolean;
  attendanceStatus?: Record<string, boolean>;
  onToggleAttendance?: (studentId: string, isPresent: boolean) => void;
}

function SortableStudentRow({ student, lastAssessmentDate, xp, onEdit, onDelete, onDetail, onAssess, rowIndex: _rowIndex, isAttendanceMode, attendanceStatus, onToggleAttendance }: SortableStudentRowProps) {
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
        {!isAttendanceMode && (
          <Button variant="text" size="sm" {...listeners} {...attributes} className="cursor-grab mr-2 p-0">
            <FaGripVertical />
          </Button>
        )}
        {student.classOrder}
      </td>
      <td className="px-4 py-3 text-sm">{student.pathwayNumber}</td>
      <td className="px-4 py-3 text-sm">{student.lastName}</td>
      <td className="px-4 py-3 text-sm">{student.firstName}</td>
      <td className="px-4 py-3 text-sm">{student.gender}</td>
      <td className="px-4 py-3 text-sm">{student.birthDate}</td>
  <td className="px-4 py-3 text-sm">{lastAssessmentDate ? formatDateShort(lastAssessmentDate) : '-'}</td>
      <td className="px-4 py-3 text-sm">{xp ?? 0}</td>
      <td className="px-4 py-3 text-sm">
        {isAttendanceMode ? (
          <div className="flex gap-2">
            <Button
              variant={(attendanceStatus && attendanceStatus[student.id]) ? 'filled' : 'outlined'}
              size="sm"
              color="green"
              className="px-3"
              onClick={() => onToggleAttendance && onToggleAttendance(String(student.id), true)}
            >
              {student.gender && student.gender.includes('ة') ? 'حاضرة' : 'حاضر'}
            </Button>
            <Button
              variant={(attendanceStatus && attendanceStatus[student.id] === false) ? 'filled' : 'outlined'}
              size="sm"
              color="red"
              className="px-3"
              onClick={() => onToggleAttendance && onToggleAttendance(String(student.id), false)}
            >
              {student.gender && student.gender.includes('ة') ? 'غائبة' : 'غائب'}
            </Button>
          </div>
        ) : (
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
        )}
      </td>
    </tr>
  );
}

export default SortableStudentRow;
