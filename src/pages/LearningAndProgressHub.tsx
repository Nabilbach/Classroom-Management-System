import React, { useState, useMemo } from 'react';
import CalendarGrid from '../components/CalendarGrid';
import TemplateLibrary from '../components/TemplateLibrary';
import StatisticsFooter from '../components/StatisticsFooter';
import EditLessonModal from '../components/EditLessonModal';
import { startOfWeek, addWeeks, subWeeks, endOfWeek, format } from 'date-fns';
import ar from 'date-fns/locale/ar';
import { Box, Typography, IconButton, Button } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import * as XLSX from 'xlsx';

import TemplateEditModal from '../components/TemplateEditModal';

import { useCurriculum } from '../contexts/CurriculumContext';
import { ScheduledLesson, AdaptedLesson } from '../types/lessonLogTypes';

interface LessonProgressSummaryProps {
  scheduledLessons: ScheduledLesson[];
  onLessonClick: (lessonId: string) => void; // To open edit modal
}

const LessonProgressSummary: React.FC<LessonProgressSummaryProps> = ({ scheduledLessons, onLessonClick }) => {
  const groupedLessons = useMemo(() => {
    const groups: { [key: string]: ScheduledLesson[] } = {};
    scheduledLessons.forEach(lesson => {
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
  const { scheduledLessons, clearAllScheduledLessons, addTemplate, refetchTemplates, editScheduledLesson } = useCurriculum();
  const [editingLesson, setEditingLesson] = useState<AdaptedLesson | null>(null);
  const [isTemplateEditModalOpen, setIsTemplateEditModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LessonTemplate | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet);

      const requiredHeaders = ['رقم الأسبوع', 'عنوان الدرس', 'اسم المقرر', 'المستوى'];
      const actualHeaders = Object.keys(json[0] || {});

      const missingHeaders = requiredHeaders.filter(header => !actualHeaders.includes(header));

      if (missingHeaders.length > 0) {
        alert('الملف غير متوافق: تأكد من وجود الأعمدة المطلوبة.');
        return;
      }

      const parsedTemplates: LessonTemplate[] = json.map(row => ({
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // Generate a unique ID
        weekNumber: parseInt(row['رقم الاسبوع']),
        title: row['عنوان الدرس'],
        courseName: row['اسم المقرر'],
        level: row['المستوى'],
        description: '', // Default empty
        estimatedSessions: 1, // Default to 1
        stages: [], // Default empty
        scheduledSections: [], // Default empty
      }));

      if (parsedTemplates.length === 0) {
        alert('الملف لا يحتوي على بيانات قوالب صالحة.');
        return;
      }

      // Confirmation dialog
      const confirmMessage = `هل تريد رفع ${parsedTemplates.length} قوالب؟\n\nمعاينة: ${parsedTemplates.slice(0, 3).map(t => t.title).join(', ')}${parsedTemplates.length > 3 ? '...' : ''}`;
      if (window.confirm(confirmMessage)) {
        try {
          // Step 1: Wait for all upload promises to complete
          const addPromises = parsedTemplates.map(template => {
            const { id, scheduledSections, ...templateToAdd } = template;
            return addTemplate(templateToAdd);
          });
          await Promise.all(addPromises);

          // Step 2: Show success message to the user immediately
          alert(`تم رفع ${parsedTemplates.length} قوالب بنجاح.`);

          // Step 3: Try to refetch the data, but handle failure separately
          try {
            await refetchTemplates();
          } catch (refetchError) {
            console.warn("Upload was successful, but the list could not be automatically refreshed:", refetchError);
            alert("تم رفع القوالب بنجاح، ولكن فشل تحديث القائمة تلقائيًا. قد تحتاج إلى إعادة تحميل الصفحة لرؤية التغييرات.");
          }

        } catch (uploadError) {
          // This block only catches errors from the upload process itself
          console.error('Failed to upload templates:', uploadError);
          alert('فشل في رفع القوالب. يرجى المحاولة مرة أخرى.');
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

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

  const handleSaveLesson = async (updatedLesson: AdaptedLesson) => {
    console.log('LearningAndProgressHub: handleSaveLesson received updatedLesson:', updatedLesson);
    try {
      const { id, lessonTitle, status, stages, notes, estimatedSessions, manualSessionNumber } = updatedLesson;

      const payload: Partial<ScheduledLesson> = {
        customTitle: lessonTitle,
        customDescription: notes?.map(n => `[${new Date(n.timestamp).toLocaleString()}] ${n.text}`).join('\n') || '',
        notes: notes?.map(n => `[${new Date(n.timestamp).toLocaleString()}] ${n.text}`).join('\n') || '',
        stages: stages,
        estimatedSessions: estimatedSessions,
        manualSessionNumber: manualSessionNumber, // Explicitly include
      };

      // The completionStatus in ScheduledLesson is an object mapping sectionId to status
      // The updatedLesson.status is a single overall status.
      // We need to ensure completionStatus is correctly formed.
      if (updatedLesson.assignedSections && updatedLesson.assignedSections.length > 0) {
        payload.completionStatus = {
          [updatedLesson.assignedSections[0]]: status // Assuming the first assigned section is the primary one for status
        };
      } else if (updatedLesson.section) {
        payload.completionStatus = {
          [updatedLesson.section]: status
        };
      }

      await editScheduledLesson(id, payload);
      setEditingLesson(null);
    } catch (error) {
      console.error("Failed to save lesson:", error);
      // Revert optimistic update if save fails, or show error
      // For now, just log and show error
    }
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
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setSelectedTemplate(null);
              setIsTemplateEditModalOpen(true);
            }}
          >
            أضف قالب جديد
          </Button>
          <input
            type="file"
            accept=".xlsx"
            style={{ display: 'none' }}
            id="excel-upload-template-input"
            onChange={handleFileUpload}
          />
          <label htmlFor="excel-upload-template-input">
            <Button
              variant="outlined"
              component="span"
              startIcon={<UploadFileIcon />}
            >
              رفع قوالب Excel
            </Button>
          </label>
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

      <TemplateEditModal
        isOpen={isTemplateEditModalOpen}
        onClose={() => {
          setIsTemplateEditModalOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
      />
    </div>
  );
};

export default LearningAndProgressHub;