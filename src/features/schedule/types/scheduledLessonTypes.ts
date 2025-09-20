import type { LessonStage } from '../curriculum/types/curriculumTypes';

export interface ScheduledLesson {
  id: string;
  templateId?: string;
  date: string;
  startTime: string;
  assignedSections: string[];
  completionStatus: { [sectionId: string]: 'planned' | 'in-progress' | 'completed' };
  customTitle?: string;
  customDescription?: string;
  stages: LessonStage[];
  estimatedSessions: number;
  manualSessionNumber?: number;
  lessonGroupId?: string;
  notes?: string;
  subject?: string;
  progress: number;
}

export interface AdaptedLesson {
  id: string;
  lessonTitle: string;
  subject?: string;
  status: 'planned' | 'in-progress' | 'completed';
  stages: LessonStage[];
  progress: number;
  estimatedSessions: number;
  date: string;
  manualSessionNumber?: number;
  lessonGroupId?: string;
  notes?: { timestamp: string; text: string; }[];
}