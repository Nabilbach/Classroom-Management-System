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

  const statusColorMap: { [key: string]: { bg: string, border: string, text: string } } = {
    'not-planned': { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280' },
    planned: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
    'in-progress': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    completed: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
    cancelled: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
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

  return (
    <Paper
      onDoubleClick={() => onDoubleClick(lesson)}
      draggable="true"
      onDragStart={(e) => {
        console.log('Drag started for lesson:', lesson.id); // Debug log
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'lesson', lessonId: lesson.id }));
      }}
      sx={{
        p: 1.5,
        mb: 1.5,
        borderRadius: '12px',
        background: `linear-gradient(135deg, ${statusColors.bg} 0%, #ffffff 100%)`,
        border: '2px solid',
        borderColor: statusColors.border,
        cursor: 'grab',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          bgcolor: statusColors.border,
        },
        '&:active': {
          cursor: 'grabbing',
          transform: 'scale(0.98)'
        },
        '&:hover': { 
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          transform: 'translateY(-2px)',
          borderColor: statusColors.border,
        },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 'bold', 
            fontSize: '0.9rem',
            color: statusColors.text,
            pr: 1
          }}
        >
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
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <Box sx={{
            background: `linear-gradient(90deg, ${statusColors.border} 0%, ${statusColors.text} 100%)`,
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
      {/* Enhanced Calendar Header */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        p: 2,
        mb: 3,
        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)'
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'white', 
            fontWeight: 'bold',
            textAlign: 'center'
          }}
        >
          📅 جدول التقويم الأسبوعي
        </Typography>
      </Box>
      
      <Box sx={{ display: 'block' }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: '140px repeat(6, 1fr)', 
          gap: '4px', 
          minWidth: '100%', 
          overflowY: 'auto', 
          overflowX: 'auto', 
          maxHeight: 'calc(100vh - 160px)',
          bgcolor: '#f9fafb',
          p: 1,
          borderRadius: '12px'
        }}>
          {/* Header - القسم */}
          <Paper sx={{ 
            textAlign: 'center', 
            fontWeight: 'bold', 
            position: 'sticky', 
            top: 0, 
            right: 0, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            zIndex: 10, 
            p: 1.5,
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
          }}>
            🏫 الأقسام
          </Paper>
          
          {/* Headers - الأيام */}
          {weekDays.map(dayDate => (
            <Paper 
              key={dayDate.toISOString()} 
              sx={{ 
                textAlign: 'center', 
                fontWeight: 'bold', 
                position: 'sticky', 
                top: 0, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                zIndex: 9, 
                p: 1.5,
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {format(dayDate, 'EEEE', { locale: ar })}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', opacity: 0.9 }}>
                {format(dayDate, 'd MMMM', { locale: ar })}
              </Typography>
            </Paper>
          ))}

          {sections.map(section => (
            <React.Fragment key={section.id}>
              {/* Section Name Cell */}
              <Paper sx={{ 
                textAlign: 'center', 
                fontWeight: 'bold', 
                p: 2, 
                position: 'sticky', 
                right: 0, 
                background: 'linear-gradient(135deg, #f0f4ff 0%, #e0eaff 100%)',
                zIndex: 5, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: '8px',
                borderRight: '4px solid #667eea',
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
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
                            p: 1.5,
                            background: isDraggedOver 
                              ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)'
                              : (isScheduledDay 
                                  ? `linear-gradient(135deg, ${backgroundColor} 0%, rgba(255,255,255,0.8) 100%)` 
                                  : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)'),
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: isDraggedOver ? '2px dashed #667eea' : '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: isDraggedOver 
                              ? '0 8px 24px rgba(102, 126, 234, 0.3)' 
                              : '0 2px 4px rgba(0, 0, 0, 0.04)',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                              transform: 'translateY(-1px)'
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