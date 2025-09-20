import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Typography, Button, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import FilterDrawer from '../components/students/FilterDrawer';
import { Student } from '../types/student';
import { useSections } from '../contexts/SectionsContext';
import { useStudents } from '../contexts/StudentsContext';
import AddStudentForm from '../components/students/AddStudentForm';
import EditStudentModal from '../components/students/EditStudentModal';
import StudentCard from '../components/students/StudentCard';
import StudentTable from '../components/students/StudentTable';
import StudentDetailModal from '../components/students/StudentDetailModal';
import BackToTopButton from '../components/BackToTopButton';
import AssessmentModal from '../components/students/AssessmentModal';
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
}

const AbsentStudentsModal: React.FC<AbsentStudentsModalProps> = ({ isOpen, onClose, absentStudents, sectionName }) => {
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
      <DialogTitle>
        قائمة الغائبين ({absentStudents.length}) - {sectionName} - {new Date().toLocaleDateString('ar-EG')}
      </DialogTitle>
      <DialogContent dividers>
        <div id="printable-absent-list">
          <Typography variant="h6" align="center" gutterBottom>
            قائمة الغائبين لقسم {sectionName} - تاريخ: {new Date().toLocaleDateString('ar-EG')}
          </Typography>
          <table style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>رقم الطالب في القسم</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>الاسم الكامل</th>
              </tr>
            </thead>
            <tbody>
              {absentStudents.map((student: Student) => (
                <tr key={student.id}>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{student.classOrder}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{`${student.firstName} ${student.lastName}`}</td>
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
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Attendance State
  const [isAttendanceMode, setIsAttendanceMode] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, boolean>>({});
  const [showAbsentListModal, setShowAbsentListModal] = useState(false);
  const [absentStudents, setAbsentStudents] = useState<Student[]>([]);

  // Local optimistic order: list of student IDs in their temporary order
  const [localOrderIds, setLocalOrderIds] = useState<number[] | null>(null);

  // Absence History Modal State
  const [showAbsenceHistoryModal, setShowAbsenceHistoryModal] = useState(false);

  useEffect(() => {
    if (sections.length > 0 && !currentSection) {
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

      const absent = sectionStudents.filter(s => !attendanceStatus[s.id]);
      setAbsentStudents(absent);
      setShowAbsentListModal(true);
      setIsAttendanceMode(false);

    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('فشل في حفظ بيانات الحضور.');
    }
  };

  return (
  <div dir="rtl" style={{ paddingTop: 0, background: '#f8f9fa' }}>
  {/* Sticky action bar */}
      <div className="flex flex-wrap justify-between items-center mb-2 sticky top-0 z-20 bg-white shadow-sm py-1 px-2" style={{ borderBottom: '1px solid #eee', marginRight: 0 }}>
        <Typography variant="h4" color="blue-gray">إدارة الطلاب</Typography>
        <div className="flex flex-wrap gap-2 overflow-x-auto" style={{ maxWidth: '100%' }}>
          <Button onClick={() => setIsFilterDrawerOpen(true)} variant="outlined" color="primary">الفلاتر</Button>
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
              <Button onClick={handleDeleteAllStudents} color="error" variant="outlined">
                حذف جميع الطلاب
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleSaveAttendance} variant="contained" color="success">
                حفظ الحضور
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

      {/* Statistic Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 mt-2">
                <Card className="bg-blue-50 p-4"><CardContent className="p-0"><div className="flex items-center justify-between mb-2"><Typography variant="h6" color="textPrimary">متوسط الدرجات</Typography><ChartBarIcon className="h-5 w-5 text-blue-600" /></div><Typography variant="h4" color="textPrimary" className="font-bold">{averageScore.toFixed(1)}</Typography><Typography variant="body2" color="textSecondary" className="mt-1">من 20 نقطة</Typography></CardContent></Card>
                <Card className="bg-green-50 p-4"><CardContent className="p-0"><div className="flex items-center justify-between mb-2"><Typography variant="h6" color="textPrimary">المتفوقون</Typography><UserGroupIcon className="h-5 w-5 text-green-600" /></div><Typography variant="h4" color="textPrimary" className="font-bold">{topStudents}</Typography><Typography variant="body2" color="textSecondary" className="mt-1">18+ نقطة</Typography></CardContent></Card>
                <Card className="bg-yellow-50 p-4 border border-yellow-200"><CardContent className="p-0"><div className="flex items-center justify-between mb-2"><Typography variant="h6" color="textPrimary">يحتاج متابعة</Typography><ExclamationCircleIcon className="h-5 w-5 text-yellow-600" /></div><Typography variant="h4" color="textPrimary" className="font-bold">{needsAttention}</Typography><Typography variant="body2" color="textSecondary" className="mt-1">أقل من 10 نقاط</Typography></CardContent></Card>
                <Card className="bg-indigo-50 p-4"><CardContent className="p-0"><div className="flex items-center justify-between mb-2"><Typography variant="h6" color="textPrimary">تقييمات هذا الأسبوع</Typography><CalendarDaysIcon className="h-5 w-5 text-indigo-600" /></div><Typography variant="h4" color="textPrimary" className="font-bold">{weeklyAssessments}</Typography><Typography variant="body2" color="textSecondary" className="mt-1">طالب تم تقييمه</Typography></CardContent></Card>
      </div>

  {/* Sticky section chips bar */}
  <div className="flex gap-2 mb-4 overflow-x-auto pb-2 sticky top-[56px] z-10 bg-white border-b border-gray-100 chips-scrollbar w-full" style={{ minHeight: '48px' }}>
        <Button variant={!currentSection ? "contained" : "outlined"} onClick={() => setCurrentSection(null)} className="flex-shrink-0">
          جميع التلاميذ
        </Button>
        {sections.map((section) => (
          <Button key={section.id} variant={currentSection?.id === section.id ? "contained" : "outlined"} onClick={() => setCurrentSection(section)} className="flex-shrink-0">
            {section.name}
          </Button>
        ))}
      </div>

      <div className="min-h-[500px] w-full overflow-fix">
        {sections.length > 0 ? (
          <Card className="p-4 w-full responsive-container">
            <div className="flex justify-between items-center mb-4">
              <Typography variant="h5" color="blue-gray">
                {currentSection ? `طلاب قسم ${currentSection.name}` : 'جميع التلاميذ'} ({finalFilteredStudents.length} طالب)
              </Typography>
            </div>

            {/* Filter controls moved to FilterDrawer */}

            <div className="flex justify-end gap-2 mb-4">
              <Button variant={viewMode === 'table' ? "contained" : "outlined"} onClick={() => setViewMode('table')} size="small">عرض الجدول</Button>
              <Button variant={viewMode === 'card' ? "contained" : "outlined"} onClick={() => setViewMode('card')} size="small">عرض البطاقات</Button>
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
  <AssessmentModal isOpen={isAssessmentModalOpen} onClose={() => setIsAssessmentModalOpen(false)} studentId={selectedStudent ? String(selectedStudent.id) : undefined} />
      <ExcelUploadModal isOpen={isExcelUploadModalOpen} onClose={() => setIsExcelUploadModalOpen(false)} />
      <AbsentStudentsModal isOpen={showAbsentListModal} onClose={() => setShowAbsentListModal(false)} absentStudents={absentStudents} sectionName={currentSection?.name || ''} />

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
        <DialogTitle>تأكيد الإجراء</DialogTitle>
        <DialogContent dividers><Typography>{confirmModalMessage}</Typography></DialogContent>
        <DialogActions>
          <Button variant="text" color="error" onClick={handleConfirmAction} sx={{ ml: 2 }}>تأكيد</Button>
          <Button variant="text" color="inherit" onClick={handleConfirmModalClose}>إلغاء</Button>
        </DialogActions>
      </Dialog>
      <BackToTopButton />
    </div>
  );
}

export default StudentManagement;
