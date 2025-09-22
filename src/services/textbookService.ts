
 * خدمة API لدفتر النصوص
 */

import { TextbookEntry, TextbookFilter, TextbookStats } from '../types/textbookTypes';

const API_BASE_URL = 'http://localhost:3000/api/textbook';

class TextbookService {
  
  /**
   * الحصول على جميع سجلات دفتر النصوص مع الفلترة
   */
  async getTextbookEntries(filter?: TextbookFilter): Promise<TextbookEntry[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filter?.sectionId) {
        queryParams.append('sectionId', filter.sectionId);
      }
      if (filter?.dateFrom) {
        queryParams.append('dateFrom', filter.dateFrom);
      }
      if (filter?.dateTo) {
        queryParams.append('dateTo', filter.dateTo);
      }
      if (filter?.teacherSignature) {
        queryParams.append('teacherSignature', filter.teacherSignature);
      }

      const url = `${API_BASE_URL}?${queryParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`خطأ في الحصول على سجلات دفتر النصوص: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('خطأ في جلب سجلات دفتر النصوص:', error);
      throw error;
    }
  }

  /**
   * الحصول على سجل واحد بالمعرف
   */
  async getTextbookEntry(id: string): Promise<TextbookEntry> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`);
      
      if (!response.ok) {
        throw new Error(`خطأ في الحصول على سجل دفتر النصوص: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('خطأ في جلب سجل دفتر النصوص:', error);
      throw error;
    }
  }

  /**
   * إنشاء سجل جديد لدفتر النصوص
   */
  async createTextbookEntry(entry: Omit<TextbookEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<TextbookEntry> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error(`خطأ في إنشاء سجل دفتر النصوص: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('خطأ في إنشاء سجل دفتر النصوص:', error);
      throw error;
    }
  }

  /**
   * تحديث سجل دفتر النصوص
   */
  async updateTextbookEntry(id: string, updates: Partial<TextbookEntry>): Promise<TextbookEntry> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`خطأ في تحديث سجل دفتر النصوص: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('خطأ في تحديث سجل دفتر النصوص:', error);
      throw error;
    }
  }

  /**
   * حذف سجل دفتر النصوص
   */
  async deleteTextbookEntry(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`خطأ في حذف سجل دفتر النصوص: ${response.statusText}`);
      }
    } catch (error) {
      console.error('خطأ في حذف سجل دفتر النصوص:', error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات دفتر النصوص
   */
  async getTextbookStats(filter?: Pick<TextbookFilter, 'sectionId' | 'dateFrom' | 'dateTo'>): Promise<TextbookStats> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filter?.sectionId) {
        queryParams.append('sectionId', filter.sectionId);
      }
      if (filter?.dateFrom) {
        queryParams.append('dateFrom', filter.dateFrom);
      }
      if (filter?.dateTo) {
        queryParams.append('dateTo', filter.dateTo);
      }

      const url = `${API_BASE_URL}/stats/summary?${queryParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`خطأ في الحصول على إحصائيات دفتر النصوص: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('خطأ في جلب إحصائيات دفتر النصوص:', error);
      throw error;
    }
  }

  /**
   * توليد سجلات دفتر النصوص لفترة معينة
   */
  async generateEntriesForPeriod(startDate: string, endDate: string): Promise<{ message: string; count: number; entries: TextbookEntry[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate/period`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startDate, endDate }),
      });

      if (!response.ok) {
        throw new Error(`خطأ في توليد سجلات دفتر النصوص: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('خطأ في توليد سجلات دفتر النصوص للفترة:', error);
      throw error;
    }
  }

  /**
   * توليد سجلات دفتر النصوص لقسم معين
   */
  async generateEntriesForSection(sectionId: string, startDate: string, endDate: string): Promise<{ message: string; count: number; entries: TextbookEntry[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate/section`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sectionId, startDate, endDate }),
      });

      if (!response.ok) {
        throw new Error(`خطأ في توليد سجلات دفتر النصوص للقسم: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('خطأ في توليد سجلات دفتر النصوص للقسم:', error);
      throw error;
    }
  }

  /**
   * توليد سجل من حصة معينة
   */
  async generateEntryFromLesson(lessonId: string, sectionId: string): Promise<{ message: string; entry: TextbookEntry }> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate/lesson`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lessonId, sectionId }),
      });

      if (!response.ok) {
        throw new Error(`خطأ في توليد سجل من الحصة: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('خطأ في توليد سجل من الحصة:', error);
      throw error;
    }
  }

  /**
   * تشغيل التوليد التلقائي
   */
  async runAutoGeneration(days: number = 7): Promise<{ message: string; count: number; period: { startDate: string; endDate: string } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate/auto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days }),
      });

      if (!response.ok) {
        throw new Error(`خطأ في تشغيل التوليد التلقائي: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('خطأ في تشغيل التوليد التلقائي:', error);
      throw error;
    }
  }

  /**
   * الحصول على حالة المجدول
   */
  async getSchedulerStatus(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/scheduler/status`);
      
      if (!response.ok) {
        throw new Error(`خطأ في الحصول على حالة المجدول: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('خطأ في جلب حالة المجدول:', error);
      throw error;
    }
  }

  /**
   * تشغيل فوري للمجدول
   */
  async runImmediateGeneration(days: number = 1): Promise<{ message: string; count: number; entries: TextbookEntry[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/scheduler/run-immediate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days }),
      });

      if (!response.ok) {
        throw new Error(`خطأ في التوليد الفوري: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('خطأ في التوليد الفوري:', error);
      throw error;
    }
  }

  /**
   * إيقاف المجدول
   */
  async stopScheduler(): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/scheduler/stop`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`خطأ في إيقاف المجدول: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('خطأ في إيقاف المجدول:', error);
      throw error;
    }
  }

  /**
   * بدء المجدول
   */
  async startScheduler(): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/scheduler/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`خطأ في بدء المجدول: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('خطأ في بدء المجدول:', error);
      throw error;
    }
  }
}

export const textbookService = new TextbookService();
export default textbookService;