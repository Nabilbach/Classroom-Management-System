// No explicit React import needed with react-jsx runtime
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableStudentRow from './SortableStudentRow';
import { StudentTableProps } from '../../types/student';

function StudentTable({ students, onEdit, onDelete, onDetail, onAssess, onUpdateNumber, isAttendanceMode, attendanceStatus, onToggleAttendance }: StudentTableProps) {
  return (
    <div className="overflow-x-auto" style={{ paddingLeft: 0, paddingRight: 0 }}>
      <table className="w-full table-auto border-collapse" style={{ margin: 0 }}>
        <thead>
          <tr className="bg-blue-gray-50/50">
            <th className="px-4 py-3 text-right text-blue-gray-900 font-semibold text-sm">ر.ت</th>
            <th className="px-4 py-3 text-right text-blue-gray-900 font-semibold text-sm">الرمز</th>
            <th className="px-4 py-3 text-right text-blue-gray-900 font-semibold text-sm">النسب</th>
            <th className="px-4 py-3 text-right text-blue-gray-900 font-semibold text-sm">الاسم</th>
            <th className="px-4 py-3 text-right text-blue-gray-900 font-semibold text-sm">النوع</th>
            <th className="px-4 py-3 text-right text-blue-gray-900 font-semibold text-sm">تاريخ الازدياد</th>
            <th className="px-4 py-3 text-right text-blue-gray-900 font-semibold text-sm">{isAttendanceMode ? 'الحضور' : 'الإجراءات'}</th>
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
                  onAssess={onAssess}
                  onUpdateNumber={onUpdateNumber}
                  rowIndex={index}
                  isAttendanceMode={!!isAttendanceMode}
                  attendanceStatus={attendanceStatus}
                  onToggleAttendance={onToggleAttendance}
                />
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-blue-gray-500 text-sm">
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