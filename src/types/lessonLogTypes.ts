// New status system
export type LessonStatus = 'planned' | 'in-progress' | 'completed';

// Stage inside a lesson/template
export interface LessonStage {
  id: string;
  title: string;
  isCompleted: boolean;
  completionDate?: string;
  isCore?: boolean; // المراحل الرئيسية من القالب
  templateStageId?: string; // ربط بالمرحلة في القالب الأصلي
}

export interface Attachment {
  name: string;
  url: string;
  fileType: string;
  category: string;
}

// Unified LessonLog interface (generic log record)
export interface LessonLog {
  id: string;
  date: string;
  subject: string; // e.g., courseName
  section: string; // section id or label
  lessonTitle: string;
  stages: LessonStage[];
  activitiesAndTools: string;
  teacherNotes?: string;
  attachments: Attachment[];
  studentNotes?: { studentId: string; note: string }[];
}

// Type for data collected directly from the form
export interface LessonLogFormData {
  date: string;
  topic: string; // Maps to lessonTitle
  objectives: string; // Maps to stages (parsed)
  notes: string; // Maps to teacherNotes
}

// Type for adding a new lesson log (API payload)
export type NewLessonLog = Omit<LessonLog, 'id'>;

// Re-export ScheduledLesson and AdaptedLesson from the schedule types to keep imports stable
export type { ScheduledLesson, AdaptedLesson } from '../features/schedule/types/scheduledLessonTypes';