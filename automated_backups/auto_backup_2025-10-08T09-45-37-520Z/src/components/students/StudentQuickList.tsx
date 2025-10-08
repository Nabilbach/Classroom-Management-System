import React from 'react';

interface Props {
  students: any[];
  onSelectStudent: (id: number) => void;
  currentStudentId?: number | string | null;
  collapsible?: boolean;
}

const StudentQuickList: React.FC<Props> = ({ students, onSelectStudent, currentStudentId = null, collapsible = true }) => {
  return (
    <div className="bg-white border rounded p-2 shadow-sm" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-sm">أرقام الطلاب</div>
        {collapsible && <div className="text-xs text-gray-500">قابل للطي</div>}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-3 gap-2">
          {students.map((s, idx) => {
            const id = s.id;
            // Prefer classOrder (class number) or studentNumberInSection when available.
            // Avoid falling back to the raw DB id (which can be large) — use pathwayNumber or index+1 instead.
            const label = s.classOrder ?? s.studentNumberInSection ?? s.pathwayNumber ?? (idx + 1);
            const selected = String(currentStudentId) === String(id);
            return (
              <button
                key={id}
                onClick={() => onSelectStudent(Number(id))}
                className={`py-2 rounded text-sm border ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-blue-50'} `}
                title={`${s.firstName || ''} ${s.lastName || ''}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500">اضغط للانتقال بسرعة إلى طالب</div>
    </div>
  );
};

export default StudentQuickList;
