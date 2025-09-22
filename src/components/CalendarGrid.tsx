import { Box, Paper, Typography, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isWithinInterval, getDay, isSameWeek } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useSnackbar } from 'notistack'; // Import useSnackbar
// Scheduled lessons mutations are performed via the API service directly
import { addScheduledLesson as addScheduledLessonAPI, updateScheduledLesson as updateScheduledLessonAPI, deleteScheduledLesson as deleteScheduledLessonAPI } from '../services/api/scheduledLessonService';
import { fetchAdminSchedule, AdminScheduleEntry } from '../services/api/adminScheduleService';
import { useSections } from '../contexts/SectionsContext';
import { AdaptedLesson, ScheduledLesson } from '../types/lessonLogTypes';
import { migrateLessonToAdapted } from '../utils/lessonLogMigrationUtils';
import EditLessonModal from './EditLessonModal';
import React, { useState, useMemo, useEffect } from 'react';

import dayjs from 'dayjs'; // Import dayjs

// Define LessonStage interface (copied from curriculumService.ts for local use)
interface LessonStage {
  id: string;
  title: string;
  isCompleted: boolean;
  completionDate?: string;
}

// Helper function to calculate lesson status
const calculateLessonStatus = (stages: LessonStage[] | undefined): 'not-planned' | 'planned' | 'in-progress' | 'completed' => {
  if (!stages || stages.length === 0 || stages.every(stage => !stage.title.trim())) {
    return 'not-planned';
  }

  const completedStages = stages.filter(stage => stage.isCompleted).length;

  if (completedStages === 0) {
    return 'planned';
  } else if (completedStages === stages.length) {
    return 'completed';
  } else {
    return 'in-progress';
  }
};
const LessonCard = ({ lesson, onDoubleClick, onDelete, allScheduledLessons }: { lesson: AdaptedLesson, onDoubleClick: (lesson: AdaptedLesson) => void, onDelete: (lessonId: string) => void, allScheduledLessons: AdaptedLesson[] }) => {
  const displayStatus = useMemo(() => calculateLessonStatus(lesson.stages), [lesson.stages]);

  const statusColorMap: { [key: string]: string } = {
    'not-planned': '#E0E0E0', // Gray for not planned
    planned: '#90CAF9',
    'in-progress': '#FFD54F',
    completed: '#A5D6A7',
    cancelled: '#EF9A9A',
  };

  const borderColor = statusColorMap[displayStatus] || '#E0E0E0';

  const sessionNumber = useMemo(() => {
    if (typeof lesson.manualSessionNumber === 'number') {
      return lesson.manualSessionNumber;
    }

    if (!lesson.lessonGroupId) {
      return null;
    }

    const lessonsInGroup = allScheduledLessons
      .filter(sl => sl.lessonGroupId === lesson.lessonGroupId && dayjs(sl.date).isValid())
      .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

    const currentIndex = lessonsInGroup.findIndex(sl => String(sl.id) === String(lesson.id));

    if (lessonsInGroup.length > 1 && currentIndex !== -1) {
      return currentIndex + 1;
    }
    return null;
  }, [lesson, allScheduledLessons]);

  const statusTextMap: { [key: string]: string } = {
    'not-planned': 'غير مخطط',
    planned: 'مخطط',
    'in-progress': 'جاري التنفيذ',
    completed: 'مكتمل',
  };

  return (
    <Paper
      onDoubleClick={() => onDoubleClick(lesson)}
      draggable="true"
      onDragStart={(e) => {
        console.log('Drag started for lesson:', lesson.id); // Debug log
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'lesson', lessonId: lesson.id }));
      }}
      sx={{
        p: 1,
        mb: 1.5,
        borderRadius: '8px',
        borderLeft: `4px solid ${borderColor}`,
        border: '1px solid',
        borderColor: 'grey.300',
        cursor: 'pointer',
        boxShadow: 3,
        '&:hover': { boxShadow: 6 },
        transition: 'box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
          {lesson.lessonTitle}
        </Typography>
        {sessionNumber !== null && (
          <Typography
            variant="caption"
            sx={{
              ml: 1, // margin left
              bgcolor: 'primary.main',
              color: 'white',
              px: 0.8,
              py: 0.2,
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '0.7rem',
              whiteSpace: 'nowrap',
            }}
          >
            حصة {sessionNumber}
          </Typography>
        )}
        <IconButton onClick={() => onDelete(lesson.id)} size="small" color="error" sx={{ p: 0 }}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
        {lesson.subject} - {lesson.estimatedSessions} sessions
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
        <Typography variant="caption" sx={{
          bgcolor: statusColorMap[displayStatus],
          color: 'white',
          px: 0.8,
          py: 0.2,
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '0.7rem',
          whiteSpace: 'nowrap',
        }}>
          {statusTextMap[displayStatus]}
        </Typography>
        <Box sx={{ width: '60%', bgcolor: 'grey.300', borderRadius: '9999px', height: '6px' }}>
          <Box sx={{
            bgcolor: 'primary.main',
            height: '100%',
            borderRadius: 'inherit',
            width: `${lesson.progress}%`,
            transition: 'width 0.5s ease-in-out',
          }} />
        </Box>
      </Box>
    </Paper>
  );
};

