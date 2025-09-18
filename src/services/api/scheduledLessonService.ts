import apiClient from './apiClient';
import { ScheduledLesson as BackendScheduledLesson, LessonStage } from './curriculumService'; // Import the correct ScheduledLesson

const SCHEDULED_LESSONS_API_PATH = '/api/scheduled-lessons';

export const fetchScheduledLessons = (): Promise<BackendScheduledLesson[]> => {
  return apiClient.get<BackendScheduledLesson[]>(SCHEDULED_LESSONS_API_PATH);
};

export const addScheduledLesson = (newLesson: Omit<BackendScheduledLesson, 'id' | 'LessonTemplate'>): Promise<BackendScheduledLesson> => {
    return apiClient.post<BackendScheduledLesson>(SCHEDULED_LESSONS_API_PATH, newLesson);
};

export const updateScheduledLesson = (id: string, updatedLesson: Partial<BackendScheduledLesson>): Promise<BackendScheduledLesson> => {
    return apiClient.put<BackendScheduledLesson>(`${SCHEDULED_LESSONS_API_PATH}/${id}`, updatedLesson);
};

export const deleteScheduledLesson = (id: string): Promise<void> => {
    return apiClient.delete<void>(`${SCHEDULED_LESSONS_API_PATH}/${id}`);
};