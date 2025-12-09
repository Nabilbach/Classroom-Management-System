import React, { useState, useMemo, useEffect } from 'react';
import CalendarGrid from '../components/CalendarGrid';
import TemplateLibrary from '../components/TemplateLibrary';
import StatisticsFooter from '../components/StatisticsFooter';
import EditLessonModal from '../components/EditLessonModal';
import { startOfWeek, addWeeks, subWeeks, endOfWeek, format } from 'date-fns';
import { ar } from 'date-fns/locale/ar';
import { Box, Typography, IconButton, Button } from '@mui/material';
import { ChevronLeft, ChevronRight, Delete as DeleteIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { ScheduledLesson, AdaptedLesson } from '../types/lessonLogTypes';
import { fetchScheduledLessons, deleteScheduledLesson, updateScheduledLesson } from '../services/api/scheduledLessonService';

interface LessonProgressSummaryProps {
  scheduledLessons: ScheduledLesson[];
}

const LessonProgressSummary: React.FC<LessonProgressSummaryProps> = ({ scheduledLessons }) => {
  const groupedLessons = useMemo(() => {
    const groups: { [key: string]: ScheduledLesson[] } = {};
    (scheduledLessons || []).forEach(lesson => {
      if (lesson.lessonGroupId) {
        if (!groups[lesson.lessonGroupId]) {
          groups[lesson.lessonGroupId] = [];
        }
        groups[lesson.lessonGroupId].push(lesson);
      }
    });
    return groups;
  }, [scheduledLessons]);

  return (
    <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: '8px', boxShadow: 1 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>ملخص تقدم الدروس</Typography>
      {Object.keys(groupedLessons).length === 0 ? (
        <Typography variant="body2" color="textSecondary">لا توجد دروس مجمعة لعرض التقدم.</Typography>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                الدرس
              </th>
              {/* Assuming sections are dynamic, need to get section names */}
              {/* For now, just show overall progress */}
              <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                التقدم الكلي
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(groupedLessons).map(([lessonGroupId, lessons]) => {
              const completedSessions = lessons.filter(lesson => lesson.completionStatus && Object.values(lesson.completionStatus).includes('completed')).length;
              const totalSessions = lessons.length;
              const progressPercentage = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

              // Get a representative lesson title (e.g., from the first lesson in the group)
              const lessonTitle = lessons[0]?.customTitle || `مجموعة الدرس ${lessonGroupId}`;

              return (
                <tr key={lessonGroupId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {lessonTitle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500">
                    {progressPercentage.toFixed(0)}% {progressPercentage === 100 ? '✅' : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Box>
  );
};

import LearningAnalytics from '../components/LearningAnalytics';

const LearningAndProgressHub: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [scheduledLessons, setScheduledLessons] = useState<ScheduledLesson[]>([]);
  const [editingLesson, setEditingLesson] = useState<AdaptedLesson | null>(null);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        console.log('🔄 Loading scheduled lessons...');
        const data = await fetchScheduledLessons();
        console.log('📊 Received scheduled lessons data:', data);
        console.log('📊 Data length:', data?.length || 0);
        setScheduledLessons(data || []);
      } catch (e) {
        console.error('❌ Failed to load scheduled lessons', e);
      }
    };
    loadInitial();
  }, []);

  const reloadScheduledLessons = async () => {
    try {
      console.log('🔄 Reloading scheduled lessons...');
      const data = await fetchScheduledLessons();
      console.log('📊 Reloaded scheduled lessons data:', data);
      console.log('📊 Data length:', data?.length || 0);
      setScheduledLessons(data || []);
    } catch (e) {
      console.error('❌ Failed to reload scheduled lessons', e);
    }
  };

  const goToPreviousWeek = () => setCurrentWeekStart(prev => subWeeks(prev, 1));
  const goToNextWeek = () => setCurrentWeekStart(prev => addWeeks(prev, 1));
  const goToCurrentWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekRangeText = useMemo(() => {
    const start = currentWeekStart;
    const end = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return `${format(start, 'd MMMM', { locale: ar })} - ${format(end, 'd MMMM', { locale: ar })}`;
  }, [currentWeekStart]);


  const handleClearCalendar = async () => {
    if (window.confirm('هل أنت متأكد من حذف جميع الحصص في التقويم؟ لا يمكن التراجع عن هذا الإجراء.')) {
      try {
  await Promise.all(scheduledLessons.map(sl => deleteScheduledLesson(sl.id)));
  setScheduledLessons([]);
        alert('تم مسح التقويم بنجاح.');
      } catch (error) {
        console.error('Failed to clear calendar:', error);
        alert('فشل في مسح التقويم.');
      }
    }
  };

  const handleSaveLesson = async (updatedLesson: AdaptedLesson) => {
    try {
      // 1. Update via API first
      await updateScheduledLesson(updatedLesson.id, {
        customTitle: updatedLesson.lessonTitle,
        stages: updatedLesson.stages,
        notes: updatedLesson.notes?.map(note => note.text).join('\n') || '',
        manualSessionNumber: updatedLesson.manualSessionNumber,
        progress: updatedLesson.progress
      });

      // 2. Update local state
      setScheduledLessons(prevLessons => 
        prevLessons.map(lesson => 
          lesson.id === updatedLesson.id 
            ? {
                ...lesson,
                customTitle: updatedLesson.lessonTitle,
                stages: updatedLesson.stages,
                notes: updatedLesson.notes?.map(note => note.text).join('\n') || '', // Convert notes array to string for ScheduledLesson format
                manualSessionNumber: updatedLesson.manualSessionNumber,
                progress: updatedLesson.progress
              }
            : lesson
        )
      );

      console.log('تم حفظ الحصة المعدلة:', updatedLesson);
      enqueueSnackbar('تم حفظ تعديلات الدرس بنجاح', { variant: 'success' });
      
      // Reload to ensure any new lessons (e.g. from splitting) appear
      reloadScheduledLessons();
    } catch (error) {
      console.error('خطأ في حفظ الدرس:', error);
      enqueueSnackbar('فشل في حفظ تعديلات الدرس', { variant: 'error' });
    }
    
    setEditingLesson(null);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await deleteScheduledLesson(lessonId);
      enqueueSnackbar('تم حذف الحصة بنجاح', { variant: 'success' });
      reloadScheduledLessons();
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      enqueueSnackbar('فشل في حذف الحصة', { variant: 'error' });
    }
  };

  return (
    <div className="w-full h-full px-2" dir="rtl">
      {/* Compact Header */}
      <Box 
        sx={{ 
          bgcolor: 'white',
          borderRadius: '12px',
          p: 1.5,
          mb: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid #e5e7eb'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1f2937' }}>
            📚 إدارة التعلم
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f3f4f6', borderRadius: '8px', p: 0.5 }}>
            <IconButton size="small" onClick={goToPreviousWeek}>
              <ChevronRight fontSize="small" />
            </IconButton>
            <Typography variant="body2" sx={{ fontWeight: 'bold', px: 1, minWidth: '140px', textAlign: 'center' }}>
              {weekRangeText}
            </Typography>
            <IconButton size="small" onClick={goToNextWeek}>
              <ChevronLeft fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            size="small"
            variant="outlined" 
            onClick={goToCurrentWeek}
            sx={{ color: '#4b5563', borderColor: '#d1d5db' }}
          >
            الأسبوع الحالي
          </Button>
          
          <IconButton 
            size="small"
            color="error" 
            onClick={handleClearCalendar}
            title="مسح التقويم"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Main Content Grid */}
      <div className="flex flex-col md:flex-row gap-4 min-h-[calc(100vh-100px)]">
        <div className="w-full md:w-80 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 flex flex-col">
          <TemplateLibrary />
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 flex flex-col">
          <CalendarGrid currentWeekStart={currentWeekStart} scheduledLessons={scheduledLessons} onRefresh={reloadScheduledLessons} />
        </div>
      </div>
      
      <LearningAnalytics 
        scheduledLessons={scheduledLessons} 
        onEditLesson={(lesson) => setEditingLesson(lesson)}
        onDeleteLesson={handleDeleteLesson}
      />

      {editingLesson && (
        <EditLessonModal
          lesson={editingLesson}
          open={!!editingLesson}
          onClose={() => setEditingLesson(null)}
          onSave={handleSaveLesson}
        />
      )}
    </div>
  );
};

export default LearningAndProgressHub;