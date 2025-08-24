import { Lesson } from '../components/LessonModal'; // Assuming Lesson interface is defined here

export const calculateCompletionPercentage = (
  lessons: Lesson[],
  sectionId: string
): number => {
  if (!lessons || lessons.length === 0) {
    return 0;
  }

  let completedLessons = 0;
  let totalAssignedLessons = 0;

  lessons.forEach(lesson => {
    if (lesson.assignedSections && lesson.assignedSections.includes(sectionId)) {
      totalAssignedLessons++;
      if (lesson.completionStatus[sectionId] === 'completed') {
        completedLessons++;
      }
    }
  });

  if (totalAssignedLessons === 0) {
    return 0;
  }

  return (completedLessons / totalAssignedLessons) * 100;
};
