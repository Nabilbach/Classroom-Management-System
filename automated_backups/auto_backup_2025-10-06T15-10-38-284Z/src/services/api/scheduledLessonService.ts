import apiClient from './apiClient';
import { ScheduledLesson as BackendScheduledLesson } from '../../types/lessonLogTypes';

const SCHEDULED_LESSONS_API_PATH = '/api/scheduled-lessons';

// Local fallback storage key
const LS_KEY = 'scheduled_lessons';

function lsRead(): BackendScheduledLesson[] {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? (JSON.parse(raw) as BackendScheduledLesson[]) : [];
    } catch {
        return [];
    }
}

function lsWrite(items: BackendScheduledLesson[]) {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
}

export const fetchScheduledLessons = async (): Promise<BackendScheduledLesson[]> => {
    try {
        return await apiClient.get<BackendScheduledLesson[]>(SCHEDULED_LESSONS_API_PATH);
    } catch (e: any) {
        // Fallback to localStorage on 404 or network error
        console.warn('[scheduledLessonService] Falling back to localStorage for fetch:', e?.message || e);
        return lsRead();
    }
};

export const addScheduledLesson = async (
    newLesson: Omit<BackendScheduledLesson, 'id' | 'LessonTemplate'>
): Promise<BackendScheduledLesson> => {
    try {
        return await apiClient.post<BackendScheduledLesson>(SCHEDULED_LESSONS_API_PATH, newLesson);
    } catch (e: any) {
        console.warn('[scheduledLessonService] Falling back to localStorage for add:', e?.message || e);
        const items = lsRead();
        const id = Date.now().toString();
        const created: BackendScheduledLesson = { id, ...(newLesson as any) };
        items.push(created);
        lsWrite(items);
        return created;
    }
};

export const updateScheduledLesson = async (
    id: string,
    updatedLesson: Partial<BackendScheduledLesson>
): Promise<BackendScheduledLesson> => {
    try {
        return await apiClient.put<BackendScheduledLesson>(`${SCHEDULED_LESSONS_API_PATH}/${id}`, updatedLesson);
    } catch (e: any) {
        console.warn('[scheduledLessonService] Falling back to localStorage for update:', e?.message || e);
        const items = lsRead();
        const idx = items.findIndex(i => String(i.id) === String(id));
        if (idx !== -1) {
            items[idx] = { ...items[idx], ...updatedLesson } as BackendScheduledLesson;
            lsWrite(items);
            return items[idx];
        }
        // If not found locally, upsert
        const upserted = { id, ...(updatedLesson as any) } as BackendScheduledLesson;
        items.push(upserted);
        lsWrite(items);
        return upserted;
    }
};

export const deleteScheduledLesson = async (id: string): Promise<void> => {
    try {
        await apiClient.delete<void>(`${SCHEDULED_LESSONS_API_PATH}/${id}`);
    } catch (e: any) {
        console.warn('[scheduledLessonService] Falling back to localStorage for delete:', e?.message || e);
        const items = lsRead().filter(i => String(i.id) !== String(id));
        lsWrite(items);
    }
};