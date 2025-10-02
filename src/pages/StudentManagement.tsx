import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Typography, Button, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, Box, Chip, TextField, MenuItem, Radio, FormControlLabel, RadioGroup } from '@mui/material';
import { Student } from '../types/student';
import { useSections } from '../contexts/SectionsContext';
import { useStudents } from '../contexts/StudentsContext';
import { useCurrentLesson } from '../hooks/useCurrentLesson';
import AddStudentForm from '../components/students/AddStudentForm';
import EditStudentModal from '../components/students/EditStudentModal';
import StudentCard from '../components/students/StudentCard';
import StudentTable from '../components/students/StudentTable';
import StudentDetailModal from '../components/students/StudentDetailModal';
import BackToTopButton from '../components/BackToTopButton';
import QuickEvaluation from '../components/evaluation/QuickEvaluation';
import StudentTableSkeleton from '../components/students/StudentTableSkeleton';
import StudentCardSkeleton from '../components/students/StudentCardSkeleton';
import ExcelUploadModal from '../components/students/ExcelUploadModal';
import AbsenceHistoryContent from '../components/AbsenceHistoryContent';
import useDebounce from '../hooks/useDebounce';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ChartBarIcon, UserGroupIcon, ExclamationCircleIcon, CalendarDaysIcon, PencilSquareIcon } from "@heroicons/react/24/solid";

// Absent Students Modal Component
interface AbsentStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  absentStudents: Student[];
  sectionName: string;
  onCancelAbsence?: (studentId: number) => void;
}

const AbsentStudentsModal: React.FC<AbsentStudentsModalProps> = ({ isOpen, onClose, absentStudents, sectionName, onCancelAbsence }) => {
  const printContent = () => {
    const printableContent = document.getElementById('printable-absent-list');
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow && printableContent) {
      printWindow.document.write('<html><head><title>قائمة الغائبين</title>');
      printWindow.document.write('<style> body { direction: rtl; font-family: Tajawal, sans-serif; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: right; } th { background-color: #f2f2f2; } </style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(printableContent.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth dir="rtl">
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        قائمة الغائبين ({absentStudents.length}) - {sectionName} - {new Date().toISOString().slice(0,10)}
      </DialogTitle>
      <DialogContent dividers>
        <div id="printable-absent-list">
          <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
            قائمة الغائبين لقسم {sectionName} - تاريخ: {new Date().toISOString().slice(0,10)}
          </Typography>
          <table style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2', fontWeight: 'bold' }}>رقم الطالب في القسم</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2', fontWeight: 'bold' }}>الاسم الكامل</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2', fontWeight: 'bold' }}>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {absentStudents.map((student: Student) => (
                <tr key={student.id}>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{student.classOrder}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{`${student.firstName} ${student.lastName}`}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <Button size="small" variant="contained" color="success" onClick={() => onCancelAbsence && onCancelAbsence(student.id)}>
                      إلغاء الغياب
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={printContent}>طباعة</Button>
        <Button onClick={onClose}>تم</Button>
      </DialogActions>
    </Dialog>
  );
};

const MemoizedStudentCard = React.memo(StudentCard);
const MemoizedStudentTable = React.memo(StudentTable);

