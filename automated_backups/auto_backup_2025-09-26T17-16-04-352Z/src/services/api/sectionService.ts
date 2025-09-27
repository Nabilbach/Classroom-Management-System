import { Section } from '../contexts/SectionsContext'; // Import Section interface

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const SECTIONS_ENDPOINT = `${API_BASE_URL}/api/sections`;

// Helper for handling responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Something went wrong');
  }
  return response.json();
};

export const fetchSections = async (): Promise<Section[]> => {
  const response = await fetch(SECTIONS_ENDPOINT);
  return handleResponse<Section[]>(response);
};

export const createSection = async (sectionData: Omit<Section, 'id'>): Promise<Section> => {
  const response = await fetch(SECTIONS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sectionData),
  });
  return handleResponse<Section>(response);
};

export const updateSection = async (sectionId: string, sectionData: Partial<Section>): Promise<Section> => {
  const response = await fetch(`${SECTIONS_ENDPOINT}/${sectionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sectionData),
  });
  return handleResponse<Section>(response);
};

export const deleteSection = async (sectionId: string): Promise<void> => {
  const response = await fetch(`${SECTIONS_ENDPOINT}/${sectionId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Something went wrong');
  }
  // No content for successful delete
};

export const deleteAllSectionsAPI = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/sections/all`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Something went wrong');
  }
  // No content for successful delete
};
