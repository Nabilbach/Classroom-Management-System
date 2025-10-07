import type { LessonStage } from '../../types/lessonLogTypes';

// Local storage key for templates
const LS_KEY = 'lessonTemplates';

export interface LessonTemplate {
  id: string;
  title: string;
  description: string;
  estimatedSessions: number;
  stages: LessonStage[];
  courseName: string; // subject
  level: string; // e.g., '1BAC', '2BAC'
  weekNumber?: number;
  scheduledSections?: string[];
}

const seedTemplates: LessonTemplate[] = [
  {
    id: 'seed-1',
    title: 'الإيمان بالغيب',
    description: 'مفاهيم أساسية حول الإيمان بالغيب',
    estimatedSessions: 1,
    stages: [
      { id: 's-1', title: 'تمهيد', isCompleted: false },
      { id: 's-2', title: 'عرض', isCompleted: false },
      { id: 's-3', title: 'تقويم', isCompleted: false },
    ],
    courseName: 'التربية الإسلامية',
    level: 'الجذع المشترك',
    weekNumber: 1,
    scheduledSections: [],
  },
];

const loadFromLS = (): LessonTemplate[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return seedTemplates;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return seedTemplates;
  } catch {
    return seedTemplates;
  }
};

const saveToLS = (data: LessonTemplate[]) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

export const fetchLessonTemplates = async (): Promise<LessonTemplate[]> => {
  return loadFromLS();
};

export const addLessonTemplate = async (template: Omit<LessonTemplate, 'id'>): Promise<LessonTemplate> => {
  const all = loadFromLS();
  const newT: LessonTemplate = { ...template, id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
  all.push(newT);
  saveToLS(all);
  return newT;
};

export const updateLessonTemplate = async (id: string, patch: Partial<LessonTemplate>): Promise<LessonTemplate> => {
  const all = loadFromLS();
  const idx = all.findIndex(t => t.id === id);
  if (idx === -1) throw new Error('Template not found');
  const updated = { ...all[idx], ...patch };
  all[idx] = updated;
  saveToLS(all);
  return updated;
};

export const deleteLessonTemplate = async (id: string): Promise<void> => {
  const all = loadFromLS().filter(t => t.id !== id);
  saveToLS(all);
};

export const deleteTemplatesByCourse = async (courseName: string): Promise<void> => {
  const all = loadFromLS().filter(t => t.courseName !== courseName);
  saveToLS(all);
};
