import apiClient from './apiClient';

export interface AdminScheduleEntry {
  id: string;
  day: string;
  startTime: string;
  duration: number;
  sectionId?: string;
  subject?: string;
  teacher?: string;
  classroom?: string;
  sessionType?: string;
}

const ADMIN_SCHEDULE_API_PATH = '/api/admin-schedule';

export const fetchAdminSchedule = (): Promise<AdminScheduleEntry[]> => {
  return apiClient.get<AdminScheduleEntry[]>(ADMIN_SCHEDULE_API_PATH);
};

export const addAdminScheduleEntry = (newEntry: Omit<AdminScheduleEntry, 'id'>): Promise<AdminScheduleEntry> => {
  return apiClient.post<AdminScheduleEntry>(ADMIN_SCHEDULE_API_PATH, newEntry);
};

export const updateAdminScheduleEntry = (id: string, updatedData: Partial<AdminScheduleEntry>): Promise<AdminScheduleEntry> => {
  return apiClient.put<AdminScheduleEntry>(`${ADMIN_SCHEDULE_API_PATH}/${id}`, updatedData);
};

export const deleteAdminScheduleEntry = (id: string): Promise<void> => {
  return apiClient.delete<void>(`${ADMIN_SCHEDULE_API_PATH}/${id}`);
};

export const deleteAllAdminScheduleEntries = (): Promise<void> => {
  return apiClient.delete<void>(`${ADMIN_SCHEDULE_API_PATH}/all`);
};
