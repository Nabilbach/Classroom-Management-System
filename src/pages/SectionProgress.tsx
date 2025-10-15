import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  Card,
  CardBody,
  Progress,
  Select,
  Option,
  Button,
} from "@material-tailwind/react";
import { useSections } from '../contexts/SectionsContext';
import { useCurriculum } from '../contexts/CurriculumContext';
import { Lesson } from '../contexts/CurriculumContext';

/**
 * @function SectionProgress
 * @description Component to display the progress dashboard for a specific section.
 * It fetches section details and filters lessons based on the section's assigned course.
 * Allows tracking and updating the completion status of each lesson for the section.
 * @returns {JSX.Element} The Section Progress dashboard UI.
 */
function SectionProgress() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const { sections, isLoading: sectionsLoading, editSection } = useSections();
  const { lessons, isLoading: lessonsLoading } = useCurriculum();

  const [currentSection, setCurrentSection] = useState<Section | undefined>(undefined);

  /**
   * @description Effect to find and set the current section based on the URL parameter.
   */
  useEffect(() => {
    if (sections && sectionId) {
      setCurrentSection(sections.find(sec => sec.id === sectionId));
    }
  }, [sections, sectionId]);

  const isLoading = sectionsLoading || lessonsLoading;

  /**
   * @description Memoized value to filter lessons that belong to the current section's course.
   * @returns {Lesson[]} Array of lessons relevant to the section's course.
   */
  const courseLessons = useMemo(() => {
    if (!currentSection?.courseName || !lessons) return [];
    return lessons.filter(lesson => lesson.courseName === currentSection.courseName);
  }, [currentSection, lessons]);

  /**
   * @description Memoized value to calculate the number of completed lessons for the current section.
   * @returns {number} Count of completed lessons.
   */
  const completedLessonsCount = useMemo(() => {
    if (!currentSection?.lessonProgress) return 0;
    return courseLessons.filter(lesson =>
      currentSection.lessonProgress?.[lesson.id] === 'completed'
    ).length;
  }, [currentSection, courseLessons]);

  /**
   * @description Memoized value to calculate the overall progress percentage for the section's course.
   * @returns {number} Progress percentage (0-100).
   */
  const progressPercentage = useMemo(() => {
    if (courseLessons.length === 0) return 0;
    return (completedLessonsCount / courseLessons.length) * 100;
  }, [completedLessonsCount, courseLessons.length]);

  /**
   * @function handleStatusChange
   * @param {string} lessonId - The ID of the lesson whose status is being changed.
   * @param {'not-started' | 'in-progress' | 'completed'} newStatus - The new status for the lesson.
   * @description Updates the progress status of a lesson for the current section and persists the change to the backend.
   */
  const handleStatusChange = async (lessonId: string, newStatus: 'not-started' | 'in-progress' | 'completed') => {
    if (!currentSection) return;

    const updatedLessonProgress = {
      ...(currentSection.lessonProgress || {}),
      [lessonId]: newStatus,
    };

    const updatedSection = {
      ...currentSection,
      lessonProgress: updatedLessonProgress,
    };

    // Call editSection from context to persist the change
    await editSection(currentSection.id, updatedSection);

    // Update local state after successful persistence
    setCurrentSection(updatedSection);
  };

  if (isLoading) {
    return (
      <div dir="rtl" className="p-4 bg-gray-50 min-h-screen text-center">
        <Typography variant="h5" color="blue-gray">جاري تحميل بيانات القسم...</Typography>
      </div>
    );
  }

  if (!currentSection) {
    return (
      <div dir="rtl" className="p-4 bg-gray-50 min-h-screen text-center">
        <Typography variant="h5" color="red">القسم غير موجود.</Typography>
      </div>
    );
  }

  if (!currentSection.courseName) {
    return (
      <div dir="rtl" className="p-4 pr-4 bg-gray-50 min-h-screen text-center">
        <Typography variant="h5" color="blue-gray">هذا القسم غير مرتبط بأي مقرر دراسي.</Typography>
        <Typography variant="paragraph" color="gray">الرجاء تعيين مقرر دراسي لهذا القسم من صفحة إدارة الأقسام.</Typography>
      </div>
    );
  }

  return (
    <div dir="rtl" className="p-4 pr-4 bg-gray-50 min-h-screen">
      <Typography variant="h4" color="blue-gray" className="mb-6 font-bold text-right">
        لوحة تقدم القسم: {currentSection.name}
      </Typography>

      <Card className="p-4 mb-6">
        <CardBody className="p-0">
          <Typography variant="h6" color="blue-gray" className="mb-2 text-right">
            المقرر الدراسي: {currentSection.courseName}
          </Typography>
          <div className="flex items-center gap-4 mb-4">
            <Progress value={progressPercentage} size="lg" className="w-full" />
            <Typography variant="h6" color="blue-gray">
              {progressPercentage.toFixed(0)}%
            </Typography>
          </div>
          <Typography variant="paragraph" color="gray" className="text-right">
            {completedLessonsCount} من {courseLessons.length} درس مكتمل.
          </Typography>
        </CardBody>
      </Card>

      <Card className="p-4">
        <CardBody className="p-0">
          <Typography variant="h6" color="blue-gray" className="mb-4 text-right">
            دروس المقرر:
          </Typography>
          {
            courseLessons.length === 0 ? (
              <Typography className="text-gray-700 text-right">لا توجد دروس لهذا المقرر.</Typography>
            ) : (
              <div className="space-y-4">
                {courseLessons.map(lesson => (
                  <div key={lesson.id} className="flex items-center justify-between bg-gray-100 p-3 rounded-lg shadow-sm">
                    <div className="flex-grow text-right">
                      <Typography variant="h6" color="blue-gray">{lesson.title}</Typography>
                      <Typography variant="small" color="gray">حصص تقديرية: {lesson.estimatedSessions}</Typography>
                    </div>
                    <div className="w-48">
                      <Select
                        label="حالة الدرس"
                        value={currentSection.lessonProgress?.[lesson.id] || 'not-started'}
                        onChange={(val: 'not-started' | 'in-progress' | 'completed') => handleStatusChange(lesson.id, val)}
                      >
                        <Option value="not-started">لم يبدأ</Option>
                        <Option value="in-progress">قيد الإنجاز</Option>
                        <Option value="completed">مكتمل</Option>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </CardBody>
      </Card>
    </div>
  );
}

export default SectionProgress;