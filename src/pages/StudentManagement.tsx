import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Typography, Button, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, Box, Chip, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import FilterDrawer from '../components/students/FilterDrawer';
import { useSnackbar } from 'notistack';
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
// حذف الاستيراد الخاص بتقييم البولك
import StudentTableSkeleton from '../components/students/StudentTableSkeleton';
import StudentCardSkeleton from '../components/students/StudentCardSkeleton';
import ExcelUploadModal from '../components/students/ExcelUploadModal';
import AbsenceHistoryContent from '../components/AbsenceHistoryContent_Enhanced';
import useDebounce from '../hooks/useDebounce';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ChartBarIcon, UserGroupIcon, ExclamationCircleIcon, CalendarDaysIcon, PencilSquareIcon } from "@heroicons/react/24/solid";
import AssessmentGridRTL from '../components/assessment/AssessmentGridRTL';

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
        قائمة الغائبين ({absentStudents.length}) - {sectionName} - {new Date().toLocaleDateString('ar-EG')}
      </DialogTitle>
      <DialogContent dividers>
        <div id="printable-absent-list">
          <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
            قائمة الغائبين لقسم {sectionName} - تاريخ: {new Date().toLocaleDateString('ar-EG')}
          </Typography>
          <table style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2', fontWeight: 'bold' }}>رقم الطالب في القسم</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2', fontWeight: 'bold' }}>الاسم الكامل</th>
                {onCancelAbsence && <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2', fontWeight: 'bold' }}>الإجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {absentStudents.map((student: Student) => (
                <tr key={student.id}>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{student.classOrder}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{`${student.firstName} ${student.lastName}`}</td>
                  {onCancelAbsence && (
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => onCancelAbsence(student.id)}
                        sx={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        إلغاء الغياب
                      </Button>
                    </td>
                  )}
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
  const { students, deleteStudent, isLoading, fetchStudents, updateStudentLocal } = useStudents();
  const { recommendedSectionId, displayMessage, isTeachingTime } = useCurrentLesson();
  const { enqueueSnackbar } = useSnackbar();

  // لا نطبق اختيار القسم الذكي تلقائياً - المستخدم يختار بنفسه
  useEffect(() => {
    // تم إزالة الاختيار التلقائي للقسم لتجنب عرض بيانات غير مرغوب فيها
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
  // حذف حالة نافذة البولك
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState<string>('');
  const [confirmModalAction, setConfirmModalAction] = useState<(() => void) | null>(null);

  const [scoreRangeFilter, setScoreRangeFilter] = useState<string>('الكل');
  const [assessmentStatusFilter, setAssessmentStatusFilter] = useState<string>('الكل');
  const [warningStatusFilter, setWarningStatusFilter] = useState<string>('الكل');
  const [followupStatusFilter, setFollowupStatusFilter] = useState<string>('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Attendance State
  const [isAttendanceMode, setIsAttendanceMode] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, boolean>>({});
  // نسبة الحضور والغياب منذ بداية التسجيل
  const [hasAttendanceToday, setHasAttendanceToday] = useState<boolean | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<{ present: number; absent: number; total: number }>({ present: 0, absent: 0, total: 0 });
  const [showAbsentListModal, setShowAbsentListModal] = useState(false);
  const [absentStudents, setAbsentStudents] = useState<Student[]>([]);

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
        const resp = await fetch('http://localhost:4200/api/admin-schedule');
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
    // Only auto-select first section if we have sections and no explicit section choice was made
    if (sections.length > 0 && !currentSection && !localStorage.getItem('explicit_section_choice')) {
      setCurrentSection(sections[0]);
    }
  }, [sections, setCurrentSection]);

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

  const { averageScore, topStudents, needsAttention, weeklyAssessments, topThree } = useMemo(() => {
    if (!currentSection || sectionStudents.length === 0) {
      return { averageScore: 0, topStudents: 0, needsAttention: 0, weeklyAssessments: 0, topThree: [] as Student[] };
    }

    const totalScore = sectionStudents.reduce((sum, student) => sum + (student.score || 0), 0);
    const averageScore = totalScore / sectionStudents.length;
    const topStudents = sectionStudents.filter(student => (student.score || 0) >= 18).length;
    const needsAttention = sectionStudents.filter(student => (student.score || 0) < 10).length;
    // weeklyAssessments: count students whose lastAssessmentDate is within the last 7 days
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const weeklyAssessments = sectionStudents.filter(student => {
      const last = (student as any).lastAssessmentDate || (student as any).lastAssessment || null;
      if (!last) return false;
      const t = new Date(last).getTime();
      return !Number.isNaN(t) && (now - t) <= weekMs;
    }).length;

    // topThree leaderboard (by score desc, tie-breaker total_xp desc)
    const topThree = sectionStudents
      .slice()
      .sort((a, b) => {
        const sa = (a.score || 0);
        const sb = (b.score || 0);
        if (sb !== sa) return sb - sa;
        const xa = Number((a as any).total_xp || 0);
        const xb = Number((b as any).total_xp || 0);
        return xb - xa;
      })
      .slice(0, 3);

    return { averageScore, topStudents, needsAttention, weeklyAssessments, topThree };
  }, [sectionStudents, currentSection]);
  // (checkTodaysAttendance will be defined later near attendance handlers)
  
  // Follow-up count for current section (simple quick count)
  const [sectionFollowupCount, setSectionFollowupCount] = useState<number>(0);
  const [followupDialogOpen, setFollowupDialogOpen] = useState(false);
  const [followupStudents, setFollowupStudents] = useState<Array<{id:number, firstName:string, lastName:string, followupCount:number}>>([]);
  const [quickFilter, setQuickFilter] = useState<{ type: string; label: string } | null>(null);
  const [suggestedDialogOpen, setSuggestedDialogOpen] = useState(false);
  const [suggestedStudents, setSuggestedStudents] = useState<Student[]>([]);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardStudents, setLeaderboardStudents] = useState<Student[]>([]);
  useEffect(() => {
    const load = async () => {
      if (!currentSection) { setSectionFollowupCount(0); return; }
      try {
        const resp = await fetch(`http://localhost:4200/api/sections/${currentSection.id}/followups-count`);
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

  const openFollowupDialog = async () => {
    if (!currentSection) return;
    try {
      const resp = await fetch(`http://localhost:4200/api/sections/${currentSection.id}/followups-students`);
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

      const response = await fetch(`http://localhost:4200/api/students/reorder`, {
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

  // Quick-select student from the widget: open QuickEvaluation modal and set selectedStudent
  // quick-select widget removed / handled inside QuickEvaluation modal now

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
    if (scoreRangeFilter !== 'الكل' && scoreRangeFilter !== 'all') {
      studentsToFilter = studentsToFilter.filter(student => {
        const score = student.score;
        if (score === undefined || score === null) return false;
        if (scoreRangeFilter === 'excellent') return score >= 18;
        if (scoreRangeFilter === 'good') return score >= 14 && score < 18;
        if (scoreRangeFilter === 'average') return score >= 10 && score < 14;
        if (scoreRangeFilter === 'poor') return score < 10;
        // Legacy support
        if (scoreRangeFilter === '0-4') return score >= 0 && score < 4;
        if (scoreRangeFilter === '4-6') return score >= 4 && score < 6;
        if (scoreRangeFilter === '6-8') return score >= 6 && score < 8;
        if (scoreRangeFilter === '8-10') return score >= 8 && score <= 10;
        return true;
      });
    }
    if (assessmentStatusFilter !== 'الكل') {
      studentsToFilter = studentsToFilter.filter(student => {
        const hasAssessment = Boolean(student.score !== undefined && student.score !== null);
        if (assessmentStatusFilter === 'مقيم') return hasAssessment;
        if (assessmentStatusFilter === 'غير مقيم') return !hasAssessment;
        return true;
      });
    }
    if (warningStatusFilter !== 'الكل') {
      studentsToFilter = studentsToFilter.filter(student => {
        const hasWarnings = Boolean(student.score !== undefined && student.score !== null && student.score < 10);
        if (warningStatusFilter === 'محذر') return hasWarnings;
        if (warningStatusFilter === 'غير محذر') return !hasWarnings;
        return true;
      });
    }
    
    // فلتر المتابعة
    if (followupStatusFilter && followupStatusFilter !== 'الكل') {
      studentsToFilter = studentsToFilter.filter(student => {
        const isInFollowup = followupStudents.some(fs => fs.id === student.id);
        if (followupStatusFilter === 'متابع') return isInFollowup;
        if (followupStatusFilter === 'غير متابع') return !isInFollowup;
        return true;
      });
    }
    // Apply quick card filter if set (transient, doesn't open drawer)
    if (quickFilter) {
      if (quickFilter.type === 'followups') {
        studentsToFilter = studentsToFilter.filter(student => followupStudents.some(fs => fs.id === student.id));
      } else if (quickFilter.type === 'top') {
        studentsToFilter = studentsToFilter.filter(student => (student.score || 0) >= 18);
      } else if (quickFilter.type === 'atrisk') {
        studentsToFilter = studentsToFilter.filter(student => (student.score || 0) < 10);
      } else if (quickFilter.type === 'weekly') {
        // students with lastAssessmentDate within last 7 days
        const now = Date.now();
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        studentsToFilter = studentsToFilter.filter(student => {
          const last = (student as any).lastAssessmentDate || (student as any).lastAssessment || null;
          const d = last ? new Date(last).getTime() : null;
          return d && (now - d) <= weekMs;
        });
      }
    }
    
    return studentsToFilter;
  }, [sectionStudents, debouncedSearchTerm, scoreRangeFilter, assessmentStatusFilter, warningStatusFilter, followupStatusFilter, followupStudents]);

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

  // (attendance indicator removed) no per-section attendance check displayed here

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setScoreRangeFilter('الكل');
    setAssessmentStatusFilter('الكل');
    setWarningStatusFilter('الكل');
    setFollowupStatusFilter('');
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
          const response = await fetch(`http://localhost:4200/api/sections/${currentSection.id}/students`, { method: 'DELETE' });
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

  // Check if attendance has been recorded for the current section today
  // دالة لجلب كل سجلات الحضور للقسم وحساب النسب
  const checkAttendanceStats = useCallback(async () => {
    if (!currentSection) {
      setHasAttendanceToday(null);
      setAttendanceStats({ present: 0, absent: 0, total: 0 });
      return;
    }
    try {
      const resp = await fetch(`http://localhost:4200/api/attendance?sectionId=${encodeURIComponent(String(currentSection.id))}`);
      if (!resp.ok) {
        setHasAttendanceToday(null);
        setAttendanceStats({ present: 0, absent: 0, total: 0 });
        return;
      }
      const data = await resp.json();
      const records = Array.isArray(data) ? data : (data.value || data.records || []);
      // احسب فقط سجلات القسم الحالي
      const sectionRecords = records.filter(r => String(r.sectionId) === String(currentSection.id));
      let present = 0, absent = 0;
      for (const rec of sectionRecords) {
        if (rec.isPresent) present++;
        else absent++;
      }
      setAttendanceStats({ present, absent, total: sectionRecords.length });
      // نسبة اليوم فقط (للتوافق مع الكود القديم)
      const today = new Date().toISOString().split('T')[0];
      const todayRecords = records.filter(r => r.date === today);
      setHasAttendanceToday(todayRecords.length > 0);
    } catch (e) {
      console.warn('Failed to check attendance stats', e);
      setHasAttendanceToday(null);
      setAttendanceStats({ present: 0, absent: 0, total: 0 });
    }
  }, [currentSection]);

  useEffect(() => {
    checkAttendanceStats();
  }, [checkAttendanceStats]);

  const handleSaveAttendance = async () => {
    if (!currentSection) return;

    const attendanceData = Object.entries(attendanceStatus).map(([studentId, isPresent]) => ({
      studentId,
      isPresent,
      sectionId: currentSection.id,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    }));

    try {
      const response = await fetch(`http://localhost:4200/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance: attendanceData }),
      });

      if (!response.ok) {
        throw new Error('Failed to save attendance');
      }

      // Update local student data
      fetchStudents(); // Refresh after attendance update

      const absent = sectionStudents.filter(s => !attendanceStatus[s.id]);
      setAbsentStudents(absent);
      setShowAbsentListModal(true);
      setIsAttendanceMode(false);
  // تحديث حالة تسجيل الغياب للعرض
  // use existing checkAttendanceStats() helper to refresh today's attendance summary
  try { await checkAttendanceStats(); } catch (e) { /* ignore */ }

    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('فشل في حفظ بيانات الحضور.');
    }
  };

  // دالة إلغاء الغياب لطالب معين
  const handleCancelAbsence = async (studentId: number) => {
    // No browser confirmation required; perform delete and show a toast notification
    try {
      const today = new Date().toISOString().split('T')[0];

      // Use query params for DELETE to avoid some clients/proxies stripping DELETE bodies
      const params = new URLSearchParams();
      params.set('student_id', String(studentId));
      params.set('date', today);
      if (currentSection?.id) params.set('sectionId', String(currentSection.id));

      const deleteUrl = `http://localhost:4200/api/attendance?${params.toString()}`;
      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE'
      });

      if (!deleteResponse.ok) {
        const bodyText = await deleteResponse.text().catch(() => '');
        throw new Error(`Failed to delete absence record: ${deleteResponse.status} ${bodyText}`);
      }

      // تسجيل الطالب كحاضر
      const attendanceData = [{
        studentId: studentId,
        isPresent: true,
        sectionId: currentSection?.id,
        date: today,
      }];

      const saveResponse = await fetch(`http://localhost:4200/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance: attendanceData }),
      });

      if (!saveResponse.ok) {
        const bodyText = await saveResponse.text().catch(() => '');
        throw new Error(`Failed to save new attendance record: ${saveResponse.status} ${bodyText}`);
      }

      // تحديث القائمة المحلية
      const updatedAbsentStudents = absentStudents.filter(s => s.id !== studentId);
      setAbsentStudents(updatedAbsentStudents);

      // إذا لم يعد هناك غائبين، أغلق النافذة
      if (updatedAbsentStudents.length === 0) {
        setShowAbsentListModal(false);
      }

      // Show a small toast instead of browser confirm/alert
      enqueueSnackbar('تم إلغاء الغياب وتسجيل الطالب كحاضر بنجاح.', { variant: 'success' });

      // تحديث بيانات الطلاب
      fetchStudents();
  // تحديث مؤشر حالة الغياب بعد التغيير
  try { await checkAttendanceStats(); } catch (e) { /* ignore */ }

    } catch (error) {
      console.error('Error canceling absence:', error);
      enqueueSnackbar('فشل في إلغاء الغياب. تحقق من الاتصال وحاول مجدداً.', { variant: 'error' });
    }
  };

  return (
  <div dir="rtl" style={{ paddingTop: 0, paddingRight: '1rem', background: '#f8f9fa' }}>
  {/* Sticky action bar */}
      <div className="flex flex-wrap justify-between items-center mb-2 sticky top-0 z-20 bg-white shadow-sm py-1 px-2" style={{ borderBottom: '1px solid #eee' }}>
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
              {/* زر تقييم البولك تم حذفه */}
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
        <FilterDrawer
          open={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          scoreRangeFilter={scoreRangeFilter}
          setScoreRangeFilter={setScoreRangeFilter}
          assessmentStatusFilter={assessmentStatusFilter}
          setAssessmentStatusFilter={setAssessmentStatusFilter}
          warningStatusFilter={warningStatusFilter}
          setWarningStatusFilter={setWarningStatusFilter}
          onClear={handleClearFilters}
        />
      </div>
      {/* Quick filter chip (shows when a stat card was clicked) */}
      {quickFilter && (
        <div style={{ padding: '0 16px 8px 16px' }}>
          <Chip label={`فلتر نشط: ${quickFilter.label}`} onDelete={() => { setQuickFilter(null); handleClearFilters(); }} color="primary" />
        </div>
      )}
          {/* spacer for layout (the quick-select widget is shown inside the evaluation modal now) */}
          <div className="mb-4" />

      {/* Statistic Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 mt-2">
                <Card onClick={openFollowupDialog} className="bg-blue-50 p-4 cursor-pointer hover:shadow-lg"><CardContent className="p-0"><div className="flex items-center justify-between mb-2"><Typography variant="h6" color="textPrimary">متابعات مفتوحة</Typography><ChartBarIcon className="h-5 w-5 text-blue-600" /></div><Typography variant="h4" color="textPrimary" className="font-bold" sx={{ fontWeight: 'bold' }}>{sectionFollowupCount}</Typography><Typography variant="body2" color="textSecondary" className="mt-1">عدد المتابعات المفتوحة · متوسط القسم: {Number(averageScore).toFixed(1)}</Typography></CardContent></Card>
                {/* بطاقة نظرة عامة عن القسم */}
                <Card className="bg-green-50 p-4 cursor-pointer hover:shadow-lg">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between mb-2">
                      <Typography variant="h6" color="textPrimary">نظرة عامة على القسم</Typography>
                      <UserGroupIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 'bold', mb: 1 }}>
                      المعدل العام: {Number(averageScore).toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      نسبة الحضور: {attendanceStats.total > 0 ? Math.round((attendanceStats.present/attendanceStats.total)*100) : 0}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      نسبة الغياب: {attendanceStats.total > 0 ? Math.round((attendanceStats.absent/attendanceStats.total)*100) : 0}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      نسبة المتابعات: {sectionFollowupCount}/{sectionStudents.length} ({sectionStudents.length > 0 ? Math.round((sectionFollowupCount/sectionStudents.length)*100) : 0}%)
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      التطور عن الأسبوع الماضي: {/* يمكن حسابه بدقة لاحقًا */} قيد التطوير
                    </Typography>
                  </CardContent>
                </Card>
                <Card onClick={() => {
                  // prepare full leaderboard and open dialog
                  const list = sectionStudents.slice().sort((a,b) => {
                    const sa = (a.score || 0);
                    const sb = (b.score || 0);
                    if (sb !== sa) return sb - sa;
                    const xa = Number((a as any).total_xp || 0);
                    const xb = Number((b as any).total_xp || 0);
                    return xb - xa;
                  });
                  setLeaderboardStudents(list);
                  setLeaderboardOpen(true);
                }} className="bg-yellow-50 p-4 border border-yellow-200 cursor-pointer"><CardContent className="p-0">
                  <div className="flex items-center justify-between mb-2">
                    <Typography variant="h6" color="textPrimary">قائمة المتصدرين</Typography>
                    <UserGroupIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {topThree.length === 0 ? (
                      <Typography variant="body2" color="textSecondary">لا توجد بيانات كافية</Typography>
                    ) : (
                      topThree.map((s, idx) => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: idx === 0 ? '#ffd54f' : (idx === 1 ? '#e0e0e0' : '#d7ccc8'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{idx + 1}</div>
                            <div style={{ fontWeight: 'bold' }}>{s.firstName} {s.lastName}</div>
                          </div>
                          <div style={{ fontWeight: 'bold' }}>{Math.round(Number((s as any).total_xp || 0))} XP</div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent></Card>
                <Card onClick={async () => {
                  try {
                    // compute suggestions: prefer never-assessed, then oldest-assessed
                    const now = Date.now();
                    const weekMs = 7 * 24 * 60 * 60 * 1000;
                    const candidates = sectionStudents.slice();
                    // students never assessed first
                    const neverAssessed = candidates.filter(s => !( (s as any).lastAssessmentDate || (s as any).lastAssessment ));
                    const assessedOld = candidates.filter(s => ( (s as any).lastAssessmentDate || (s as any).lastAssessment ));
                    assessedOld.sort((a,b) => {
                      const ta = new Date(((a as any).lastAssessmentDate || (a as any).lastAssessment)).getTime() || 0;
                      const tb = new Date(((b as any).lastAssessmentDate || (b as any).lastAssessment)).getTime() || 0;
                      return ta - tb; // oldest first
                    });
                    const list = [...neverAssessed, ...assessedOld].slice(0,5);
                    setSuggestedStudents(list);
                    setSuggestedDialogOpen(true);
                  } catch(e) {
                    console.warn('Failed to compute suggested students', e);
                  }
                }} className="bg-indigo-50 p-4 cursor-pointer"><CardContent className="p-0"><div className="flex items-center justify-between mb-2"><Typography variant="h6" color="textPrimary">تقييمات هذا الأسبوع</Typography><CalendarDaysIcon className="h-5 w-5 text-indigo-600" /></div><Typography variant="h4" color="textPrimary" className="font-bold" sx={{ fontWeight: 'bold' }}>{weeklyAssessments}</Typography><Typography variant="body2" color="textSecondary" className="mt-1">عدد الطلاب المُقيَّمين هذا الأسبوع</Typography></CardContent></Card>
      </div>

  {/* Sticky section chips bar */}
  <div className="flex gap-2 mb-4 overflow-x-auto pb-2 sticky top-[56px] z-10 bg-white border-b border-gray-100 chips-scrollbar w-full" style={{ minHeight: '48px' }}>
        <Button variant={!currentSection ? "contained" : "outlined"} onClick={() => {
          setCurrentSection(null);
          localStorage.setItem('explicit_section_choice', 'all_students');
        }} className="flex-shrink-0" sx={{ fontWeight: 'bold' }}>
          جميع التلاميذ
        </Button>
        {sections.map((section) => (
          <Button key={section.id} variant={currentSection?.id === section.id ? "contained" : "outlined"} onClick={() => {
            setCurrentSection(section);
            localStorage.setItem('explicit_section_choice', section.id.toString());
          }} className="flex-shrink-0" sx={{ fontWeight: 'bold' }}>
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
                
                {/* حالة تسجيل الغياب: مؤشر بسيط تحت عنوان القسم */}
                {currentSection && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                    حالة الغياب اليوم: <span style={{ fontWeight: 'bold', color: hasAttendanceToday === null ? '#9e9e9e' : (hasAttendanceToday ? '#4caf50' : '#ff9800') }}>
                      {hasAttendanceToday === null ? 'جاري التحقق...' : (hasAttendanceToday ? 'مسجل' : 'غير مسجل')}
                    </span>
                  </Typography>
                )}
                
                {/* مؤشر الحصة الذكي - يظهر فقط عند وجود حصة حالية */}
                {recommendedSectionId && currentSection?.id === recommendedSectionId && isTeachingTime && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Chip 
                      label={displayMessage}
                      size="small"
                      sx={{
                        bgcolor: 'success.light',
                        color: 'success.dark',
                        fontWeight: 'bold',
                        '& .MuiChip-label': {
                          fontSize: '0.75rem'
                        }
                      }}
                    />
                  </Box>
                )}
              </div>
            </div>

            {/* Quick Filters - نقل الفلاتر هنا لسهولة الوصول */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* البحث السريع */}
                <TextField
                  label="البحث عن طالب"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: 300 }}
                  placeholder="الاسم أو رقم المسار..."
                />
                
                {/* فلتر حسب التقييم */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>التقييم</InputLabel>
                  <Select
                    value={assessmentStatusFilter}
                    onChange={(e) => setAssessmentStatusFilter(e.target.value as string)}
                    label="التقييم"
                  >
                    <MenuItem value="الكل">الكل</MenuItem>
                    <MenuItem value="مقيم">مُقيم</MenuItem>
                    <MenuItem value="غير مقيم">غير مُقيم</MenuItem>
                  </Select>
                </FormControl>
                
                {/* فلتر حسب التحذير */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>التحذير</InputLabel>
                  <Select
                    value={warningStatusFilter}
                    onChange={(e) => setWarningStatusFilter(e.target.value as string)}
                    label="التحذير"
                  >
                    <MenuItem value="الكل">الكل</MenuItem>
                    <MenuItem value="محذر">محذر</MenuItem>
                    <MenuItem value="غير محذر">غير محذر</MenuItem>
                  </Select>
                </FormControl>
                
                {/* فلتر حسب المتابعة */}
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>المتابعة</InputLabel>
                  <Select
                    value={followupStatusFilter || 'الكل'}
                    onChange={(e) => setFollowupStatusFilter(e.target.value === 'الكل' ? '' : e.target.value)}
                    label="المتابعة"
                  >
                    <MenuItem value="الكل">الكل</MenuItem>
                    <MenuItem value="متابع">متابع</MenuItem>
                    <MenuItem value="غير متابع">غير متابع</MenuItem>
                  </Select>
                </FormControl>
                
                {/* فلتر النطاق النقطي */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>النطاق النقطي</InputLabel>
                  <Select
                    value={scoreRangeFilter}
                    onChange={(e) => setScoreRangeFilter(e.target.value as string)}
                    label="النطاق النقطي"
                  >
                    <MenuItem value="all">الكل</MenuItem>
                    <MenuItem value="excellent">ممتاز (18+)</MenuItem>
                    <MenuItem value="good">جيد (14-17)</MenuItem>
                    <MenuItem value="average">متوسط (10-13)</MenuItem>
                    <MenuItem value="poor">ضعيف (أقل من 10)</MenuItem>
                  </Select>
                </FormControl>
                
                {/* مسح الفلاتر */}
                <Button 
                  onClick={handleClearFilters}
                  variant="outlined" 
                  size="small"
                  sx={{ minWidth: 80 }}
                >
                  مسح
                </Button>
              </Box>
            </Box>

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
  <Dialog open={isAssessmentModalOpen} onClose={() => setIsAssessmentModalOpen(false)} maxWidth="md" fullWidth>
    <QuickEvaluation
      studentId={selectedStudent ? Number(selectedStudent.id) : 0}
      studentName={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : ''}
      onClose={() => setIsAssessmentModalOpen(false)}
      sectionStudents={sectionStudents.map(s => ({ id: Number(s.id), name: `${s.firstName} ${s.lastName}` }))}
      onSwitchStudent={(id: number) => {
        // switch the modal to another student id without closing it
        const found = students.find(s => Number(s.id) === Number(id)) || null;
        setSelectedStudent(found as any);
      }}
      onSave={async (updatedEvaluation) => {
        console.log('QuickEvaluation.onSave called for student', selectedStudent?.id, { updatedEvaluation });
        try {
          // Optimistically update the local student cache so the table and leaderboard
          // immediately reflect the XP/score shown in the QuickEvaluation modal.
          if (selectedStudent && typeof updateStudentLocal === 'function') {
            const patch: any = {};
            if (updatedEvaluation && typeof updatedEvaluation.total_xp === 'number') patch.total_xp = updatedEvaluation.total_xp;
            if (updatedEvaluation && typeof updatedEvaluation.new_score === 'number') patch.score = updatedEvaluation.new_score;
            // also accept server shapes where numbers might be named differently
            if (updatedEvaluation && typeof updatedEvaluation.score === 'number' && patch.score == null) patch.score = updatedEvaluation.score;
            if (Object.keys(patch).length > 0) {
              try { updateStudentLocal(Number(selectedStudent.id), patch); } catch (e) { console.warn('updateStudentLocal failed', e); }
            }
          }

          // Refetch from server to fully synchronize other fields (assessments history, lastAssessmentDate, etc.)
          await fetchStudents();
        } catch (e) {
          console.warn('Failed to refresh students after saving evaluation', e);
        }
      }}
    />
  </Dialog>
  {/* Bulk evaluation dialog */}
  {/* نافذة تقييم البولك تم حذفها */}
      <ExcelUploadModal isOpen={isExcelUploadModalOpen} onClose={() => setIsExcelUploadModalOpen(false)} />
      <AbsentStudentsModal 
        isOpen={showAbsentListModal} 
        onClose={() => setShowAbsentListModal(false)} 
        absentStudents={absentStudents} 
        sectionName={currentSection?.name || ''} 
        onCancelAbsence={handleCancelAbsence}
      />

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

      {/* Suggested assessments dialog (up to 5 students) */}
      <Dialog open={suggestedDialogOpen} onClose={() => setSuggestedDialogOpen(false)} maxWidth="sm" fullWidth dir="rtl">
        <DialogTitle>اقتراحات للتقييم (حتى 5)</DialogTitle>
        <DialogContent dividers>
          {suggestedStudents.length === 0 && <Typography>لا يوجد اقتراحات حالياً.</Typography>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {suggestedStudents.map((s) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, border: '1px solid #eee', borderRadius: 6 }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{s.firstName} {s.lastName}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>رقم: {s.classOrder} · القسم: {currentSection?.name || ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="outlined" size="small" onClick={() => {
                    // open QuickEvaluation for this student
                    setSelectedStudent(s as any);
                    setIsAssessmentModalOpen(true);
                    setSuggestedDialogOpen(false);
                  }}>فتح التقييم</Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuggestedDialogOpen(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>

      {/* Full leaderboard dialog */}
      <Dialog open={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} maxWidth="md" fullWidth dir="rtl">
        <DialogTitle>ترتيب التلاميذ (المتقدمين أولاً)</DialogTitle>
        <DialogContent dividers>
          {leaderboardStudents.length === 0 && <Typography>لا توجد بيانات.</Typography>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {leaderboardStudents.map((s, idx) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, border: '1px solid #eee', borderRadius: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</div>
                  <div style={{ fontWeight: 'bold' }}>{s.firstName} {s.lastName}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ color: '#666' }}>{(s.score || 0).toFixed ? (s.score || 0).toFixed(1) : s.score}</div>
                  <div style={{ fontWeight: 'bold' }}>{Math.round(Number((s as any).total_xp || 0))} XP</div>
                  <Button size="small" variant="outlined" onClick={() => { setSelectedStudent(s as any); setIsAssessmentModalOpen(true); setLeaderboardOpen(false); }}>فتح التقييم</Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaderboardOpen(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>

      {/* Assessment Grid Section */}
      {currentSection && (
        <Box sx={{ mt: 5 }}>
          <AssessmentGridRTL sectionId={currentSection.id} />
        </Box>
      )}

      <BackToTopButton />
    </div>
  );
}

export default StudentManagement;
