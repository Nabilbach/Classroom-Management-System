import { LessonStage } from '../services/api/curriculumService';

export interface Attachment {
  name: string;
  url: string;
  fileType: string;
  category: string;
}

// Unified LessonLog interface
export interface LessonLog {
  id: string;
  date: string;
  subject: string; // Mapped from context or default
  section: string; // Mapped from context or default
  lessonTitle: string; // Mapped from form's 'topic'
  stages: LessonStage[]; // Mapped from form's 'objectives'
  activitiesAndTools: string; // Default or optional
  notes: string; // Mapped from form's 'notes'
  attachments: Attachment[]; // Default or optional
  studentNotes?: { studentId: string; note: string }[]; // Default or optional
}

// Type for data collected directly from the form
export interface LessonLogFormData {
  date: string;
  topic: string; // Maps to lessonTitle
  objectives: string; // Maps to lessonStages
  notes: string; // Maps to teacherNotes
}

// Type for adding a new lesson log (API payload)
export type NewLessonLog = Omit<LessonLog, 'id'>;

// New status system
export type LessonStatus = 'planned' | 'in-progress' | 'completed';

// Adapted lesson with enhanced tracking
export interface AdaptedLesson extends LessonLog {
  status: LessonStatus;
  progress: number; // 0-100 percentage
  executionNotes?: string;
  lastUpdated: Date;
  updatedBy: string;
  estimatedSessions: number;
  lessonGroupId?: string; // Added for grouping related lessons
  manualSessionNumber?: number; // Added for manual override
}

// Color mapping for UI
export const statusColors: Record<LessonStatus, string> = {
  'planned': 'bg-blue-100 border-blue-300 text-blue-800',
  'in-progress': 'bg-yellow-100 border-yellow-300 text-yellow-800',
  'completed': 'bg-green-100 border-green-300 text-green-800'
};