import { AdaptedLesson, LessonStatus, ScheduledLesson } from '../types/lessonLogTypes';

const calculateInitialStatus = (lesson: { date: string }): LessonStatus => {
  if (!lesson || !lesson.date) return 'planned';
  const lessonDate = new Date(lesson.date);
  const now = new Date();

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const l = startOfDay(lessonDate).getTime();
  const n = startOfDay(now).getTime();
  if (l > n) return 'planned';
  if (l === n) return 'in-progress';
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

  // Parse notes from the stored text format back to array format
  const parseNotesFromText = (notesText?: string): Array<{ text: string; timestamp: string }> => {
    if (!notesText) return [];
    
    console.log('🔍 [Migration] Parsing notes from text:', notesText);
    
    // Split by lines and parse each line that matches the format [timestamp] text
    const parsedNotes = notesText.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const match = line.match(/^\[(.+?)\] (.+)$/);
        if (match) {
          return {
            timestamp: new Date(match[1]).toISOString(),
            text: match[2]
          };
        }
        // Fallback for notes without timestamp format
        return {
          timestamp: new Date().toISOString(),
          text: line.trim()
        };
      });
    
    console.log('✅ [Migration] Parsed notes:', parsedNotes);
    return parsedNotes;
  };

  const adapted: AdaptedLesson = {
    id: scheduledLesson.id,
    date: scheduledLesson.date,
    subject: scheduledLesson.subject || 'N/A',
    lessonTitle: scheduledLesson.customTitle || 'Untitled Lesson',
    stages: scheduledLesson.stages || [],
    status,
    progress,
    estimatedSessions: scheduledLesson.estimatedSessions || 0,
    manualSessionNumber: scheduledLesson.manualSessionNumber,
    lessonGroupId: scheduledLesson.lessonGroupId,
    notes: parseNotesFromText(scheduledLesson.notes), // Add notes parsing
  };

  return adapted;
};