interface CalendarGridProps {
  currentWeekStart: Date;
  scheduledLessons: ScheduledLesson[];
  onRefresh?: () => void | Promise<void>; // notify parent to reload after mutations
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ currentWeekStart, scheduledLessons, onRefresh }) => {
  const { sections, isLoading } = useSections();
  const { enqueueSnackbar } = useSnackbar(); // Use useSnackbar hook
  const [editingLesson, setEditingLesson] = useState<AdaptedLesson | null>(null);
  // const [isDropping, setIsDropping] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null); // For drag-over visual feedback
  const [adminSchedule, setAdminSchedule] = useState<AdminScheduleEntry[]>([]);

  // تحميل الجدول الزمني
  useEffect(() => {
    const loadAdminSchedule = async () => {
      try {
        const schedule = await fetchAdminSchedule();
        setAdminSchedule(schedule);
      } catch (error) {
        console.error('Error loading admin schedule:', error);
      }
    };
    loadAdminSchedule();
  }, []);

  // ألوان مختلفة للأقسام
  const sectionColors = useMemo(() => {
    const colors = [
      '#3b82f6', // أزرق
      '#10b981', // أخضر
      '#f59e0b', // أصفر
      '#ef4444', // أحمر
      '#8b5cf6', // بنفسجي
      '#06b6d4', // سماوي
      '#f97316', // برتقالي
      '#84cc16', // أخضر فاتح
    ];
    
    const colorMap: { [sectionId: string]: string } = {};
    sections.forEach((section, index) => {
      colorMap[section.id] = colors[index % colors.length];
    });
    return colorMap;
  }, [sections]);

  const handleDeleteLesson = async (lessonId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
      try {
        await deleteScheduledLessonAPI(lessonId);
        enqueueSnackbar('تم حذف الحصة بنجاح.', { variant: 'success' });
        await onRefresh?.();
      } catch (error) {
        console.error('Failed to delete lesson:', error);
        alert('فشل في حذف الدرس');
      }
    }
  };

  const weekDays = useMemo(() => {
    return eachDayOfInterval({
      start: currentWeekStart,
      end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    }).filter(day => getDay(day) !== 0); // Exclude Sunday
  }, [currentWeekStart]);

  const handleDrop = async (e: React.DragEvent, date: string, sectionId: string) => {
    setDragOverCell(null); // Reset visual feedback on drop
    const payload = e.dataTransfer.getData('application/json');
    if (!payload) return;
    const dragData = JSON.parse(payload);

    if (dragData.type === 'template') {
      const template = dragData.template;
      if (!template) return;
      
      // نسخ المراحل الرئيسية من القالب وتحويلها لمراحل الحصة
      const stagesFromTemplate = (template.stages || []).map((stage: any) => ({
        ...stage,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, // معرف جديد للحصة
        isCore: true, // تعليم أنها مرحلة رئيسية
        templateStageId: stage.id, // ربط بالمرحلة في القالب
        isCompleted: false // إعادة تعيين حالة الاكتمال
      }));

      // توليد معرف مجموعة للدرس (lessonGroupId)
      const lessonGroupId = `lesson-${template.id}-${Date.now()}`;

      const newLesson: Omit<ScheduledLesson, 'id' | 'LessonTemplate'> = {
        templateId: template.id,
        lessonGroupId: lessonGroupId,
        date: date,
        startTime: '08:00',
        assignedSections: [sectionId],
        completionStatus: { [sectionId]: 'planned' },
        customTitle: template.title,
        customDescription: template.description,
        stages: stagesFromTemplate,
        estimatedSessions: template.estimatedSessions || 1,
        progress: 0,
        subject: template.courseName,
      };
      try {
        await addScheduledLessonAPI(newLesson);
        enqueueSnackbar('تمت إضافة الحصة من القالب.', { variant: 'success' });
        await onRefresh?.();
      } catch (err) {
        console.error('Failed to add scheduled lesson from template:', err);
        enqueueSnackbar('فشل في إضافة الحصة من القالب.', { variant: 'error' });
      }
    } else if (dragData.type === 'lesson') {
      const lessonIdToFind = String(dragData.lessonId);
      const originalLesson = scheduledLessons.find(sl => String(sl.id) === lessonIdToFind);

      if (originalLesson) {
        const sameWeek = isSameWeek(new Date(date), new Date(originalLesson.date), { weekStartsOn: 1 });
        if (sameWeek) {
          // Clone into a new scheduled lesson within same week
          const groupId = originalLesson.lessonGroupId || originalLesson.templateId || String(originalLesson.id);
          const targetDate = new Date(date);
          const lessonsInSameGroupSameWeek = (scheduledLessons || [])
            .filter(sl => (sl.lessonGroupId || sl.templateId || String(sl.id)) === groupId)
            .filter(sl => isSameWeek(new Date(sl.date), targetDate, { weekStartsOn: 1 }));

          const existingNumbers = lessonsInSameGroupSameWeek
            .map(sl => (typeof sl.manualSessionNumber === 'number' ? sl.manualSessionNumber : undefined))
            .filter((n): n is number => typeof n === 'number');
          const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 2;

          // نسخ جميع المراحل (الرئيسية والإضافية) مع إعادة تعيين حالة الاكتمال للمراحل الرئيسية
          const clonedStages = originalLesson.stages.map(stage => ({
            ...stage,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, // معرف جديد
            isCompleted: stage.isCore ? false : stage.isCompleted, // إعادة تعيين المراحل الرئيسية فقط
            completionDate: stage.isCore ? undefined : stage.completionDate
          }));

          const clone: Omit<ScheduledLesson, 'id' | 'LessonTemplate'> = {
            templateId: originalLesson.templateId,
            lessonGroupId: originalLesson.lessonGroupId || groupId, // الحفاظ على معرف المجموعة
            date,
            startTime: originalLesson.startTime || '08:00',
            assignedSections: [sectionId],
            completionStatus: { [sectionId]: originalLesson.completionStatus?.[sectionId] || 'planned' },
            customTitle: originalLesson.customTitle,
            customDescription: originalLesson.customDescription,
            stages: clonedStages, // استخدام المراحل المنسوخة
            estimatedSessions: originalLesson.estimatedSessions,
            manualSessionNumber: nextNumber,
            notes: originalLesson.notes,
            subject: originalLesson.subject,
            progress: 0, // إعادة تعيين التقدم
          };
          try {
            await addScheduledLessonAPI(clone);
            enqueueSnackbar('تم إنشاء حصة جديدة لهذا الدرس داخل نفس الأسبوع.', { variant: 'success' });
            await onRefresh?.();
          } catch (err) {
            console.error('Failed to clone scheduled lesson:', err);
            enqueueSnackbar('فشل في استنساخ الحصة.', { variant: 'error' });
          }
          // setIsDropping(`${sectionId}-${date}`);
          // setTimeout(() => setIsDropping(null), 1000);
        } else {
          // Move across weeks
          const updatedLesson = { ...originalLesson };
          updatedLesson.date = date;
          updatedLesson.assignedSections = [sectionId];
          updatedLesson.completionStatus = { [sectionId]: originalLesson.completionStatus?.[sectionId] || 'planned' };
          try {
            await updateScheduledLessonAPI(String(originalLesson.id), updatedLesson);
            enqueueSnackbar('تم نقل الحصة بنجاح.', { variant: 'success' });
            await onRefresh?.();
          } catch (err) {
            console.error('Failed to move scheduled lesson:', err);
            enqueueSnackbar('فشل في نقل الحصة.', { variant: 'error' });
          }
          // setIsDropping(`${sectionId}-${date}`);
          // setTimeout(() => setIsDropping(null), 1000);
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent, cellId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOverCell(cellId);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleSaveLesson = async (lesson: AdaptedLesson) => {
    const originalScheduledLesson = scheduledLessons.find(sl => sl.id === lesson.id.toString());
    if (!originalScheduledLesson) {
        console.error("Could not find original scheduled lesson to update");
        return;
    }
    const completionStatus: { [sectionId: string]: 'planned' | 'in-progress' | 'completed' } = {};
    originalScheduledLesson.assignedSections.forEach(sectionId => {
        // Map 'not-planned' to 'planned' for the API
        const statusForAPI = lesson.status === 'not-planned' ? 'planned' : lesson.status;
        completionStatus[sectionId] = statusForAPI;
    });
    const updatedData: Partial<ScheduledLesson> = {
      customTitle: lesson.lessonTitle,
      customDescription: lesson.notes?.map(n => `[${new Date(n.timestamp).toLocaleString()}] ${n.text}`).join('\n') || '',
      notes: lesson.notes?.map(n => `[${new Date(n.timestamp).toLocaleString()}] ${n.text}`).join('\n') || '',
      estimatedSessions: lesson.estimatedSessions,
      stages: lesson.stages,
      completionStatus: completionStatus,
      manualSessionNumber: lesson.manualSessionNumber
    };
    
    console.log('💾 [CalendarGrid] Saving lesson with notes:', lesson.notes);
    console.log('💾 [CalendarGrid] Converted notes for API:', updatedData.notes);
    
    try {
      await updateScheduledLessonAPI(lesson.id.toString(), updatedData);
      enqueueSnackbar('تم حفظ الحصة بنجاح.', { variant: 'success' });
      await onRefresh?.();
    } catch (err) {
      console.error('Failed to update scheduled lesson:', err);
      enqueueSnackbar('فشل في حفظ تغييرات الحصة.', { variant: 'error' });
    }
    setEditingLesson(null);
  };

  const filteredScheduledLessons = useMemo(() => {
    const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return (scheduledLessons || []).filter(lesson => {
      if (!lesson || !lesson.date) return false;
      const lessonDate = new Date(lesson.date);
      return isWithinInterval(lessonDate, { start: weekStart, end: weekEnd });
    });
  }, [scheduledLessons, currentWeekStart]);

  const dayMapping = {
    'الاثنين': 'Monday',
    'الثلاثاء': 'Tuesday',
    'الاربعاء': 'Wednesday',
    'الخميس': 'Thursday',
    'الجمعه': 'Friday',
    'السبت': 'Saturday',
  };

  const normalizeArabic = (str: string) =>
    str.trim().toLowerCase().replace(/[\u064B-\u0652]/g, '').replace(/أ|إ|آ/g, 'ا').replace(/ؤ|ئ|ى/g, 'ي').replace(/ة/g, 'ه');

  if (isLoading) {
    return <Typography sx={{ textAlign: 'center', p: 4 }}>جار تحميل البيانات...</Typography>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'block' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '100px repeat(6, 1fr)', gap: '4px', minWidth: '100%', overflowY: 'auto', overflowX: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
          <Paper sx={{ textAlign: 'center', fontWeight: 'bold', position: 'sticky', top: 0, right: 0, bgcolor: 'background.paper', zIndex: 10, p: 1 }}>الأقسام</Paper>
          {weekDays.map(dayDate => (
              <Paper key={dayDate.toISOString()} sx={{ textAlign: 'center', fontWeight: 'bold', position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 9, p: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{format(dayDate, 'EEEE', { locale: ar })}</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{format(dayDate, 'd MMMM', { locale: ar })}</Typography>
              </Paper>
          ))}

          {sections.map(section => (
              <React.Fragment key={section.id}>
                  <Paper sx={{ textAlign: 'center', fontWeight: 'bold', p: 2, position: 'sticky', right: 0, bgcolor: 'background.paper', zIndex: 5, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {section.name}
                  </Paper>
                  {weekDays.map(dayDate => {
                      // تحديد ما إذا كان هذا القسم يدرس في هذا اليوم
                      const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                      const dayName = dayNames[dayDate.getDay()];
                      
                      // البحث في الجدول الزمني
                      const isScheduledDay = adminSchedule.some(entry => 
                        entry.sectionId === section.id && entry.day === dayName
                      );
                      
                      let backgroundColor = 'transparent';
                      if (isScheduledDay) {
                        const color = sectionColors[section.id] || '#808080';
                        const r = parseInt(color.slice(1, 3), 16);
                        const g = parseInt(color.slice(3, 5), 16);
                        const b = parseInt(color.slice(5, 7), 16);
                        backgroundColor = `rgba(${r}, ${g}, ${b}, 0.4)`; // شفافية 40%
                      }

                      const dateString = format(dayDate, 'yyyy-MM-dd');
                      const cellId = `${dateString}-${section.id}`;
                      const isDraggedOver = dragOverCell === cellId;
                      const cellLessons: AdaptedLesson[] = filteredScheduledLessons
                        .filter(lesson => lesson && lesson.assignedSections && lesson.assignedSections.includes(section.id) && lesson.date === dateString)
                        .map(lesson => migrateLessonToAdapted(lesson as any))
                        .filter((l): l is AdaptedLesson => Boolean(l));

                      return (
                          <Paper
                              key={dayDate.toISOString()}
                              onDrop={(e) => handleDrop(e, dateString, section.id)}
                              onDragOver={(e) => handleDragOver(e, cellId)}
                              onDragLeave={handleDragLeave}
                              sx={{
                                  minHeight: '120px',
                                  p: 1,
                                  backgroundColor: isDraggedOver 
                                    ? (isScheduledDay ? backgroundColor.replace('0.5)', '0.8)') : 'rgba(0, 123, 255, 0.2)')
                                    : backgroundColor,
                                  transition: 'background-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                                  border: '1px solid #eee',
                                  outline: isDraggedOver ? '3px dashed #007bff' : 'none',
                                  outlineOffset: '-2px',
                                  boxShadow: isDraggedOver ? '0 4px 12px rgba(0, 123, 255, 0.3)' : 'none',
                              }}
                          >
                {cellLessons.map(lesson => (
                  <LessonCard key={lesson.id} lesson={lesson} onDoubleClick={setEditingLesson} onDelete={handleDeleteLesson} allScheduledLessons={cellLessons} />
                              ))}
                          </Paper>
                      );
                  })}
              </React.Fragment>
          ))}
        </Box>
      </Box>
      {editingLesson && (
        <EditLessonModal
          lesson={editingLesson}
          open={!!editingLesson}
          onClose={() => setEditingLesson(null)}
          onSave={handleSaveLesson}
        />
      )}
    </Box>
  );
};

export default CalendarGrid;