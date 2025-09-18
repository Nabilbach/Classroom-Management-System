import { LessonLog, AdaptedLesson, LessonStatus } from '../types/lessonLogTypes';
import { ScheduledLesson } from '../services/api/curriculumService';
import { DateTime } from 'luxon';

const calculateInitialStatus = (lesson: { date: string }): LessonStatus => {
  if (!lesson || !lesson.date) {
    return 'planned';
  }
  const lessonDate = DateTime.fromISO(lesson.date);
  const now = DateTime.now();

  if (lessonDate.startOf('day') > now.startOf('day')) {
    return 'planned';
  }
  if (lessonDate.hasSame(now, 'day')) {
    return 'in-progress';
  }
  return 'completed';
};

const calculateInitialProgress = (status: LessonStatus): number => {
  switch (status) {
    case 'completed':
      return 100;
    case 'in-progress':
      return 50;
    case 'planned':
    default:
      return 0;
  }
};

export const migrateLessonToAdapted = (scheduledLesson: ScheduledLesson): AdaptedLesson | null => {
  if (!scheduledLesson) {
    return null;
  }
  // Determine status based on the first section's completion status, or calculate initial
  const firstSectionId = Object.keys(scheduledLesson?.completionStatus || {})[0];
  const status: LessonStatus = firstSectionId ? scheduledLesson.completionStatus[firstSectionId] : calculateInitialStatus(scheduledLesson);
  const progress = calculateInitialProgress(status);

  return {
    id: scheduledLesson.id, // Use string ID directly
    date: scheduledLesson.date,
    subject: scheduledLesson.LessonTemplate?.courseName || 'N/A', // Get subject from template
    section: scheduledLesson.assignedSections.join(', '), // Join assigned sections for display
    lessonTitle: scheduledLesson.customTitle || scheduledLesson.LessonTemplate?.title || 'Untitled Lesson',
    stages: scheduledLesson.stages || [],
    activitiesAndTools: '', // Not directly available in ScheduledLesson
    teacherNotes: scheduledLesson.customDescription || '', // Using customDescription as notes
    attachments: [], // Not directly available in ScheduledLesson
    status,
    progress,
    executionNotes: scheduledLesson.customDescription || '',
    lastUpdated: new Date(),
    updatedBy: 'system',
    estimatedSessions: scheduledLesson.estimatedSessions || 0, // Get estimatedSessions
    lessonGroupId: scheduledLesson.lessonGroupId, // Transfer lessonGroupId
  };
};