function StudentManagement() {
  const { sections, currentSection, setCurrentSection } = useSections();
  const { students, deleteStudent, isLoading, fetchStudents } = useStudents();
  // prefix unused variables with underscore to avoid unused variable diagnostics
  const { recommendedSectionId, displayMessage: _displayMessage, isTeachingTime: _isTeachingTime } = useCurrentLesson();
  // If the user explicitly chose "All students" we suppress automatic default/ recommended
  // section selection so the UI doesn't immediately jump back to a section.
  const [userSelectedAll, setUserSelectedAll] = useState(false);

  // تطبيق اختيار القسم الذكي
  useEffect(() => {
    if (recommendedSectionId && sections.length > 0 && !currentSection && !userSelectedAll) {
      const recommendedSection = sections.find(s => s.id === recommendedSectionId);
      if (recommendedSection) {
        console.log('🎯 تطبيق اختيار القسم الذكي:', recommendedSection.name);
        setCurrentSection(recommendedSection);
        // clear the "user selected all" guard since we're programmatically choosing a section
        setUserSelectedAll(false);
      }
    }
  }, [recommendedSectionId, sections, currentSection, setCurrentSection]);

  // دالة تعيين جميع الطلاب كغائبين
  const handleMarkAllAbsent = () => {
    const allAbsentStatus = sectionStudents.reduce((acc, s) => {
      acc[s.id] = false; // false تعني غائب
      return acc;
    }, {} as Record<string, boolean>);
    setAttendanceStatus(allAbsentStatus);
  };

  // دالة تعيين جميع الطلاب كحاضرين
  const handleMarkAllPresent = () => {
    const allPresentStatus = sectionStudents.reduce((acc, s) => {
      acc[s.id] = true; // true تعني حاضر
      return acc;
    }, {} as Record<string, boolean>);
    setAttendanceStatus(allPresentStatus);
  };

  // دالة تعيين الكل كغائب ما عدا المستثنين
  const handleMarkAllAbsentExcept = () => {
    const status = sectionStudents.reduce((acc, s) => {
      acc[s.id] = excludedIds.includes(String(s.id)); // المستثنى حاضر، الباقي غائب
      return acc;
    }, {} as Record<string, boolean>);
    setAttendanceStatus(status);
    setExcludeModalOpen(false);
    setExcludedIds([]);
    setExcludeType(null);
  };

  // دالة تعيين الكل كحاضر ما عدا المستثنين
  const handleMarkAllPresentExcept = () => {
    const status = sectionStudents.reduce((acc, s) => {
      acc[s.id] = !excludedIds.includes(String(s.id)); // المستثنى غائب، الباقي حاضر
      return acc;
    }, {} as Record<string, boolean>);
    setAttendanceStatus(status);
    setExcludeModalOpen(false);
    setExcludedIds([]);
    setExcludeType(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isExcelUploadModalOpen, setIsExcelUploadModalOpen] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState<string>('');
  const [confirmModalAction, setConfirmModalAction] = useState<(() => void) | null>(null);

  const [scoreRangeFilter, setScoreRangeFilter] = useState<string>('الكل');
  const [assessmentStatusFilter, setAssessmentStatusFilter] = useState<string>('الكل');
  const [warningStatusFilter, setWarningStatusFilter] = useState<string>('الكل');

  // Attendance State
  const [isAttendanceMode, setIsAttendanceMode] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, boolean>>({});
  const [showAbsentListModal, setShowAbsentListModal] = useState(false);
  const [absentStudents, setAbsentStudents] = useState<Student[]>([]);
  // Attendance recorded state for the current section/date
  const [attendanceRecorded, setAttendanceRecorded] = useState<boolean | null>(null);

  // نافذة اختيار الطلاب المستثنين
  const [excludeModalOpen, setExcludeModalOpen] = useState(false);
  const [excludeType, setExcludeType] = useState<'absent' | 'present' | null>(null);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);

  // Local optimistic order: list of student IDs in their temporary order
  const [localOrderIds, setLocalOrderIds] = useState<number[] | null>(null);

  // Absence History Modal State
  const [showAbsenceHistoryModal, setShowAbsenceHistoryModal] = useState(false);

  // --- Schedule Alert State ---
  interface AdminScheduleEntry {
    id: string;
    day: string; // Arabic weekday like "الإثنين"
    startTime: string; // HH:MM
    duration: number; // hours
    sectionId?: string | null;
    subject?: string | null;
  }
  const [adminSchedule, setAdminSchedule] = useState<AdminScheduleEntry[]>([]);
  const [nowTick, setNowTick] = useState<number>(Date.now());

  // Fetch admin schedule once
  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch('http://localhost:3000/api/admin-schedule');
        if (!resp.ok) throw new Error('failed');
        const data = await resp.json();
        setAdminSchedule(Array.isArray(data) ? data : (data.value || []));
      } catch (e) {
        console.warn('Failed to load admin schedule', e);
        setAdminSchedule([]);
      }
    };
    load();
  }, []);

  // Tick every 30s to refresh countdowns
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const weekdayArabic = useMemo(() => {
    const daysAr = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const d = new Date(nowTick);
    return daysAr[d.getDay()];
  }, [nowTick]);

  const parseHM = (hm: string): { h: number; m: number; total: number } | null => {
    if (!hm) return null;
    const [hh, mm] = hm.split(':').map((v) => parseInt(v, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    return { h: hh, m: mm, total: hh * 60 + mm };
  };

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const addMinutes = (startTotal: number, mins: number) => {
    let t = startTotal + mins;
    t = ((t % (24 * 60)) + (24 * 60)) % (24 * 60);
    const h = Math.floor(t / 60), m = t % 60;
    return { total: t, label: `${pad2(h)}:${pad2(m)}` };
  };
  const niceRemaining = (mins: number) => {
    if (mins <= 0) return 'انتهت';
    if (mins < 60) return `${mins} دقيقة`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h} ساعة و ${m} دقيقة` : `${h} ساعة`;
  };

  const todayScheduleSorted = useMemo(() => {
    const today = adminSchedule.filter(e => e.day === weekdayArabic && e.sectionId);
    return today
      .map(e => ({ ...e, start: parseHM(e.startTime)?.total ?? 0, end: addMinutes(parseHM(e.startTime)?.total ?? 0, Math.round((e.duration || 1) * 60)).total }))
      .sort((a, b) => a.start - b.start);
  }, [adminSchedule, weekdayArabic]);

  const scheduleBanner = useMemo(() => {
    if (!todayScheduleSorted.length) {
      return { mode: 'none' as 'none' | 'active' | 'idle', text: 'لا توجد حصص متبقية اليوم', color: '#9e9e9e' };
    }
    const now = new Date(nowTick);
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const active = todayScheduleSorted.find(e => minutesNow >= e.start && minutesNow < e.end);
    const next = todayScheduleSorted.find(e => e.start > minutesNow);

    if (active) {
      const rem = active.end - minutesNow;
      const secName = sections.find(s => String(s.id) === String(active.sectionId))?.name || String(active.sectionId);
      const nextName = next ? (sections.find(s => String(s.id) === String(next.sectionId))?.name || String(next.sectionId)) : '—';
      return {
        mode: 'active' as const,
        text: `أنت الآن في حصة مع قسم: ${secName} · بقي على إنتهاء الحصة: ${niceRemaining(rem)} · القسم التالي: ${nextName}`,
        color: '#ef4444', // red-500
      };
    }

    if (!next) {
      return { mode: 'none' as const, text: 'لا توجد حصص متبقية اليوم', color: '#9e9e9e' };
    }

    const secName = sections.find(s => String(s.id) === String(next.sectionId))?.name || String(next.sectionId);
    const startLabel = `${pad2(Math.floor(next.start / 60))}:${pad2(next.start % 60)}`;
    const endLabel = `${pad2(Math.floor(next.end / 60))}:${pad2(next.end % 60)}`;
    return {
      mode: 'idle' as const,
      text: `الحصة القادمة: ${secName} · ${startLabel}-${endLabel}`,
      color: '#3b82f6', // blue-500
    };
  }, [todayScheduleSorted, nowTick, sections]);

  useEffect(() => {
    // Only auto-select the first section when there is no current section
    // and the user hasn't explicitly chosen "All students".
    if (sections.length > 0 && !currentSection && !userSelectedAll) {
      setCurrentSection(sections[0]);
    }
  }, [sections, setCurrentSection, currentSection, userSelectedAll]);

  const sectionStudents = useMemo(() => {
    // Helper to get index in local order map (if any)
    let orderIndex: Map<number, number> | null = null;
    if (localOrderIds) {
      orderIndex = new Map(localOrderIds.map((id, idx) => [id, idx]));
    }

    const sortWithLocal = (a: Student, b: Student) => {
      if (orderIndex) {
        const ai = orderIndex.has(a.id) ? (orderIndex.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
        const bi = orderIndex.has(b.id) ? (orderIndex.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
        if (ai !== bi) return ai - bi;
      }
      return a.classOrder - b.classOrder;
    };

    if (!currentSection) return [...students].sort(sortWithLocal);
    return students
      .filter((student) => {
        const sId = student.sectionId as any;
        const cId = currentSection.id as any;
        return sId != null && cId != null && String(sId) === String(cId);
      })
      .slice()
      .sort(sortWithLocal);
  }, [students, currentSection, localOrderIds]);

  const { averageScore, topStudents, needsAttention, weeklyAssessments } = useMemo(() => {
    if (!currentSection || sectionStudents.length === 0) {
      return { averageScore: 0, topStudents: 0, needsAttention: 0, weeklyAssessments: 0 };
    }

    const totalScore = sectionStudents.reduce((sum, student) => sum + (student.score || 0), 0);
    const averageScore = totalScore / sectionStudents.length;
    const topStudents = sectionStudents.filter(student => (student.score || 0) >= 18).length;
    const needsAttention = sectionStudents.filter(student => (student.score || 0) < 10).length;
    const weeklyAssessments = sectionStudents.filter(student => student.score !== undefined).length;

    return { averageScore, topStudents, needsAttention, weeklyAssessments };
  }, [sectionStudents, currentSection]);
  
  // Follow-up count for current section (simple quick count)
  const [sectionFollowupCount, setSectionFollowupCount] = useState<number>(0);
  const [followupDialogOpen, setFollowupDialogOpen] = useState(false);
  const [followupStudents, setFollowupStudents] = useState<Array<{id:number, firstName:string, lastName:string, followupCount:number}>>([]);
  useEffect(() => {
    const load = async () => {
      if (!currentSection) { setSectionFollowupCount(0); return; }
      try {
        const resp = await fetch(`http://localhost:3000/api/sections/${currentSection.id}/followups-count`);
        if (!resp.ok) { setSectionFollowupCount(0); return; }
        const data = await resp.json();
        setSectionFollowupCount(data.count || 0);
      } catch (e) {
        console.warn('Failed to load followup count', e);
        setSectionFollowupCount(0);
      }
    };
    load();
  }, [currentSection, students]);

  // Check whether attendance for the current section/date is already recorded
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!currentSection) {
        setAttendanceRecorded(null);
        return;
      }
      const date = new Date().toISOString().split('T')[0];
      try {
        const resp = await fetch(`http://localhost:3000/api/attendance?date=${date}&sectionId=${encodeURIComponent(String(currentSection.id))}`);
        if (!resp.ok) {
          if (!cancelled) setAttendanceRecorded(null);
          return;
        }
        const data = await resp.json();
        if (!cancelled) setAttendanceRecorded(Array.isArray(data) ? data.length > 0 : null);
      } catch (e) {
        console.warn('Failed to check attendance recorded status', e);
        if (!cancelled) setAttendanceRecorded(null);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [currentSection, fetchStudents]);

  const openFollowupDialog = async () => {
    if (!currentSection) return;
    try {
      const resp = await fetch(`http://localhost:3000/api/sections/${currentSection.id}/followups-students`);
      if (!resp.ok) { setFollowupStudents([]); setFollowupDialogOpen(true); return; }
      const data = await resp.json();
      setFollowupStudents(Array.isArray(data) ? data : []);
      setFollowupDialogOpen(true);
    } catch (e) {
      console.warn('Failed to load followup students', e);
      setFollowupStudents([]);
      setFollowupDialogOpen(true);
    }
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = sectionStudents.findIndex((s) => s.id == active.id);
    const newIndex = sectionStudents.findIndex((s) => s.id == over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sectionStudents, oldIndex, newIndex);
    const updatedWithOrder = reordered.map((student, index) => ({
      ...student,
      classOrder: index + 1,
    }));

    try {
      // Optimistically update local order for instant UI feedback
      setLocalOrderIds(updatedWithOrder.map(s => s.id as number));

      const response = await fetch(`http://localhost:3000/api/students/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: updatedWithOrder.map(s => s.id) }),
      });

      if (!response.ok) {
        throw new Error('فشل في حفظ الترتيب على الخادم');
      }

      console.log('✅ الترتيب تم حفظه بنجاح');
      // Refresh from server to sync classOrder and clear local override
      await fetchStudents();
      setLocalOrderIds(null);

    } catch (error) {
      console.error('❌ خطأ في حفظ الترتيب:', error);
      alert('تعذر حفظ الترتيب. تحقق من الاتصال وحاول لاحقًا.');
      // Clear local override on failure
      setLocalOrderIds(null);
      // Optional: Revert state or refetch on failure
      // For now, we just alert the user.
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Quick-select student from the widget is handled inside QuickEvaluation when needed

  const isNumericSearch = (term: string): boolean => /^\d+$/.test(term);
  const isPathwaySearch = (term: string): boolean => term.toUpperCase().startsWith('H');

  const finalFilteredStudents = useMemo(() => {
    let studentsToFilter = sectionStudents;
    const trimmedSearch = debouncedSearchTerm.trim();
    if (trimmedSearch) {
      const lowerCaseSearchTerm = trimmedSearch.toLowerCase();
      studentsToFilter = studentsToFilter.filter((student) => {
        if (isNumericSearch(trimmedSearch)) return student.classOrder?.toString() === trimmedSearch;
        if (isPathwaySearch(trimmedSearch)) return student.pathwayNumber.toLowerCase().includes(lowerCaseSearchTerm);
        return (
          student.firstName.toLowerCase().includes(lowerCaseSearchTerm) ||
          student.lastName.toLowerCase().includes(lowerCaseSearchTerm) ||
          student.pathwayNumber.toLowerCase().includes(lowerCaseSearchTerm)
        );
      });
    }
    if (scoreRangeFilter !== 'الكل') {
      studentsToFilter = studentsToFilter.filter(student => {
        const score = student.score;
        if (score === undefined || score === null) return false;
        if (scoreRangeFilter === '0-4') return score >= 0 && score < 4;
        if (scoreRangeFilter === '4-6') return score >= 4 && score < 6;
        if (scoreRangeFilter === '6-8') return score >= 6 && score < 8;
        if (scoreRangeFilter === '8-10') return score >= 8 && score <= 10;
        return true;
      });
    }
    if (assessmentStatusFilter !== 'الكل') {
      studentsToFilter = studentsToFilter.filter(student => {
        const isAssessed = Boolean(student.score && student.score > 0);
        if (assessmentStatusFilter === 'مقيم') return isAssessed;
        if (assessmentStatusFilter === 'غير مقيم') return !isAssessed;
        return true;
      });
    }
    if (warningStatusFilter !== 'الكل') {
      studentsToFilter = studentsToFilter.filter(student => {
        const hasWarnings = Boolean(student.score && student.score < 10);
        if (warningStatusFilter === 'مع إنذار') return hasWarnings;
        if (warningStatusFilter === 'بدون إنذار') return !hasWarnings;
        return true;
      });
    }
    return studentsToFilter;
  }, [sectionStudents, debouncedSearchTerm, scoreRangeFilter, assessmentStatusFilter, warningStatusFilter]);

  const handleEditStudent = useCallback((student: Student) => {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  }, []);

  const handleDetailStudent = useCallback((student: Student) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
  }, []);

  const handleAssessStudent = useCallback((student: Student) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(false);
    setIsAssessmentModalOpen(true);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setScoreRangeFilter('الكل');
    setAssessmentStatusFilter('الكل');
    setWarningStatusFilter('الكل');
  }, []);

  const handleConfirmModalOpen = useCallback((message: string, action: () => void) => {
    setConfirmModalMessage(message);
    setConfirmModalAction(() => action);
    setIsConfirmModalOpen(true);
  }, []);

  const handleConfirmModalClose = useCallback(() => {
    setIsConfirmModalOpen(false);
    setConfirmModalMessage('');
    setConfirmModalAction(null);
  }, []);

  const handleConfirmAction = useCallback(() => {
    if (confirmModalAction) {
      confirmModalAction();
    }
    handleConfirmModalClose();
  }, [confirmModalAction, handleConfirmModalClose]);

  const handleDeleteStudent = useCallback((studentId: number) => {
    handleConfirmModalOpen("هل أنت متأكد أنك تريد حذف هذا الطالب؟", () => deleteStudent(studentId));
  }, [deleteStudent, handleConfirmModalOpen]);

  const handleDeleteAllStudents = useCallback(() => {
    if (!currentSection) {
      alert("الرجاء اختيار قسم لحذف الطلاب منه.");
      return;
    }
    handleConfirmModalOpen(
      `هل أنت متأكد أنك تريد حذف جميع طلاب قسم ${currentSection.name}؟ هذا الإجراء لا يمكن التراجع عنه.`,
      async () => {
        try {
          const response = await fetch(`http://localhost:3000/api/sections/${currentSection.id}/students`, { method: 'DELETE' });
          if (!response.ok) throw new Error('فشل في الحذف');
          fetchStudents(); // Refresh the list
          alert(`تم حذف جميع طلاب قسم ${currentSection.name} من السيرفر والواجهة.`);
        } catch (error) {
          console.error("Error deleting students:", error);
          alert("فشل في الاتصال بالسيرفر. تحقق من الشبكة أو السيرفر.");
        } finally {
          await fetchStudents();
        }
      }
    );
  }, [currentSection, handleConfirmModalOpen, fetchStudents]);

  // --- Attendance Functions ---
  const handleEnterAttendanceMode = () => {
    setIsAttendanceMode(true);
    const initialStatus = sectionStudents.reduce((acc, s) => {
      acc[s.id] = true; // Default to present
      return acc;
    }, {} as Record<string, boolean>);
    setAttendanceStatus(initialStatus);
  };

  const handleCancelAttendance = () => {
    setIsAttendanceMode(false);
    setAttendanceStatus({});
  };

  const handleToggleAttendance = (studentId: string, isPresent: boolean) => {
    setAttendanceStatus(prev => ({ ...prev, [studentId]: isPresent }));
  };

  const handleSaveAttendance = async () => {
    if (!currentSection) return;

    const attendanceData = Object.entries(attendanceStatus).map(([studentId, isPresent]) => ({
      studentId,
      isPresent,
      sectionId: currentSection.id,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    }));

    try {
      const response = await fetch(`http://localhost:3000/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance: attendanceData }),
      });

      if (!response.ok) {
        throw new Error('Failed to save attendance');
      }

      // Update local student data
      fetchStudents(); // Refresh after attendance update

      // mark attendance as recorded for this section/date
      setAttendanceRecorded(true);

      const absent = sectionStudents.filter(s => !attendanceStatus[s.id]);
      setAbsentStudents(absent);
      setShowAbsentListModal(true);
      setIsAttendanceMode(false);

    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('فشل في حفظ بيانات الحضور.');
    }
  };

  // Cancel a single student's absence (mark present) from the absent list
  const handleCancelAbsence = async (studentId: number) => {
    if (!currentSection) return;
    const payload = {
      attendance: [
        {
          studentId: String(studentId),
          isPresent: true,
          sectionId: currentSection.id,
          date: new Date().toISOString().split('T')[0],
        }
      ]
    };

    try {
      const resp = await fetch('http://localhost:3000/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('Failed to update attendance');

      // Refresh students and absent list
      await fetchStudents();
      setAbsentStudents((prev) => prev.filter(s => s.id !== studentId));
    } catch (e) {
      console.error('Failed to cancel absence for student', studentId, e);
      alert('فشل في إلغاء الغياب. حاول مرة أخرى.');
    }
  };

  return (
  <div dir="rtl" style={{ paddingTop: 0, background: '#f8f9fa' }}>
    {/* Styles to enlarge/action buttons inside the students area */}
    <style>{`
      /* enlarge general MUI buttons inside the students area */
      .actions-scale .MuiButton-root {
        font-size: 0.95rem;
        padding: 8px 14px;
        min-width: 64px;
        border-radius: 8px;
      }
      /* slightly smaller padding for small-size buttons */
      .actions-scale .MuiButton-sizeSmall {
        padding: 6px 10px;
      }
      /* reduce visual clutter for icon-only or tight buttons */
      .actions-scale .MuiButton-root.icon-only {
        padding: 6px 8px;
        min-width: unset;
      }
      /* if your student table uses a specific actions column, this helps spacing */
      .actions-scale .student-actions > * {
        margin-inline-start: 8px;
      }
    `}</style>

    <div className="actions-scale">
    {/* Sticky action bar */}
      <div className="flex flex-wrap justify-between items-center mb-2 sticky top-0 z-20 bg-white shadow-sm py-1 px-2" style={{ borderBottom: '1px solid #eee', marginRight: 0 }}>
        <Typography variant="h4" color="blue-gray" sx={{ fontWeight: 'bold' }}>إدارة الطلاب</Typography>
        <div className="flex flex-wrap gap-2 overflow-x-auto" style={{ maxWidth: '100%' }}>
          {!isAttendanceMode ? (
            <>
              <Button onClick={handleEnterAttendanceMode} variant="contained" color="secondary" startIcon={<PencilSquareIcon className="h-5 w-5" />}>
                📝 تسجيل الحضور والغياب
              </Button>
              <Button onClick={() => setShowAbsenceHistoryModal(true)} variant="outlined" color="info">
                📊 سجل الغياب
              </Button>
              <Button onClick={() => setIsAddModalOpen(true)} variant="contained" color="primary">
                إضافة طالب جديد
              </Button>
              <Button onClick={() => setIsExcelUploadModalOpen(true)} variant="outlined" color="primary">
                رفع Excel
              </Button>
              <Button onClick={handleDeleteAllStudents} color="error" variant="outlined" sx={{ fontWeight: 'bold' }}>
                حذف جميع الطلاب
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleSaveAttendance} variant="contained" color="success">
                حفظ الحضور
              </Button>
              <Button onClick={handleMarkAllPresent} variant="contained" color="success" sx={{ backgroundColor: '#4caf50', color: 'white', fontWeight: 'bold' }}>
                ✅ الجميع حاضر
              </Button>
              <Button onClick={handleMarkAllAbsent} variant="contained" color="warning" sx={{ backgroundColor: '#ff9800', color: 'white', fontWeight: 'bold' }}>
                🚫 الجميع غائب
              </Button>
              <Button onClick={() => { setExcludeType('absent'); setExcludeModalOpen(true); }} variant="outlined" color="warning" sx={{ fontWeight: 'bold' }}>
                ⚠️ الجميع غائب ما عدا...
              </Button>
              <Button onClick={() => { setExcludeType('present'); setExcludeModalOpen(true); }} variant="outlined" color="success" sx={{ fontWeight: 'bold' }}>
                ✅ الجميع حاضر ما عدا...
              </Button>
              <Button onClick={handleCancelAttendance} variant="outlined" color="error">
                إلغاء
              </Button>
            </>
          )}
        </div>
      </div>
          {/* spacer for layout (the quick-select widget is shown inside the evaluation modal now) */}
          <div className="mb-4" />

      {/* Statistic Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 mt-2">
                <Card onClick={openFollowupDialog} className="bg-blue-50 p-4 cursor-pointer hover:shadow-lg"><CardContent className="p-0"><div className="flex items-center justify-between mb-2"><Typography variant="h6" color="textPrimary">يحتاج متابعة</Typography><ChartBarIcon className="h-5 w-5 text-blue-600" /></div><Typography variant="h4" color="textPrimary" className="font-bold" sx={{ fontWeight: 'bold' }}>{sectionFollowupCount}</Typography><Typography variant="body2" color="textSecondary" className="mt-1">عدد المتابعات المفتوحة · معدل القسم: {Number(averageScore).toFixed(1)}</Typography></CardContent></Card>
                <Card className="bg-green-50 p-4"><CardContent className="p-0"><div className="flex items-center justify-between mb-2"><Typography variant="h6" color="textPrimary">المتفوقون</Typography><UserGroupIcon className="h-5 w-5 text-green-600" /></div><Typography variant="h4" color="textPrimary" className="font-bold" sx={{ fontWeight: 'bold' }}>{topStudents}</Typography><Typography variant="body2" color="textSecondary" className="mt-1">18+ نقطة</Typography></CardContent></Card>
                <Card className="bg-yellow-50 p-4 border border-yellow-200"><CardContent className="p-0"><div className="flex items-center justify-between mb-2"><Typography variant="h6" color="textPrimary">يحتاج متابعة</Typography><ExclamationCircleIcon className="h-5 w-5 text-yellow-600" /></div><Typography variant="h4" color="textPrimary" className="font-bold" sx={{ fontWeight: 'bold' }}>{needsAttention}</Typography><Typography variant="body2" color="textSecondary" className="mt-1">أقل من 10 نقاط</Typography></CardContent></Card>
                <Card className="bg-indigo-50 p-4"><CardContent className="p-0"><div className="flex items-center justify-between mb-2"><Typography variant="h6" color="textPrimary">تقييمات هذا الأسبوع</Typography><CalendarDaysIcon className="h-5 w-5 text-indigo-600" /></div><Typography variant="h4" color="textPrimary" className="font-bold" sx={{ fontWeight: 'bold' }}>{weeklyAssessments}</Typography><Typography variant="body2" color="textSecondary" className="mt-1">طالب تم تقييمه</Typography></CardContent></Card>
      </div>

  {/* Sticky section chips bar */}
  <div className="flex gap-2 mb-4 overflow-x-auto pb-2 sticky top-[56px] z-10 bg-white border-b border-gray-100 chips-scrollbar w-full" style={{ minHeight: '48px' }}>
        <Button
          variant={!currentSection ? "contained" : "outlined"}
          onClick={() => {
            setCurrentSection(null);
            // User explicitly chose All students; suppress automatic recommended selection
            setUserSelectedAll(true);
          }}
          className="flex-shrink-0"
          sx={{ fontWeight: 'bold' }}
        >
          جميع التلاميذ
        </Button>
        {sections.map((section) => (
          <Button
            key={section.id}
            variant={currentSection?.id === section.id ? "contained" : "outlined"}
            onClick={() => {
              setCurrentSection(section);
              // Clear the 'user selected all' guard when the user explicitly picks a section
              setUserSelectedAll(false);
            }}
            className="flex-shrink-0"
            sx={{ fontWeight: 'bold' }}
          >
            {section.name}
          </Button>
        ))}
      </div>

      {/* Schedule Alert Banner under tabs */}
      <div className="w-full mb-3 px-2">
        <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm" dir="rtl">
          <div className="relative h-3 w-3">
            {scheduleBanner.mode === 'active' ? (
              <>
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full opacity-75" style={{ backgroundColor: scheduleBanner.color }}></span>
                <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: scheduleBanner.color }}></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: scheduleBanner.color }}></span>
            )}
          </div>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>{scheduleBanner.text}</Typography>
        </div>
      </div>

      <div className="min-h-[500px] w-full overflow-fix">
        {sections.length > 0 ? (
          <Card className="p-4 w-full responsive-container">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col gap-2">
                <Typography variant="h5" color="blue-gray" sx={{ fontWeight: 'bold' }}>
                  {currentSection ? `طلاب قسم ${currentSection.name}` : 'جميع التلاميذ'} ({finalFilteredStudents.length} طالب)
                </Typography>
                {/* Attendance recorded status (always shown for the current view) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {attendanceRecorded !== null ? (
                    <Chip
                      label={attendanceRecorded ? 'حالة الغياب: مسجل' : 'حالة الغياب: غير مسجل'}
                      size="small"
                      sx={{
                        bgcolor: attendanceRecorded ? 'success.light' : '#ffe6e6',
                        color: attendanceRecorded ? 'success.dark' : '#b91c1c',
                        fontWeight: 'bold',
                        '& .MuiChip-label': { fontSize: '0.75rem' }
                      }}
                    />
                  ) : (
                    <Chip label={'حالة الغياب: ...'} size="small" sx={{ fontWeight: 'bold', '& .MuiChip-label': { fontSize: '0.75rem' } }} />
                  )}
                </Box>
              </div>
            </div>

            {/* Inline filter controls */}
            <div className="w-full mb-4 bg-white p-3 rounded-md border" dir="rtl">
              <div className="flex flex-col md:flex-row md:items-end md:gap-4">
                <TextField type="text" label="ابحث بالاسم، رقم التلميذ، أو رقم التتبع (H...)" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} fullWidth margin="dense" />
                <TextField select label="تصفية حسب المعدل" value={scoreRangeFilter} onChange={e => setScoreRangeFilter(e.target.value)} margin="dense" sx={{ minWidth: 160 }}>
                  <MenuItem value="الكل">الكل</MenuItem>
                  <MenuItem value="0-4">من 0 إلى 4</MenuItem>
                  <MenuItem value="4-6">من 4 إلى 6</MenuItem>
                  <MenuItem value="6-8">من 6 إلى 8</MenuItem>
                  <MenuItem value="8-10">من 8 إلى 10</MenuItem>
                </TextField>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, marginBottom: 6 }}>حالة التقييم</div>
                    <RadioGroup row value={assessmentStatusFilter} onChange={(e) => setAssessmentStatusFilter(e.target.value)}>
                      <FormControlLabel value="الكل" control={<Radio />} label="الكل" />
                      <FormControlLabel value="مقيم" control={<Radio />} label="مقيم" />
                      <FormControlLabel value="غير مقيم" control={<Radio />} label="غير مقيم" />
                    </RadioGroup>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, marginBottom: 6 }}>حالة الإنذار</div>
                    <RadioGroup row value={warningStatusFilter} onChange={(e) => setWarningStatusFilter(e.target.value)}>
                      <FormControlLabel value="الكل" control={<Radio />} label="الكل" />
                      <FormControlLabel value="مع إنذار" control={<Radio />} label="مع إنذار" />
                      <FormControlLabel value="بدون إنذار" control={<Radio />} label="بدون إنذار" />
                    </RadioGroup>
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <Button variant="outlined" onClick={handleClearFilters}>مسح الفلاتر</Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mb-4">
              <Button variant={viewMode === 'table' ? "contained" : "outlined"} onClick={() => setViewMode('table')} size="small" sx={{ fontWeight: 'bold' }}>عرض الجدول</Button>
              <Button variant={viewMode === 'card' ? "contained" : "outlined"} onClick={() => setViewMode('card')} size="small" sx={{ fontWeight: 'bold' }}>عرض البطاقات</Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              {isLoading ? (
                viewMode === 'table' ? <StudentTableSkeleton /> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(6)].map((_, i) => <StudentCardSkeleton key={i} />)}
                  </div>
                )
              ) : viewMode === 'table' ? (
                  <MemoizedStudentTable
                    students={finalFilteredStudents}
                    onEdit={handleEditStudent}
                    onDelete={handleDeleteStudent}
                    onDetail={handleDetailStudent}
                    onAssess={handleAssessStudent}
                    onUpdateNumber={() => {}}
                    isAttendanceMode={isAttendanceMode}
                    attendanceStatus={attendanceStatus}
                    onToggleAttendance={handleToggleAttendance}
                  />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {finalFilteredStudents.length > 0 ? (
                    finalFilteredStudents.map((student) => (
                      <MemoizedStudentCard
                        key={student.id}
                        student={student}
                        onEdit={handleEditStudent}
                        onDelete={handleDeleteStudent}
                        onDetail={handleDetailStudent}
                        onAssess={handleAssessStudent}
                        onUpdateNumber={() => {}}
                        isAttendanceMode={isAttendanceMode}
                        attendanceStatus={attendanceStatus}
                        onToggleAttendance={handleToggleAttendance}
                      />
                    ))
                  ) : (
                    <Typography className="px-4 py-2 text-center text-blue-gray-500 col-span-full">لا يوجد طلاب في هذا القسم أو لا توجد نتائج للبحث/التصفية.</Typography>
                  )}
                </div>
              )}
            </DndContext>
          </Card>
        ) : (
          <Typography variant="body1" color="textSecondary" className="mt-4">لا توجد أقسام متاحة. الرجاء إضافة قسم جديد أولاً.</Typography>
        )}
      </div>

      <AddStudentForm isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
  <EditStudentModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingStudent(null); }} student={editingStudent as any} />
  <StudentDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} student={selectedStudent as any} onAssess={handleAssessStudent as any} />
  {/* استبدال نافذة التقييم البسيطة بنافذة التقييم المتقدمة */}
  <Dialog data-testid="quick-eval-dialog" open={isAssessmentModalOpen} onClose={() => setIsAssessmentModalOpen(false)} maxWidth="xl" fullWidth={false} sx={{ minWidth: '1100px' }}>
    <QuickEvaluation
      studentId={selectedStudent ? String(selectedStudent.id) : ''}
      studentName={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : ''}
      onClose={() => setIsAssessmentModalOpen(false)}
      sectionStudents={sectionStudents}
      onSwitchStudent={(id: number) => {
        // switch the modal to another student id without closing it
        const found = students.find(s => Number(s.id) === Number(id)) || null;
        setSelectedStudent(found as any);
      }}
      onSave={async (updatedEvaluation) => {
        console.log('QuickEvaluation.onSave called for student', selectedStudent?.id, { updatedEvaluation });
        // Refresh students from server so the new evaluation / XP appears in lists and cards
        try {
              // Always refetch to ensure full sync (covers save, reset, or other actions)
              await fetchStudents();
          // Optionally keep the modal closed (QuickEvaluation already calls onClose)
        } catch (e) {
          console.warn('Failed to refresh students after saving evaluation', e);
        }
      }}
    />
  </Dialog>
      <ExcelUploadModal isOpen={isExcelUploadModalOpen} onClose={() => setIsExcelUploadModalOpen(false)} />
  <AbsentStudentsModal isOpen={showAbsentListModal} onClose={() => setShowAbsentListModal(false)} absentStudents={absentStudents} sectionName={currentSection?.name || ''} onCancelAbsence={handleCancelAbsence} />

      {/* Absence History Modal */}
      <Dialog 
        open={showAbsenceHistoryModal} 
        onClose={() => setShowAbsenceHistoryModal(false)} 
        maxWidth="lg" 
        fullWidth
        dir="rtl"
      >
        <DialogTitle>سجل الغياب والحضور</DialogTitle>
        <DialogContent dividers>
          <AbsenceHistoryContent onClose={() => setShowAbsenceHistoryModal(false)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAbsenceHistoryModal(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isConfirmModalOpen} onClose={handleConfirmModalClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>تأكيد الإجراء</DialogTitle>
        <DialogContent dividers><Typography>{confirmModalMessage}</Typography></DialogContent>
        <DialogActions>
          <Button variant="text" color="error" onClick={handleConfirmAction} sx={{ ml: 2, fontWeight: 'bold' }}>تأكيد</Button>
          <Button variant="text" color="inherit" onClick={handleConfirmModalClose}>إلغاء</Button>
        </DialogActions>
      </Dialog>

      {/* نافذة اختيار الطلاب المستثنين */}
      <Dialog open={excludeModalOpen} onClose={() => setExcludeModalOpen(false)} maxWidth="sm" fullWidth dir="rtl">
        <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: excludeType === 'absent' ? '#fff3e0' : '#e8f5e8' }}>
          {excludeType === 'absent' ? '⚠️ اختر الطلاب الحاضرين (الباقي سيكون غائب)' : '✅ اختر الطلاب الغائبين (الباقي سيكون حاضر)'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold', marginBottom: 2 }}>
            {excludeType === 'absent' 
              ? 'سيتم تعيين جميع الطلاب كغائبين ما عدا من تختارهم هنا:' 
              : 'سيتم تعيين جميع الطلاب كحاضرين ما عدا من تختارهم هنا:'}
          </Typography>
          <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #ddd', borderRadius: '8px', padding: '8px' }}>
            {sectionStudents.map((student) => (
              <div key={student.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 12, padding: '8px', backgroundColor: excludedIds.includes(String(student.id)) ? '#e3f2fd' : '#fff', borderRadius: '4px', border: '1px solid #eee' }}>
                <input
                  type="checkbox"
                  checked={excludedIds.includes(String(student.id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setExcludedIds((prev) => [...prev, String(student.id)]);
                    } else {
                      setExcludedIds((prev) => prev.filter((id) => id !== String(student.id)));
                    }
                  }}
                  id={`exclude-${student.id}`}
                  style={{ marginLeft: 8 }}
                />
                <label htmlFor={`exclude-${student.id}`} style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  {student.classOrder}. {student.firstName} {student.lastName}
                </label>
              </div>
            ))}
          </div>
          {excludedIds.length > 0 && (
            <Typography variant="body2" sx={{ marginTop: 2, fontWeight: 'bold', color: excludeType === 'absent' ? '#ff9800' : '#4caf50' }}>
              عدد المستثنين: {excludedIds.length} طالب
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          {excludeType === 'absent' ? (
            <Button onClick={handleMarkAllAbsentExcept} variant="contained" color="warning" disabled={excludedIds.length === 0}>
              ⚠️ تطبيق (الجميع غائب ما عدا المحددين)
            </Button>
          ) : (
            <Button onClick={handleMarkAllPresentExcept} variant="contained" color="success" disabled={excludedIds.length === 0}>
              ✅ تطبيق (الجميع حاضر ما عدا المحددين)
            </Button>
          )}
          <Button onClick={() => { setExcludeModalOpen(false); setExcludedIds([]); setExcludeType(null); }} variant="outlined" color="error">
            إلغاء
          </Button>
        </DialogActions>
      </Dialog>

      {/* Followups dialog */}
      <Dialog open={followupDialogOpen} onClose={() => setFollowupDialogOpen(false)} maxWidth="sm" fullWidth dir="rtl">
        <DialogTitle>طلاب يحتاجون متابعة ({followupStudents.length})</DialogTitle>
        <DialogContent dividers>
          {followupStudents.length === 0 && <Typography>لا توجد متابعات مفتوحة في هذا القسم.</Typography>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {followupStudents.map((s) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, border: '1px solid #eee', borderRadius: 6 }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{s.firstName} {s.lastName}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{s.followupCount} متابعة مفتوحة</div>
                </div>
                <div>
                  <Button variant="contained" size="small" onClick={() => {
                    // open QuickEvaluation for this student
                    setSelectedStudent({ id: s.id, firstName: s.firstName, lastName: s.lastName } as any);
                    setIsAssessmentModalOpen(true);
                    setFollowupDialogOpen(false);
                  }}>فتح التقييم</Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFollowupDialogOpen(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>

      <BackToTopButton />
    </div>
  </div>
  );
}

export default StudentManagement;
