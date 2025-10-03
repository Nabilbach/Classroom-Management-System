import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Event as CalendarEvent, Components, DateCellWrapperProps } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useCurriculum } from '../contexts/CurriculumContext';
import { useSections } from '../contexts/SectionsContext';
import { Lesson } from '../contexts/CurriculumContext';
import LessonModal from './LessonModal';
import { CircularProgress } from '@mui/material';
import { fetchAdminSchedule, AdminScheduleEntry } from '../services/api/adminScheduleService';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CustomEvent extends CalendarEvent {
  resource: Lesson;
}

const getOverallLessonStatus = (lesson: Lesson): 'planned' | 'in-progress' | 'completed' => {
  if (!lesson.stages || lesson.stages.length === 0) {
    return 'planned';
  }
  const completedCount = lesson.stages.filter(stage => stage.isCompleted).length;
  if (completedCount === 0) {
    return 'planned';
  }
  if (completedCount === lesson.stages.length) {
    return 'completed';
  }
  return 'in-progress';
};

const getStatusClassName = (status: 'planned' | 'in-progress' | 'completed') => {
  switch (status) {
    case 'completed':
      return 'bg-green-200 text-green-800 border-green-400';
    case 'in-progress':
      return 'bg-amber-200 text-amber-800 border-amber-400';
    case 'planned':
    default:
      return 'bg-gray-200 text-gray-800 border-gray-400';
  }
};

interface CustomDateCellWrapperProps {
  children: React.ReactNode;
  value: Date;
  adminSchedule: AdminScheduleEntry[];
  sections: any[];
}

const CustomDateCellWrapper: React.FC<CustomDateCellWrapperProps> = ({ children, value, adminSchedule, sections }) => {
  // تحديد الأقسام التي تدرس في هذا اليوم
  const sectionsForThisDay = useMemo(() => {
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayName = dayNames[value.getDay()];
    
    // البحث عن جميع الأقسام التي تدرس في هذا اليوم
    const sectionsScheduled = adminSchedule
      .filter(entry => entry.day === dayName)
      .map(entry => entry.sectionId)
      .filter((id, index, self) => self.indexOf(id) === index); // إزالة التكرار

    return sectionsScheduled;
  }, [value, adminSchedule]);

  // تحديد لون الخلفية بناءً على عدد الأقسام
  const backgroundColor = useMemo(() => {
    if (sectionsForThisDay.length === 0) return undefined;
    
    // ألوان مختلفة للأقسام
    const sectionColors = [
      '#3b82f6', // أزرق
      '#10b981', // أخضر
      '#f59e0b', // أصفر
      '#ef4444', // أحمر
      '#8b5cf6', // بنفسجي
      '#06b6d4', // سماوي
      '#f97316', // برتقالي
      '#84cc16', // أخضر فاتح
    ];
    
    // إذا كان هناك أكثر من قسم واحد، استخدم لون مختلط
    if (sectionsForThisDay.length > 1) {
      return '#9ca3af'; // رمادي للأيام المختلطة
    }
    
    // إذا كان قسم واحد فقط، استخدم لونه المحدد
    const sectionIndex = sections.findIndex(s => s.id === sectionsForThisDay[0]);
    return sectionIndex >= 0 ? sectionColors[sectionIndex % sectionColors.length] : '#3b82f6';
  }, [sectionsForThisDay, sections]);

  return (
    <div 
      className="relative h-full w-full" 
      style={{
        backgroundColor: backgroundColor,
      }}
    >
      {children}
    </div>
  );
};

const SmartCalendar = () => {
  const { lessons, isLoading } = useCurriculum();
  const { sections } = useSections();
  const [adminSchedule, setAdminSchedule] = useState<AdminScheduleEntry[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'add' | 'edit'>('add');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

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

  const filteredEvents: CustomEvent[] = useMemo(() => {
    return lessons.map((lesson) => {
      const lessonDate = lesson.date && !isNaN(new Date(lesson.date).getTime()) ? new Date(lesson.date) : new Date();
      return {
        title: lesson.title,
        start: lessonDate,
        end: lessonDate,
        allDay: true,
        resource: lesson,
      };
    });
  }, [lessons]);

  const handleSelectEvent = (event: CustomEvent) => {
    setSelectedLesson(event.resource);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setIsModalOpen(true);
    setModalMode('add');
    setSelectedLesson(undefined);
    setSelectedDate(start);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLesson(undefined);
    setSelectedDate(undefined);
  };

  const eventPropGetter = (event: CustomEvent) => {
    const status = getOverallLessonStatus(event.resource);
    const className = getStatusClassName(status);
    return { className };
  };

  const components: Components<CustomEvent, object> = {
    dateCellWrapper: (props: DateCellWrapperProps) => (
      <CustomDateCellWrapper 
        {...props} 
        adminSchedule={adminSchedule}
        sections={sections}
      />
    ),
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative h-[75vh]">
            {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                    <CircularProgress />
                </div>
            )}
            <Calendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                selectable
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                eventPropGetter={eventPropGetter}
                components={components}
            />
        </div>
      <LessonModal
        isOpen={isModalOpen}
        onClose={closeModal}
        mode={modalMode}
        lesson={selectedLesson}
        initialDate={selectedDate}
      />
    </div>
  );
};

export default SmartCalendar;