const API_BASE_URL = 'http://localhost:3000/api';

export interface LessonLog {
  id: string;
  date: string;
  topic: string;
  objectives: string;
  notes: string;
}

export const fetchLessonLogs = async (): Promise<LessonLog[]> => {
  const response = await fetch(`${API_BASE_URL}/lesson-logs`);
  if (!response.ok) {
    throw new Error('Failed to fetch lesson logs');
  }
  return response.json();
};

export const createLessonLog = async (log: Omit<LessonLog, 'id'>): Promise<LessonLog> => {
  const response = await fetch(`${API_BASE_URL}/lesson-logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(log),
  });
  if (!response.ok) {
    throw new Error('Failed to create lesson log');
  }
  return response.json();
};

export const updateLessonLog = async (id: string, updatedData: Partial<LessonLog>): Promise<LessonLog> => {
  const response = await fetch(`${API_BASE_URL}/lesson-logs/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedData),
  });
  if (!response.ok) {
    throw new Error('Failed to update lesson log');
  }
  return response.json();
};

export const deleteLessonLog = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/lesson-logs/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete lesson log');
  }
};
