import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  CardBody,
  Progress,
  Select,
  Option,
  Button,
  Spinner,
} from "@material-tailwind/react";
import { FaArrowRight } from 'react-icons/fa';
import { useSections, Section } from '../contexts/SectionsContext';
import { curriculumService, Curriculum, CurriculumItem } from '../services/api/curriculumService';

/**
 * @function SectionProgress
 * @description Component to display the progress dashboard for a specific section.
 * It fetches section details and the linked curriculum items.
 * Allows tracking and updating the completion status of each lesson for the section.
 * @returns {JSX.Element} The Section Progress dashboard UI.
 */
function SectionProgress() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const { sections, isLoading: sectionsLoading, editSection } = useSections();
  
  const [currentSection, setCurrentSection] = useState<Section | undefined>(undefined);
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [items, setItems] = useState<CurriculumItem[]>([]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);

  /**
   * @description Effect to find and set the current section based on the URL parameter.
   */
  useEffect(() => {
    if (sections && sectionId) {
      const sec = sections.find(sec => sec.id === sectionId);
      if (sec) {
        let progress = sec.lessonProgress;
        // Ensure lessonProgress is an object
        if (typeof progress === 'string') {
          try {
            progress = JSON.parse(progress);
          } catch (e) {
            console.error('Failed to parse lessonProgress:', e);
            progress = {};
          }
        }
        setCurrentSection({ ...sec, lessonProgress: progress || {} });
      }
    }
  }, [sections, sectionId]);

  /**
   * @description Effect to fetch curriculum details when section is loaded.
   */
  useEffect(() => {
    const fetchCurriculumDetails = async () => {
      if (currentSection?.curriculumId) {
        setLoadingCurriculum(true);
        try {
          const data = await curriculumService.getById(currentSection.curriculumId);
          setCurriculum(data);
          if (data.items) {
            // Sort items by order
            setItems(data.items.sort((a, b) => a.order - b.order));
          }
        } catch (error) {
          console.error("Failed to load curriculum details", error);
        } finally {
          setLoadingCurriculum(false);
        }
      } else {
        setCurriculum(null);
        setItems([]);
      }
    };

    fetchCurriculumDetails();
  }, [currentSection]);

  const isLoading = sectionsLoading || loadingCurriculum;

  /**
   * @description Memoized value to calculate the number of completed lessons for the current section.
   * @returns {number} Count of completed lessons.
   */
  const completedLessonsCount = useMemo(() => {
    if (!currentSection?.lessonProgress || items.length === 0) return 0;
    return items.filter(item =>
      currentSection.lessonProgress?.[item.id!] === 'completed'
    ).length;
  }, [currentSection, items]);

  /**
   * @description Memoized value to calculate the overall progress percentage for the section's course.
   * @returns {number} Progress percentage (0-100).
   */
  const progressPercentage = useMemo(() => {
    if (items.length === 0) return 0;
    return (completedLessonsCount / items.length) * 100;
  }, [completedLessonsCount, items.length]);

  /**
   * @function handleStatusChange
   * @param {number} itemId - The ID of the curriculum item (lesson).
   * @param {'not-started' | 'in-progress' | 'completed'} newStatus - The new status for the lesson.
   * @description Updates the progress status of a lesson for the current section and persists the change to the backend.
   */
  const handleStatusChange = async (itemId: number, newStatus: 'not-started' | 'in-progress' | 'completed') => {
    if (!currentSection) return;

    const updatedLessonProgress = {
      ...(currentSection.lessonProgress || {}),
      [itemId]: newStatus,
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
      <div dir="rtl" className="p-4 bg-gray-50 min-h-screen flex justify-center items-center">
        <Spinner className="h-12 w-12" />
        <Typography variant="h5" color="blue-gray" className="mr-4">جاري تحميل بيانات القسم...</Typography>
      </div>
    );
  }

  if (!currentSection) {
    return (
      <div dir="rtl" className="p-4 bg-gray-50 min-h-screen flex flex-col justify-center items-center gap-4">
        <Typography variant="h5" color="red">القسم غير موجود.</Typography>
        <Button variant="outlined" onClick={() => navigate('/section-management')}>العودة للأقسام</Button>
      </div>
    );
  }

  if (!currentSection.curriculumId) {
    return (
      <div dir="rtl" className="p-4 pr-4 bg-gray-50 min-h-screen flex flex-col justify-center items-center gap-4 text-center">
        <Typography variant="h5" color="blue-gray">هذا القسم غير مرتبط بأي منهاج دراسي.</Typography>
        <Typography variant="paragraph" color="gray">الرجاء ربط القسم بمنهاج من صفحة إدارة الأقسام.</Typography>
        <Button variant="outlined" onClick={() => navigate('/section-management')}>العودة للأقسام</Button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="p-4 pr-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4" color="blue-gray" className="font-bold text-right">
          لوحة تقدم القسم: {currentSection.name}
        </Typography>
        <Button 
          size="sm" 
          variant="outlined" 
          className="flex items-center gap-2"
          onClick={() => navigate('/section-management')}
        >
          العودة للأقسام
          <FaArrowRight />
        </Button>
      </div>

      <Card className="p-4 mb-6">
        <CardBody className="p-0">
          <Typography variant="h6" color="blue-gray" className="mb-2 text-right">
            المنهاج: {curriculum?.title}
          </Typography>
          <div className="flex items-center gap-4 mb-4">
            <Progress value={progressPercentage} size="lg" className="w-full" color="blue" />
            <Typography variant="h6" color="blue-gray">
              {progressPercentage.toFixed(0)}%
            </Typography>
          </div>
          <Typography variant="paragraph" color="gray" className="text-right">
            {completedLessonsCount} من {items.length} درس مكتمل.
          </Typography>
        </CardBody>
      </Card>

      <Card className="p-4">
        <CardBody className="p-0">
          <Typography variant="h6" color="blue-gray" className="mb-4 text-right">
            دروس المنهاج:
          </Typography>
          {
            items.length === 0 ? (
              <Typography className="text-gray-700 text-right">لا توجد دروس في هذا المنهاج.</Typography>
            ) : (
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-100 p-3 rounded-lg shadow-sm">
                    <div className="flex-grow text-right">
                      <Typography variant="h6" color="blue-gray">{item.title}</Typography>
                      <Typography variant="small" color="gray">
                        {item.unitTitle ? `الوحدة: ${item.unitTitle} | ` : ''}
                        حصص تقديرية: {item.estimatedSessions}
                      </Typography>
                    </div>
                    <div className="w-48">
                      <Select
                        label="حالة الدرس"
                        value={currentSection.lessonProgress?.[item.id!] || 'not-started'}
                        onChange={(val) => handleStatusChange(item.id!, val as 'not-started' | 'in-progress' | 'completed')}
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