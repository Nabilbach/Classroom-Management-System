import { Box, Paper, Typography, IconButton, Button, Menu, MenuItem, ListItemText, ListItemIcon } from '@mui/material';
import { Delete as DeleteIcon, RestoreFromTrash as RestoreIcon, History as HistoryIcon, Warning as WarningIcon } from '@mui/icons-material';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isWithinInterval, getDay, isSameWeek, isSameDay, isBefore, startOfDay, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useSnackbar } from 'notistack'; // Import useSnackbar
// Scheduled lessons mutations are performed via the API service directly
import { addScheduledLesson as addScheduledLessonAPI, updateScheduledLesson as updateScheduledLessonAPI, deleteScheduledLesson as deleteScheduledLessonAPI } from '../services/api/scheduledLessonService';
import { fetchAdminSchedule, AdminScheduleEntry } from '../services/api/adminScheduleService';
import { useSections, Section } from '../contexts/SectionsContext';
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

  const statusColorMap: { [key: string]: { bg: string, border: string, text: string } } = {
    'not-planned': { bg: '#f9fafb', border: '#9ca3af', text: '#4b5563' }, // Gray
    planned: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },      // Blue
    'in-progress': { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' }, // Amber
    completed: { bg: '#ecfdf5', border: '#10b981', text: '#065f46' },     // Emerald
    cancelled: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },     // Red
  };

  const statusColors = statusColorMap[displayStatus] || statusColorMap['not-planned'];

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

  const calculatedProgress = useMemo(() => {
    if (lesson.stages && lesson.stages.length > 0) {
      const completed = lesson.stages.filter(s => s.isCompleted).length;
      return Math.round((completed / lesson.stages.length) * 100);
    }
    return lesson.progress || 0;
  }, [lesson.stages, lesson.progress]);

  // Level 2: Plan vs Reality Check
  const syncStatus = useMemo(() => {
    if (!lesson.date) return 'unknown';
    
    const today = startOfDay(new Date());
    const lessonDate = parseISO(lesson.date);
    const isCompleted = displayStatus === 'completed' || calculatedProgress === 100;
    
    // If lesson is in the past (before today) and NOT completed -> Delayed
    if (isBefore(lessonDate, today) && !isCompleted) {
      return 'delayed';
    }
    
    return 'on-track';
  }, [lesson.date, displayStatus, calculatedProgress]);

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
        mb: 1,
        borderRadius: '6px',
        bgcolor: statusColors.bg,
        borderLeft: `4px solid ${statusColors.border}`,
        borderTop: '1px solid #e5e7eb',
        borderRight: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb',
        cursor: 'grab',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          transform: 'translateY(-1px)'
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 'bold', 
            fontSize: '0.9rem',
            color: statusColors.text,
            pr: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          {syncStatus === 'delayed' && (
            <WarningIcon 
              sx={{ 
                fontSize: '1rem', 
                color: '#ef4444',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 },
                }
              }} 
              titleAccess="متأخر عن الخطة"
            />
          )}
          {lesson.lessonTitle}
        </Typography>
        {sessionNumber !== null && (
          <Box
            sx={{
              background: `linear-gradient(135deg, ${statusColors.border} 0%, ${statusColors.text} 100%)`,
              color: 'white',
              px: 1.2,
              py: 0.4,
              borderRadius: '20px',
              fontWeight: 'bold',
              fontSize: '0.7rem',
              whiteSpace: 'nowrap',
              boxShadow: `0 2px 4px ${statusColors.border}40`,
            }}
          >
            حصة {sessionNumber}
          </Box>
        )}
        <IconButton 
          onClick={() => onDelete(lesson.id)} 
          size="small"
          sx={{ 
            p: 0.5,
            color: '#ef4444',
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            '&:hover': {
              bgcolor: '#ef4444',
              color: 'white',
              transform: 'rotate(90deg)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <Typography 
        variant="caption" 
        sx={{ 
          display: 'block', 
          mt: 1,
          color: 'text.secondary',
          fontSize: '0.75rem'
        }}
      >
        📖 {lesson.subject} • {lesson.estimatedSessions} حصص
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
        <Box
          sx={{
            bgcolor: statusColors.bg,
            color: statusColors.text,
            px: 1,
            py: 0.3,
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '0.7rem',
            whiteSpace: 'nowrap',
            border: `1px solid ${statusColors.border}`,
          }}
        >
          {statusTextMap[displayStatus]}
        </Box>
        
        <Box sx={{ 
          flex: 1, 
          mx: 1.5,
          bgcolor: '#e5e7eb', 
          borderRadius: '9999px', 
          height: '8px',
          overflow: 'hidden',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
          position: 'relative'
        }}>
          <Box sx={{
            background: `linear-gradient(90deg, ${statusColors.border} 0%, ${statusColors.text} 100%)`,
            height: '100%',
            borderRadius: 'inherit',
            width: `${calculatedProgress}%`,
            transition: 'width 0.5s ease-in-out',
          }} />
        </Box>
        <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: statusColors.text, minWidth: '24px' }}>
          {calculatedProgress}%
        </Typography>
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
  const { enqueueSnackbar, closeSnackbar } = useSnackbar(); // Use useSnackbar hook
  const [editingLesson, setEditingLesson] = useState<AdaptedLesson | null>(null);
  // const [isDropping, setIsDropping] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null); // For drag-over visual feedback
  const [adminSchedule, setAdminSchedule] = useState<AdminScheduleEntry[]>([]);
  
  // Deleted lessons history for persistent undo
  const [deletedLessonsHistory, setDeletedLessonsHistory] = useState<ScheduledLesson[]>([]);
  const [restoreMenuAnchor, setRestoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [sortedSections, setSortedSections] = useState<Section[]>([]);

  useEffect(() => {
    setSortedSections(sections);
  }, [sections]);

  const handleSortByDay = (dayDate: Date) => {
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayName = dayNames[dayDate.getDay()];

    const sorted = [...sections].sort((a, b) => {
      const getStartTime = (sectionId: string) => {
        const entries = adminSchedule.filter(e => e.sectionId === sectionId && e.day === dayName);
        if (entries.length === 0) return '23:59'; // Late time for no schedule
        // Sort entries by time just in case and pick first
        entries.sort((e1, e2) => e1.startTime.localeCompare(e2.startTime));
        return entries[0].startTime;
      };

      const timeA = getStartTime(a.id);
      const timeB = getStartTime(b.id);

      return timeA.localeCompare(timeB);
    });

    setSortedSections(sorted);
    enqueueSnackbar(`تم ترتيب الأقسام حسب توقيت يوم ${format(dayDate, 'EEEE', { locale: ar })}`, { variant: 'info' });
  };

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
    const lessonToDelete = scheduledLessons.find(l => l.id === lessonId);
    if (!lessonToDelete) return;

    try {
      // Add to history before deleting
      setDeletedLessonsHistory(prev => [lessonToDelete, ...prev].slice(0, 10)); // Keep last 10

      await deleteScheduledLessonAPI(lessonId);
      await onRefresh?.();
      
      enqueueSnackbar('تم حذف الحصة', { 
          variant: 'success',
          action: (key) => (
              <Button color="inherit" size="small" onClick={async () => {
                  closeSnackbar(key);
                  try {
                      // Remove id and LessonTemplate to match Omit<ScheduledLesson, 'id' | 'LessonTemplate'>
                      const { id, LessonTemplate, ...rest } = lessonToDelete;
                      await addScheduledLessonAPI(rest);
                      await onRefresh?.();
                      // Remove from history if restored via toast
                      setDeletedLessonsHistory(prev => prev.filter(l => l.id !== lessonToDelete.id));
                      enqueueSnackbar('تم استعادة الحصة', { variant: 'success' });
                  } catch(e) {
                      console.error('Failed to restore lesson:', e);
                      enqueueSnackbar('فشل استعادة الحصة', { variant: 'error' });
                  }
              }}>
                  تراجع
              </Button>
          )
      });
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      enqueueSnackbar('فشل في حذف الدرس', { variant: 'error' });
    }
  };

  const handleRestoreFromHistory = async (lesson: ScheduledLesson) => {
      try {
          const { id, LessonTemplate, ...rest } = lesson;
          await addScheduledLessonAPI(rest);
          await onRefresh?.();
          setDeletedLessonsHistory(prev => prev.filter(l => l.id !== lesson.id));
          enqueueSnackbar('تم استعادة الحصة من المحذوفات', { variant: 'success' });
          setRestoreMenuAnchor(null);
      } catch (e) {
          console.error('Failed to restore lesson:', e);
          enqueueSnackbar('فشل استعادة الحصة', { variant: 'error' });
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
        // Prevent duplication in same slot
        if (originalLesson.date === date && originalLesson.assignedSections.includes(sectionId)) {
          return;
        }

        const sameWeek = isSameWeek(new Date(date), new Date(originalLesson.date), { weekStartsOn: 1 });
        if (sameWeek) {
          // Clone into a new scheduled lesson within same week
          const groupId = originalLesson.lessonGroupId || originalLesson.templateId || String(originalLesson.id);
          const targetDate = new Date(date);
          
          // Determine session number
          let nextNumber = originalLesson.manualSessionNumber;
          
          // Only increment if staying in the same section
          // If moving to a different section, keep the number constant.
          const isSameSection = originalLesson.assignedSections.includes(sectionId);
          
          if (isSameSection) {
             const lessonsInSameGroupSameWeek = (scheduledLessons || [])
                .filter(sl => (sl.lessonGroupId || sl.templateId || String(sl.id)) === groupId)
                .filter(sl => isSameWeek(new Date(sl.date), targetDate, { weekStartsOn: 1 }));

             const existingNumbers = lessonsInSameGroupSameWeek
                .map(sl => (typeof sl.manualSessionNumber === 'number' ? sl.manualSessionNumber : undefined))
                .filter((n): n is number => typeof n === 'number');
             nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 2;
          }

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
      {/* Undo Button Area */}
      {deletedLessonsHistory.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              startIcon={<HistoryIcon />}
              onClick={(e) => setRestoreMenuAnchor(e.currentTarget)}
              variant="outlined"
              color="primary"
              size="small"
              sx={{ borderRadius: '8px' }}
            >
              تراجع عن الحذف ({deletedLessonsHistory.length})
            </Button>
            <Menu
              anchorEl={restoreMenuAnchor}
              open={Boolean(restoreMenuAnchor)}
              onClose={() => setRestoreMenuAnchor(null)}
              PaperProps={{
                elevation: 3,
                sx: { borderRadius: '12px', mt: 1 }
              }}
            >
              <Typography variant="subtitle2" sx={{ px: 2, py: 1, borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                العناصر المحذوفة مؤخراً
              </Typography>
              {deletedLessonsHistory.map((lesson) => (
                <MenuItem key={lesson.id} onClick={() => handleRestoreFromHistory(lesson)}>
                  <ListItemIcon>
                    <RestoreIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={lesson.customTitle || 'درس بدون عنوان'} 
                    secondary={`${format(new Date(lesson.date), 'yyyy-MM-dd')} - ${lesson.subject}`} 
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                  />
                </MenuItem>
              ))}
            </Menu>
        </Box>
      )}
      
      <Box sx={{ display: 'block' }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: '140px repeat(6, 1fr)', 
          gap: '4px', 
          minWidth: '100%', 
          overflowY: 'auto', 
          overflowX: 'auto', 
          maxHeight: 'calc(100vh - 160px)',
          bgcolor: '#ffffff',
          p: 0,
          borderRadius: '0'
        }}>
          {/* Header - القسم */}
          <Paper sx={{ 
            textAlign: 'center', 
            fontWeight: 'bold', 
            position: 'sticky', 
            top: 0, 
            right: 0, 
            bgcolor: '#f3f4f6',
            color: '#374151',
            zIndex: 10, 
            p: 1.5,
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            🏫 الأقسام
          </Paper>
          
          {/* Headers - الأيام */}
          {weekDays.map(dayDate => {
            const isToday = isSameDay(dayDate, new Date());
            return (
            <Paper 
              key={dayDate.toISOString()} 
              onClick={() => handleSortByDay(dayDate)}
              sx={{ 
                textAlign: 'center', 
                fontWeight: 'bold', 
                position: 'sticky', 
                top: 0, 
                bgcolor: isToday ? '#eff6ff' : '#f3f4f6',
                color: isToday ? '#1d4ed8' : '#374151',
                zIndex: 9, 
                p: 1.5,
                borderRadius: '8px',
                border: isToday ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: isToday ? '#dbeafe' : '#e5e7eb',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                },
                transition: 'all 0.2s ease',
                boxShadow: isToday ? '0 0 15px rgba(59, 130, 246, 0.4)' : 'none',
                animation: isToday ? 'pulse-border 2s infinite' : 'none',
                '@keyframes pulse-border': {
                  '0%': { borderColor: '#3b82f6' },
                  '50%': { borderColor: '#93c5fd' },
                  '100%': { borderColor: '#3b82f6' },
                }
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                {format(dayDate, 'EEEE', { locale: ar })}
                {isToday && (
                  <Box component="span" sx={{ 
                    fontSize: '0.65rem', 
                    bgcolor: '#3b82f6', 
                    color: 'white', 
                    px: 0.8, 
                    py: 0.2, 
                    borderRadius: '10px',
                    animation: 'pulse-badge 1.5s infinite',
                    '@keyframes pulse-badge': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.7 },
                      '100%': { opacity: 1 },
                    }
                  }}>
                    اليوم
                  </Box>
                )}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', color: isToday ? '#1e40af' : '#6b7280' }}>
                {format(dayDate, 'd MMMM', { locale: ar })}
              </Typography>
            </Paper>
          );})}

          {sortedSections.map(section => (
            <React.Fragment key={section.id}>
              {/* Section Name Cell */}
              <Paper sx={{ 
                textAlign: 'center', 
                fontWeight: 'bold', 
                p: 2, 
                position: 'sticky', 
                right: 0, 
                bgcolor: '#ffffff',
                zIndex: 5, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: '8px',
                borderRight: '4px solid #667eea',
                border: '1px solid #e5e7eb',
                borderRightWidth: '4px',
                borderRightColor: '#667eea'
              }}>
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
                      const isToday = isSameDay(dayDate, new Date());
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
                            bgcolor: isDraggedOver 
                              ? 'rgba(102, 126, 234, 0.1)'
                              : (isScheduledDay 
                                  ? (isToday ? backgroundColor.replace('0.4', '0.6') : backgroundColor) 
                                  : (isToday ? '#f8fafc' : '#ffffff')),
                            transition: 'all 0.2s ease',
                            border: isDraggedOver 
                              ? '2px dashed #667eea' 
                              : (isToday ? '2px solid #bfdbfe' : '1px solid #f3f4f6'),
                            borderRadius: '8px',
                            boxShadow: isToday ? 'inset 0 0 10px rgba(59, 130, 246, 0.05)' : 'none',
                            '&:hover': {
                              bgcolor: isScheduledDay ? backgroundColor : '#f9fafb',
                            }
                          }}
                        >
                          {cellLessons.map(lesson => (
                            <LessonCard 
                              key={lesson.id} 
                              lesson={lesson} 
                              onDoubleClick={setEditingLesson} 
                              onDelete={handleDeleteLesson} 
                              allScheduledLessons={cellLessons} 
                            />
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