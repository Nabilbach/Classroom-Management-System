import { Box, Paper, Typography, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isWithinInterval, getDay } from 'date-fns';
import ar from 'date-fns/locale/ar';
import enUS from 'date-fns/locale/en-US';
import { useSnackbar } from 'notistack'; // Import useSnackbar
import { useCurriculum } from '../contexts/CurriculumContext';
import { useSections } from '../contexts/SectionsContext';
import { AdaptedLesson, ScheduledLesson } from '../types/lessonLogTypes';
import { migrateLessonToAdapted } from '../utils/lessonLogMigrationUtils';
import EditLessonModal from './EditLessonModal';
import React, { useState, useMemo } from 'react';

import dayjs from 'dayjs'; // Import dayjs

// Define LessonStage interface (copied from curriculumService.ts for local use)
interface LessonStage {
  id: string;
  title: string;
  isCompleted: boolean;
  completionDate?: string;
}

// Helper function to calculate lesson status
const calculateLessonStatus = (stages: LessonStage[] | undefined): AdaptedLesson['status'] => {
  if (!stages || stages.length === 0) {
    return 'planned';
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
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ currentWeekStart, scheduledLessons }) => {
  const { templates, addScheduledLesson, editScheduledLesson, removeScheduledLesson } = useCurriculum();
  const { sections, isLoading } = useSections();
  const { enqueueSnackbar } = useSnackbar(); // Use useSnackbar hook
  const [editingLesson, setEditingLesson] = useState<AdaptedLesson | null>(null);
  const [isDropping, setIsDropping] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null); // For drag-over visual feedback

  const handleDeleteLesson = async (lessonId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
      try {
        await removeScheduledLesson(lessonId);
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
    const dragData = JSON.parse(e.dataTransfer.getData('application/json'));

    if (dragData.type === 'template') {
      const template = templates.find(t => t.id === dragData.templateId);
      if (template) {
        const newLesson: Omit<ScheduledLesson, 'id' | 'LessonTemplate'> = {
          templateId: template.id,
          date: date,
          startTime: '08:00',
          assignedSections: [sectionId],
          completionStatus: { [sectionId]: 'planned' },
          customTitle: template.title,
          customDescription: template.description,
          stages: template.stages,
          estimatedSessions: template.estimatedSessions,
        };
        await addScheduledLesson(newLesson);
        setIsDropping(`${sectionId}-${date}`);
        setTimeout(() => setIsDropping(null), 1000);
      }
    } else if (dragData.type === 'lesson') {
      const lessonIdToFind = String(dragData.lessonId);
      const originalLesson = scheduledLessons.find(sl => String(sl.id) === lessonIdToFind);

      if (originalLesson) {
        // Create a copy of the original lesson to modify
        const updatedLesson = { ...originalLesson };

        // Update the date and assigned sections
        updatedLesson.date = date;
        // Ensure assignedSections is an array and includes the new sectionId
        updatedLesson.assignedSections = [sectionId]; // Assuming a lesson can only be assigned to one section in a cell
        updatedLesson.completionStatus = { [sectionId]: originalLesson.completionStatus?.[sectionId] || 'planned' }; // Maintain existing status or default to planned

        // Call editScheduledLesson to update the existing lesson
        await editScheduledLesson(originalLesson.id, updatedLesson);
        enqueueSnackbar('تم نقل الحصة بنجاح.', { variant: 'success' });
        setIsDropping(`${sectionId}-${date}`);
        setTimeout(() => setIsDropping(null), 1000);
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

  const handleSaveLesson = (lesson: AdaptedLesson) => {
    const originalScheduledLesson = scheduledLessons.find(sl => sl.id === lesson.id.toString());
    if (!originalScheduledLesson) {
        console.error("Could not find original scheduled lesson to update");
        return;
    }
    const completionStatus: { [sectionId: string]: 'planned' | 'in-progress' | 'completed' } = {};
    originalScheduledLesson.assignedSections.forEach(sectionId => {
        completionStatus[sectionId] = lesson.status;
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
    editScheduledLesson(lesson.id.toString(), updatedData);
    setEditingLesson(null);
  };

  const filteredScheduledLessons = useMemo(() => {
    const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return scheduledLessons.filter(lesson => {
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
                      const dayNameArabic = format(dayDate, 'EEEE', { locale: ar });
                      const normalizedDay = normalizeArabic(dayNameArabic);
                      const dayNameEnglish = dayMapping[normalizedDay as keyof typeof dayMapping];
                      const isScheduledDay = section.scheduledDays?.includes(dayNameEnglish as any);
                      
                      let backgroundColor = 'transparent';
                      if (isScheduledDay) {
                        const color = section.color || '#808080';
                        if (typeof color === 'string' && color.startsWith('#') && color.length === 7) {
                          const r = parseInt(color.slice(1, 3), 16);
                          const g = parseInt(color.slice(3, 5), 16);
                          const b = parseInt(color.slice(5, 7), 16);
                          if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                            backgroundColor = `rgba(${r}, ${g}, ${b}, 0.15)`;
                          } else {
                            backgroundColor = 'rgba(128, 128, 128, 0.1)';
                          }
                        } else {
                          backgroundColor = 'rgba(128, 128, 128, 0.1)';
                        }
                      }

                      const dateString = format(dayDate, 'yyyy-MM-dd');
                      const cellId = `${dateString}-${section.id}`;
                      const isDraggedOver = dragOverCell === cellId;
                      const cellLessons = filteredScheduledLessons
                        .filter(lesson => lesson && lesson.assignedSections && lesson.assignedSections.includes(section.id) && lesson.date === dateString)
                        .map(lesson => migrateLessonToAdapted(lesson as any))
                        .filter(Boolean);

                      return (
                          <Paper
                              key={dayDate.toISOString()}
                              onDrop={(e) => handleDrop(e, dateString, section.id)}
                              onDragOver={(e) => handleDragOver(e, cellId)}
                              onDragLeave={handleDragLeave}
                              sx={{
                                  minHeight: '120px',
                                  p: 1,
                                  backgroundColor,
                                  transition: 'background-color 0.3s ease-in-out',
                                  border: '1px solid #eee',
                                  outline: isDraggedOver ? '2px dashed #007bff' : 'none',
                                  outlineOffset: '-2px',
                              }}
                          >
                              {cellLessons.map(lesson => (
                                  <LessonCard key={lesson.id} lesson={lesson} onDoubleClick={setEditingLesson} onDelete={handleDeleteLesson} allScheduledLessons={scheduledLessons} />
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
          scheduledLessons={scheduledLessons}
        />
      )}
    </Box>
  );
};

export default CalendarGrid;