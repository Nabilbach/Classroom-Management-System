import React, { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, Event as CalendarEvent, Components, DateCellWrapperProps } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useCurriculum } from '../contexts/CurriculumContext';
import { useSections } from '../contexts/SectionsContext';
import { Lesson } from '../contexts/CurriculumContext';
import LessonModal from './LessonModal';
import { Select, Option, Spinner } from '@material-tailwind/react';

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

const CustomDateCellWrapper: React.FC<DateCellWrapperProps> = ({ children, value }) => {
  const { lessons } = useCurriculum();
  const dailyStats = useMemo(() => {
    const lessonsForDay = lessons.filter(lesson => new Date(lesson.date).toDateString() === value.toDateString());
    if (lessonsForDay.length === 0) {
      return { total: 0, completed: 0, percentage: 0 };
    }
    const completedCount = lessonsForDay.filter(l => getOverallLessonStatus(l) === 'completed').length;
    const percentage = (completedCount / lessonsForDay.length) * 100;
    return { total: lessonsForDay.length, completed: completedCount, percentage };
  }, [lessons, value]);

  return (
    <div className="relative h-full w-full">
      {children}
      {dailyStats.total > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-300 rounded-full overflow-hidden mx-1">
          <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${dailyStats.percentage}%` }}></div>
        </div>
      )}
    </div>
  );
};

const SmartCalendar = () => {
  const { lessons, isLoading } = useCurriculum();
  const { sections } = useSections();
  const [selectedSection, setSelectedSection] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'add' | 'edit'>('add');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const filteredEvents: CustomEvent[] = useMemo(() => {
    const filteredLessons = lessons.filter(lesson => {
      if (selectedSection === 'all') return true;
      return lesson.assignedSections && lesson.assignedSections.includes(selectedSection);
    });

    return filteredLessons.map((lesson) => {
      const lessonDate = lesson.date && !isNaN(new Date(lesson.date).getTime()) ? new Date(lesson.date) : new Date();
      return {
        title: lesson.title,
        start: lessonDate,
        end: lessonDate,
        allDay: true,
        resource: lesson,
      };
    });
  }, [lessons, selectedSection]);

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
    dateCellWrapper: CustomDateCellWrapper,
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
        <div className="mb-4 w-72">
            <Select label="عرض حسب القسم" value={selectedSection} onChange={(val: string) => setSelectedSection(val || 'all')}>
                <Option value="all">عرض الكل</Option>
                {sections.map(section => (
                    <Option key={section.id} value={section.id}>{section.name}</Option>
                ))}
            </Select>
        </div>
        <div className="relative h-[75vh]">
            {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                    <Spinner className="h-12 w-12" />
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