import { useState, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { Typography, IconButton, Input } from "@material-tailwind/react";
import { FaEdit, FaTrash, FaInfoCircle, FaStar } from 'react-icons/fa';
import { Student } from '../../types/student';
import { useSettings } from '../../contexts/SettingsContext';
import { formatDateShort } from '../../utils/formatDate';

// Final merged version of the Student Card

interface StudentCardProps {
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (studentId: number) => void;
  onDetail: (student: Student) => void;
  onAssess: (student: Student) => void;
  onUpdateNumber: (studentId: number, newNumber: number) => void;
  isAttendanceMode?: boolean;
  attendanceStatus?: Record<string, boolean>;
  onToggleAttendance?: (studentId: string, isPresent: boolean) => void;
}

const StudentCard = ({ student, onEdit, onDelete, onDetail, onAssess, onUpdateNumber, isAttendanceMode, attendanceStatus, onToggleAttendance }: StudentCardProps) => {
  const { assessmentElements } = useSettings();

  // --- State for Editable Number ---
  const [isEditingNumber, setIsEditingNumber] = useState(false);
  const [numberValue, setNumberValue] = useState(student.studentNumberInSection || 0);

  useEffect(() => {
    setNumberValue(student.studentNumberInSection || 0);
  }, [student.studentNumberInSection]);

  // --- Placeholder Data for Dashboard UI ---
  const average = 85;
  const attendance = 98;
  const warnings = 1;
  // const goal = "اجتياز جميع الاختبارات بنجاح";
  // -------------------------------------

  const getBadgeStyle = (badge?: string) => {
    switch (badge) {
      case 'Excellent': case 'ممتاز': return 'bg-green-100 text-green-800 border-green-300';
      case 'Good': case 'جيد': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Needs Improvement': case 'يحتاج لتحسين': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAverageColor = (avg: number) => {
    if (avg > 79) return 'bg-green-500';
    if (avg >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleNumberUpdate = () => {
    setIsEditingNumber(false);
    const newNumber = parseInt(String(numberValue), 10);
    if (!isNaN(newNumber) && newNumber !== student.studentNumberInSection) {
      onUpdateNumber(student.id, newNumber);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleNumberUpdate();
    else if (e.key === 'Escape') {
      setIsEditingNumber(false);
      setNumberValue(student.studentNumberInSection || 0);
    }
  };

  const followUpCount = (student as any).followUpCount ?? 0;
  return (
    <div className={`rounded-xl shadow-lg p-4 border text-right flex flex-col h-full ${followUpCount > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`} dir="rtl">
      
      {/* Header: Badge and Editable Number */}
      <div className="flex justify-between items-start mb-2">
        <div className={`px-2 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle(student.badge)}`}>
          {student.badge}
        </div>
        <div 
          className="bg-gray-100 border border-gray-300 rounded-full px-3 py-1 flex items-center gap-2 cursor-pointer"
          onClick={() => !isEditingNumber && setIsEditingNumber(true)}
        >
          {isEditingNumber ? (
              <Input 
                type="number" 
                value={numberValue} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNumberValue(Number(e.target.value))} 
                onBlur={handleNumberUpdate} 
                onKeyDown={handleKeyDown} 
                autoFocus 
                className="!w-12 text-center p-0 bg-transparent border-none focus:ring-0"
                labelProps={{ className: "hidden" }}
                containerProps={{ className: "min-w-0" }}
                crossOrigin={"anonymous"}
              />
          ) : (
            <>
              <Typography variant="small" color="blue-gray" className="font-semibold">
                {student.studentNumberInSection}
              </Typography>
              <Typography variant="small" color="blue-gray" className="font-bold">
                ر.ت
              </Typography>
            </>
          )}
        </div>
      </div>

      {/* Student Name */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">{student.firstName} {student.lastName}</h3>
      </div>

      {/* XP & Last Assessment */}
      <div className="flex justify-between items-center mb-3 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xs text-yellow-600 font-semibold">💎</span>
          <div>
              <div className="text-sm font-bold">{(typeof student.total_xp === 'number' ? student.total_xp : (student.xp || 0))} XP</div>
            <div className="text-xs text-gray-500">نقاط الخبرة</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">آخر تقييم</div>
          <div className="text-xs text-gray-500">{
            (() => {
              try {
                const key = `qe_last_assessment_date_${student.id}`;
                const localVal = localStorage.getItem(key);
                if (localVal === '0') return 'لم يتم التقييم بعد';
              } catch (e) { /* ignore */ }
              return (!student.lastAssessmentDate || student.lastAssessmentDate === '0') ? 'لم يتم التقييم بعد' : formatDateShort(student.lastAssessmentDate as string);
            })()
          }</div>
        </div>
      </div>

      {/* Compact visual of latest assessment elements */}
      {assessmentElements && assessmentElements.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {assessmentElements.slice(0, 8).map(el => {
            const latest = student.assessments && student.assessments.length > 0 ? student.assessments[student.assessments.length - 1] : undefined;
            const val = latest ? (latest.scores ? latest.scores[el.id] : undefined) : undefined;
            return (
              <div key={el.id} className="p-2 bg-gray-50 rounded text-center text-xs border">
                <div className="font-semibold text-gray-700">{el.name}</div>
                <div className="mt-1 text-sm text-gray-600">
                  {el.type === 'quick_icon' ? (val ? <span className="text-lg">{val}</span> : <span>-</span>) : (val !== undefined && val !== '' ? String(val) : <span className="text-gray-400">—</span>)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Average Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className={`h-2.5 rounded-full ${getAverageColor(average)}`} style={{ width: `${average}%` }}></div>
        </div>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-center mb-4">
        <div>
          <span className="text-lg font-bold">📊</span>
          <p className="text-sm font-semibold text-gray-700">{average}%</p>
          <p className="text-xs text-gray-500">المعدل</p>
        </div>
        <div>
          <span className="text-lg font-bold">✅</span>
          <p className="text-sm font-semibold text-gray-700">{attendance}%</p>
          <p className="text-xs text-gray-500">الحضور</p>
        </div>
        <div>
          <span className="text-lg font-bold">⚠️</span>
          <p className="text-sm font-semibold text-gray-700">{warnings}</p>
          <p className="text-xs text-gray-500">إنذارات</p>
        </div>
      </div>

      

      {/* Footer: Action Buttons or Attendance Controls */}
      <div className="mt-auto pt-4 border-t border-gray-200 flex justify-around items-center">
        {isAttendanceMode ? (
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded text-sm ${attendanceStatus && attendanceStatus[student.id] ? 'bg-green-600 text-white' : 'border border-green-600 text-green-700'}`}
              onClick={() => onToggleAttendance && onToggleAttendance(String(student.id), true)}
            >
              {student.gender && student.gender.includes('ة') ? 'حاضرة' : 'حاضر'}
            </button>
            <button
              className={`px-3 py-1 rounded text-sm ${attendanceStatus && attendanceStatus[student.id] === false ? 'bg-red-600 text-white' : 'border border-red-600 text-red-700'}`}
              onClick={() => onToggleAttendance && onToggleAttendance(String(student.id), false)}
            >
              {student.gender && student.gender.includes('ة') ? 'غائبة' : 'غائب'}
            </button>
          </div>
        ) : (
          <>
            {/* Quick follow-up buttons (notebook / book) */}
            <div className="flex flex-col items-center">
              <button
                className="text-xs px-2 py-1 bg-yellow-100 rounded text-yellow-800 border border-yellow-200"
                onClick={async () => {
                  try {
                    await fetch(`http://localhost:3000/api/students/${student.id}/followups`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: 'notebook', description: 'متابعة سريعة: دفتر' })
                    });
                    // Optimistic local update: increment followUpCount if present
                    if (typeof (student as any).followUpCount === 'number') (student as any).followUpCount = (student as any).followUpCount + 1;
                    else (student as any).followUpCount = 1;
                    // Force re-render by small state trick is not available here; parent will refresh when needed.
                    // Optionally show a visual feedback: simple alert
                    // eslint-disable-next-line no-alert
                    alert('تم تسجيل متابعة: دفتر');
                  } catch (e) {
                    console.error('Failed to create followup', e);
                    // eslint-disable-next-line no-alert
                    alert('فشل تسجيل المتابعة');
                  }
                }}
              >
                دفتر
              </button>
              <Typography variant="small" className="text-xs text-gray-600">متابعة</Typography>
            </div>
            <div className="flex flex-col items-center">
              <button
                className="text-xs px-2 py-1 bg-yellow-100 rounded text-yellow-800 border border-yellow-200"
                onClick={async () => {
                  try {
                    await fetch(`http://localhost:3000/api/students/${student.id}/followups`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: 'book', description: 'متابعة سريعة: كتاب' })
                    });
                    if (typeof (student as any).followUpCount === 'number') (student as any).followUpCount = (student as any).followUpCount + 1;
                    else (student as any).followUpCount = 1;
                    // eslint-disable-next-line no-alert
                    alert('تم تسجيل متابعة: كتاب');
                  } catch (e) {
                    console.error('Failed to create followup', e);
                    // eslint-disable-next-line no-alert
                    alert('فشل تسجيل المتابعة');
                  }
                }}
              >
                كتاب
              </button>
              <Typography variant="small" className="text-xs text-gray-600">متابعة</Typography>
            </div>
            <div className="flex flex-col items-center">
              <IconButton variant="text" onClick={() => onAssess(student)} className="hover:bg-yellow-100">
                <FaStar className="text-yellow-600" />
              </IconButton>
              <Typography variant="small" className="text-xs text-gray-600 font-semibold">تقييم</Typography>
            </div>
            <div className="flex flex-col items-center">
              <IconButton variant="text" onClick={() => onEdit(student)} className="hover:bg-blue-100">
                <FaEdit className="text-blue-500" />
              </IconButton>
              <Typography variant="small" className="text-xs text-gray-600 font-semibold">تعديل</Typography>
            </div>
            <div className="flex flex-col items-center">
              <IconButton variant="text" onClick={() => onDetail(student)} className="hover:bg-gray-200">
                <FaInfoCircle className="text-gray-500" />
              </IconButton>
              <Typography variant="small" className="text-xs text-gray-600 font-semibold">تفاصيل</Typography>
            </div>
            <div className="flex flex-col items-center">
              <IconButton variant="text" onClick={() => onDelete(student.id)} className="hover:bg-red-100">
                <FaTrash className="text-red-500" />
              </IconButton>
              <Typography variant="small" className="text-xs text-gray-600 font-semibold">حذف</Typography>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentCard;
