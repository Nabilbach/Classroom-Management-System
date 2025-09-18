import { LessonLogFormData, NewLessonLog } from '../types/lessonLogTypes';

export const formToApi = (formData: LessonLogFormData): NewLessonLog => {
  // For simplicity, subject and section are hardcoded or derived from context in a real app.
  // activitiesAndTools, attachments, studentNotes are not collected by the form.
  // They will be empty or default values.
  return {
    date: formData.date,
    subject: 'التربية الإسلامية', // Default subject, or derive from context
    section: 'غير محدد', // Default section, or derive from context
    lessonTitle: formData.topic,
    lessonStages: formData.objectives, // Mapping objectives string to lessonStages string
    activitiesAndTools: '', // Not collected by form
    teacherNotes: formData.notes,
    attachments: [], // Not collected by form
    // studentNotes is optional and not collected by form
  };
};
