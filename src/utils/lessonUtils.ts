import { Lesson } from '../contexts/CurriculumContext';
import { format, addMinutes } from 'date-fns';

const TIME_SLOT_DURATION_MINUTES = 60;

/**
 * Creates a new lesson instance from a template lesson.
 *
 * @param templateLesson The lesson to use as a template.
 * @param sectionId The ID of the section to assign the new lesson to.
 * @param date The date for the new lesson instance.
 * @returns A new lesson object configured as an instance.
 */
export const createLessonInstanceFromTemplate = (
  templateLesson: Lesson,
  sectionId: string,
  date: string
): Omit<Lesson, 'id'> => {
  // Destructure to explicitly pick fields and avoid copying the template's id
  const { 
    id,
    assignedSections,
    completionStatus,
    date: templateDate,
    isInBank: templateIsInBank,
    ...restOfTemplate 
  } = templateLesson;

  return {
    ...restOfTemplate, // Copy all other relevant fields (title, objectives, stages, etc.)
    isInBank: false, // It's an instance, not a template in the bank
    assignedSectionId: sectionId, // Assign to the specific section
    lessonTemplateId: id, // Link back to the template
    date: date, // Set the new date for this instance
    assignedSections: [], // Old field, cleared for safety
    completionStatus: {}, // Will be populated by the backend
  };
};

export const getSessionEndTime = (startTime: string, duration: number) => {
  if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) {
    console.error('Invalid startTime format passed to getSessionEndTime:', startTime);
    return '00:00';
  }
  const [hours, minutes] = startTime.split(':').map(Number);
  const referenceDate = new Date(2000, 0, 1);
  referenceDate.setHours(hours, minutes, 0, 0);
  const end = addMinutes(referenceDate, duration * TIME_SLOT_DURATION_MINUTES);
  return format(end, 'HH:mm');
};