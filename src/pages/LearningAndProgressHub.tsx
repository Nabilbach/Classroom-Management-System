import React, { useState, useMemo } from 'react';
import CalendarGrid from '../components/CalendarGrid';
import TemplateLibrary from '../components/TemplateLibrary';
import StatisticsFooter from '../components/StatisticsFooter';
import EditLessonModal from '../components/EditLessonModal';
import { startOfWeek, addWeeks, subWeeks, endOfWeek, format } from 'date-fns';
import ar from 'date-fns/locale/ar';
import { Box, Typography, IconButton, Button } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useCurriculum } from '../contexts/CurriculumContext';
import { ScheduledLesson, AdaptedLesson } from '../types/lessonLogTypes';

interface LessonProgressSummaryProps {
  scheduledLessons: ScheduledLesson[];
  onLessonClick: (lessonId: string) => void; // To open edit modal
}

const LessonProgressSummary: React.FC<LessonProgressSummaryProps> = ({ scheduledLessons, onLessonClick }) => {
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
      <Typography variant="h6" gutterBottom>ملخص تقدم الدروس</Typography>
      {Object.keys(groupedLessons).length === 0 ? (
        <Typography variant="body2" color="textSecondary">لا توجد دروس مجمعة لعرض التقدم.</Typography>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الدرس
              </th>
              {/* Assuming sections are dynamic, need to get section names */}
              {/* For now, just show overall progress */}
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {lessonTitle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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

const LearningAndProgressHub: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const { scheduledLessons, clearAllScheduledLessons } = useCurriculum();
  const [editingLesson, setEditingLesson] = useState<AdaptedLesson | null>(null);

  const goToPreviousWeek = () => setCurrentWeekStart(prev => subWeeks(prev, 1));
  const goToNextWeek = () => setCurrentWeekStart(prev => addWeeks(prev, 1));
  const goToCurrentWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekRangeText = useMemo(() => {
    const start = currentWeekStart;
    const end = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return `${format(start, 'd MMMM', { locale: ar })} - ${format(end, 'd MMMM', { locale: ar })}`;
  }, [currentWeekStart]);

  const handleLessonClick = (lessonId: string) => {
    const lessonToEdit = scheduledLessons.find(lesson => lesson.id === lessonId);
    if (lessonToEdit) {
      setEditingLesson(lessonToEdit);
    }
  };

  const handleClearCalendar = async () => {
    if (window.confirm('هل أنت متأكد من حذف جميع الحصص في التقويم؟ لا يمكن التراجع عن هذا الإجراء.')) {
      try {
        await clearAllScheduledLessons();
        alert('تم مسح التقويم بنجاح.');
      } catch (error) {
        console.error('Failed to clear calendar:', error);
        alert('فشل في مسح التقويم.');
      }
    }
  };

  const handleSaveLesson = (lesson: AdaptedLesson) => {
    // This function would typically update the lesson in your state/backend
    // For now, we'll just close the modal
    setEditingLesson(null);
  };

  return (
    <div className="container mx-auto h-full" dir="rtl">
      <Box sx={{ px: 2 }}>
        <Box className="flex justify-end items-center mb-1 py-1 px-90 bg-gray-50 rounded-lg">
          <IconButton onClick={goToPreviousWeek}><ChevronRight /></IconButton>
          <Typography variant="h6" className="font-semibold">
            <Button variant="text" size="small" onClick={goToCurrentWeek} sx={{ p: 0, minWidth: 0, mr: 1 }}>
              الأسبوع الحالي
            </Button>: {weekRangeText}
          </Typography>
          <IconButton onClick={goToNextWeek}><ChevronLeft /></IconButton>
          <Button variant="contained" color="error" onClick={handleClearCalendar} sx={{ mr: 2 }}>
            مسح التقويم
          </Button>
        </Box>
      </Box>

      <div className="flex flex-col md:flex-row gap-6 h-full">
        <div className="w-full md:w-64 bg-white rounded-xl shadow-sm overflow-auto h-full">
          <TemplateLibrary />
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm overflow-auto h-full">
          <CalendarGrid currentWeekStart={currentWeekStart} scheduledLessons={scheduledLessons} />
        </div>
      </div>
      <LessonProgressSummary scheduledLessons={scheduledLessons} onLessonClick={handleLessonClick} />
      <StatisticsFooter />

      {editingLesson && (
        <EditLessonModal
          lesson={editingLesson}
          onClose={() => setEditingLesson(null)}
          onSave={handleSaveLesson}
          scheduledLessons={scheduledLessons}
        />
      )}
    </div>
  );
};

export default LearningAndProgressHub;