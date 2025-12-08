import axios from 'axios';

const API_URL = 'http://localhost:4200/api/curriculums';

export interface CurriculumItem {
  id?: number;
  curriculumId: number;
  title: string;
  order: number;
  unitTitle?: string;
  estimatedSessions?: number;
  linkedTemplateId?: number;
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface Curriculum {
  id?: number;
  title: string;
  subject: string;
  educationalLevel: string;
  description?: string;
  items?: CurriculumItem[];
}

export const curriculumService = {
  getAll: async () => {
    const response = await axios.get<Curriculum[]>(API_URL);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await axios.get<Curriculum>(`${API_URL}/${id}`);
    return response.data;
  },

  create: async (data: Curriculum) => {
    const response = await axios.post<Curriculum>(API_URL, data);
    return response.data;
  },

  addItem: async (curriculumId: number, item: Omit<CurriculumItem, 'curriculumId'>) => {
    const response = await axios.post<CurriculumItem>(`${API_URL}/${curriculumId}/items`, item);
    return response.data;
  },

  addItemsBulk: async (curriculumId: number, items: Omit<CurriculumItem, 'curriculumId'>[]) => {
    const response = await axios.post<CurriculumItem[]>(`${API_URL}/${curriculumId}/items/bulk`, { items });
    return response.data;
  },

  updateItem: async (itemId: number, data: Partial<CurriculumItem>) => {
    const response = await axios.put<CurriculumItem>(`${API_URL}/items/${itemId}`, data);
    return response.data;
  },

  deleteItem: async (itemId: number) => {
    await axios.delete(`${API_URL}/items/${itemId}`);
  },

  deleteCurriculum: async (id: number) => {
    await axios.delete(`${API_URL}/${id}`);
  }
};
