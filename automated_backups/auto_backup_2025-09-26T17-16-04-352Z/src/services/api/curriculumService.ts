import { Lesson } from '../contexts/CurriculumContext'; // Import Lesson interface from CurriculumContext

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const LESSONS_ENDPOINT = `${API_BASE_URL}/api/lessons`;

// Helper for handling responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Something went wrong');
  }
  return response.json();
};

export const fetchLessons = async (): Promise<Lesson[]> => {
  const response = await fetch(LESSONS_ENDPOINT);
  return handleResponse<Lesson[]>(response);
};

export const createLesson = async (lessonData: Omit<Lesson, 'id'>): Promise<Lesson> => { // Changed Omit to only 'id'
  const response = await fetch(LESSONS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(lessonData),
  });
  return handleResponse<Lesson>(response);
};

export const updateLesson = async (lessonId: string, lessonData: Partial<Lesson>): Promise<Lesson> => {
  const response = await fetch(`${LESSONS_ENDPOINT}/${lessonId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(lessonData),
  });
  return handleResponse<Lesson>(response);
};

export const deleteLesson = async (lessonId: string): Promise<void> => {
  const response = await fetch(`${LESSONS_ENDPOINT}/${lessonId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Something went wrong');
  }
  // No content for successful delete
};
