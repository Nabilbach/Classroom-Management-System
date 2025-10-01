import { useState, useEffect } from 'react';
import CurrentLessonService, { CurrentLessonInfo } from '../services/CurrentLessonService';
import { useSections } from '../contexts/SectionsContext';

export const useCurrentLesson = () => {
  const [currentLessonInfo, setCurrentLessonInfo] = useState<CurrentLessonInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { sections } = useSections();

  useEffect(() => {
    const fetchCurrentLesson = async () => {
      if (sections.length === 0) return; // انتظار تحميل الأقسام
      
      try {
        setIsLoading(true);
        const service = CurrentLessonService.getInstance();
        const info = await service.getCurrentLessonInfo();
        
        // إذا لم يجد قسم مقترح، استخدم أول قسم
        if (!info.recommendedSectionId && sections.length > 0) {
          info.recommendedSectionId = sections[0].id;
          info.displayMessage = `📝 القسم الافتراضي - ${sections[0].name}`;
        }
        
        setCurrentLessonInfo(info);
      } catch (error) {
        console.error('خطأ في جلب معلومات الحصة:', error);
        // استخدام القسم الأول كافتراضي في حالة الخطأ
        if (sections.length > 0) {
          setCurrentLessonInfo({
            currentTime: new Date().toTimeString().slice(0, 5),
      currentDay: ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][new Date().getDay()],
            isTeachingTime: false,
            recommendedSectionId: sections[0].id,
            displayMessage: `📝 القسم الافتراضي - ${sections[0].name}`
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentLesson();

    // تحديث تلقائي كل دقيقة
    const service = CurrentLessonService.getInstance();
    const unsubscribe = service.subscribeToUpdates((info) => {
      setCurrentLessonInfo(info);
    }, 60000);

    return unsubscribe;
  }, [sections]);

  return {
    currentLessonInfo,
    isLoading,
    recommendedSectionId: currentLessonInfo?.recommendedSectionId || '',
    displayMessage: currentLessonInfo?.displayMessage || '⏰ يتم التحديث...',
    isTeachingTime: currentLessonInfo?.isTeachingTime || false
  };
};