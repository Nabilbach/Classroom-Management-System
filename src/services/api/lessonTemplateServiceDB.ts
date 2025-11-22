import type { LessonStage } from '../../types/lessonLogTypes';

// إعدادات API - تم الإصلاح: استخدام المنفذ الصحيح 3000
const API_BASE_URL = 'http://localhost:3000';

export interface LessonTemplate {
  id: string;
  title: string;
  subject: string; // تغيير من courseName
  grade: string;   // تغيير من level
  duration?: number;
  objectives?: string[];
  content?: string;
  stages: LessonStage[];
  resources?: string[];
  assessment?: any;
  homework?: any;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // للتوافق مع النظام القديم
  description?: string;
  estimatedSessions?: number;
  courseName?: string;
  level?: string;
  weekNumber?: number;
  scheduledSections?: string[];
}

// قالب افتراضي للطوارئ
const defaultTemplate: LessonTemplate = {
  id: 'default-1',
  title: 'الإيمان بالغيب',
  subject: 'التربية الإسلامية',
  grade: 'الجذع المشترك',
  duration: 50,
  objectives: ['فهم مفهوم الغيب', 'تعزيز الإيمان'],
  content: 'مفاهيم أساسية حول الإيمان بالغيب',
  stages: [
    { id: 's-1', title: 'تمهيد', isCompleted: false },
    { id: 's-2', title: 'عرض', isCompleted: false },
    { id: 's-3', title: 'تقويم', isCompleted: false },
  ],
  resources: [],
  assessment: {},
  homework: {},
  notes: '',
  // للتوافق
  description: 'مفاهيم أساسية حول الإيمان بالغيب',
  estimatedSessions: 1,
  courseName: 'التربية الإسلامية',
  level: 'الجذع المشترك',
  weekNumber: 1,
  scheduledSections: [],
};

// التحقق من اتصال الخادم
const checkServerConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { 
      method: 'GET',
      timeout: 3000 
    });
    return response.ok;
  } catch {
    return false;
  }
};

// جلب القوالب من قاعدة البيانات
const fetchFromDatabase = async (): Promise<LessonTemplate[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/lesson-templates`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const templates = await response.json();
    
    // تحويل للتوافق مع النظام القديم
    return templates.map((template: any) => ({
      ...template,
      description: template.content || '',
      estimatedSessions: Math.ceil(template.duration / 50) || 1,
      courseName: template.subject,
      level: template.grade,
      scheduledSections: []
    }));
  } catch (error) {
    console.error('❌ خطأ في جلب القوالب من قاعدة البيانات:', error);
    throw error;
  }
};

// جلب القوالب من localStorage (نسخة احتياطية)
const fetchFromLocalStorage = (): LessonTemplate[] => {
  try {
    const raw = localStorage.getItem('lessonTemplates');
    if (!raw) return [defaultTemplate];
    
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [defaultTemplate];
  } catch {
    return [defaultTemplate];
  }
};

// حفظ في localStorage كنسخة احتياطية
const saveToLocalStorage = (templates: LessonTemplate[]) => {
  try {
    localStorage.setItem('lessonTemplates', JSON.stringify(templates));
    localStorage.setItem('lessonTemplatesLastSync', new Date().toISOString());
    console.log('✅ تم حفظ نسخة احتياطية في localStorage');
  } catch (error) {
    console.warn('⚠️ فشل في حفظ النسخة الاحتياطية:', error);
  }
};

// مزامنة localStorage مع قاعدة البيانات
const syncLocalStorageToDatabase = async (): Promise<void> => {
  try {
    const localTemplates = fetchFromLocalStorage();
    if (localTemplates.length <= 1) return; // فقط القالب الافتراضي
    
    const serverOnline = await checkServerConnection();
    if (!serverOnline) return;
    
    console.log('🔄 مزامنة localStorage مع قاعدة البيانات...');
    
    const response = await fetch(`${API_BASE_URL}/api/lesson-templates/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templates: localTemplates })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ تم استيراد ${result.imported} قالب إلى قاعدة البيانات`);
      
      // مسح localStorage بعد المزامنة الناجحة
      localStorage.removeItem('lessonTemplates');
      localStorage.setItem('lessonTemplatesMigrated', 'true');
    }
  } catch (error) {
    console.error('❌ خطأ في المزامنة:', error);
  }
};

// الدالة الرئيسية لجلب القوالب
export const fetchLessonTemplates = async (): Promise<LessonTemplate[]> => {
  console.log('📚 جلب قوالب الدروس...');
  
  try {
    // محاولة الاتصال بقاعدة البيانات أولاً
    const serverOnline = await checkServerConnection();
    
    if (serverOnline) {
      try {
        const templates = await fetchFromDatabase();
        
        // حفظ نسخة احتياطية
        saveToLocalStorage(templates);
        
        // مزامنة localStorage إذا لزم الأمر
        await syncLocalStorageToDatabase();
        
        console.log(`✅ تم جلب ${templates.length} قالب من قاعدة البيانات`);
        return templates;
      } catch (dbError) {
        console.warn('⚠️ فشل في جلب البيانات من الخادم، استخدام النسخة الاحتياطية');
      }
    }
    
    // استخدام localStorage كبديل
    const localTemplates = fetchFromLocalStorage();
    console.log(`📱 تم جلب ${localTemplates.length} قالب من localStorage`);
    return localTemplates;
    
  } catch (error) {
    console.error('❌ خطأ عام في جلب القوالب:', error);
    return [defaultTemplate];
  }
};

// إضافة قالب جديد
export const addLessonTemplate = async (templateData: Omit<LessonTemplate, 'id'>): Promise<LessonTemplate> => {
  console.log('➕ إضافة قالب جديد:', templateData.title);
  
  try {
    const serverOnline = await checkServerConnection();
    
    if (serverOnline) {
      const response = await fetch(`${API_BASE_URL}/api/lesson-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: templateData.title,
          subject: templateData.subject || templateData.courseName,
          grade: templateData.grade || templateData.level,
          duration: templateData.duration || templateData.estimatedSessions ? templateData.estimatedSessions * 50 : 50,
          objectives: templateData.objectives || [],
          content: templateData.content || templateData.description || '',
          stages: templateData.stages || [],
          resources: templateData.resources || [],
          assessment: templateData.assessment || {},
          homework: templateData.homework || {},
          notes: templateData.notes || ''
        })
      });
      
      if (response.ok) {
        const newTemplate = await response.json();
        console.log('✅ تم إضافة القالب في قاعدة البيانات');
        
        // تحديث النسخة الاحتياطية
        const localTemplates = fetchFromLocalStorage();
        localTemplates.push(newTemplate);
        saveToLocalStorage(localTemplates);
        
        return newTemplate;
      }
    }
    
    // البديل: حفظ في localStorage
    const localTemplates = fetchFromLocalStorage();
    const newTemplate: LessonTemplate = {
      ...templateData,
      id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    localTemplates.push(newTemplate);
    saveToLocalStorage(localTemplates);
    
    console.log('📱 تم حفظ القالب في localStorage');
    return newTemplate;
    
  } catch (error) {
    console.error('❌ خطأ في إضافة القالب:', error);
    throw error;
  }
};

// تحديث قالب
export const updateLessonTemplate = async (id: string, updates: Partial<LessonTemplate>): Promise<LessonTemplate> => {
  console.log('🔄 تحديث القالب:', id);
  
  try {
    const serverOnline = await checkServerConnection();
    
    if (serverOnline) {
      const response = await fetch(`${API_BASE_URL}/api/lesson-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const updatedTemplate = await response.json();
        console.log('✅ تم تحديث القالب في قاعدة البيانات');
        
        // تحديث النسخة الاحتياطية
        const localTemplates = fetchFromLocalStorage();
        const index = localTemplates.findIndex(t => t.id === id);
        if (index !== -1) {
          localTemplates[index] = updatedTemplate;
          saveToLocalStorage(localTemplates);
        }
        
        return updatedTemplate;
      }
    }
    
    // البديل: تحديث localStorage
    const localTemplates = fetchFromLocalStorage();
    const index = localTemplates.findIndex(t => t.id === id);
    
    if (index === -1) {
      throw new Error('القالب غير موجود');
    }
    
    const updatedTemplate = {
      ...localTemplates[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    localTemplates[index] = updatedTemplate;
    saveToLocalStorage(localTemplates);
    
    console.log('📱 تم تحديث القالب في localStorage');
    return updatedTemplate;
    
  } catch (error) {
    console.error('❌ خطأ في تحديث القالب:', error);
    throw error;
  }
};

// حذف قالب
export const deleteLessonTemplate = async (id: string): Promise<void> => {
  console.log('🗑️ حذف القالب:', id);
  
  try {
    const serverOnline = await checkServerConnection();
    
    if (serverOnline) {
      const response = await fetch(`${API_BASE_URL}/api/lesson-templates/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log('✅ تم حذف القالب من قاعدة البيانات');
      } else {
        const error = await response.json();
        if (error.linkedLessons) {
          throw new Error(error.error);
        }
      }
    }
    
    // حذف من localStorage أيضاً
    const localTemplates = fetchFromLocalStorage().filter(t => t.id !== id);
    saveToLocalStorage(localTemplates);
    
    console.log('📱 تم حذف القالب من localStorage');
    
  } catch (error) {
    console.error('❌ خطأ في حذف القالب:', error);
    throw error;
  }
};

// استيراد قوالب متعددة (للنسخة الاحتياطية)
export const importLessonTemplates = async (templates: LessonTemplate[]): Promise<{ imported: number; total: number; errors?: any[] }> => {
  console.log(`📥 استيراد ${templates.length} قالب...`);
  
  try {
    const serverOnline = await checkServerConnection();
    
    if (serverOnline) {
      const response = await fetch(`${API_BASE_URL}/api/lesson-templates/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ تم استيراد ${result.imported} قالب إلى قاعدة البيانات`);
        
        // حفظ نسخة احتياطية
        saveToLocalStorage(templates);
        
        return result;
      }
    }
    
    // البديل: حفظ في localStorage
    saveToLocalStorage(templates);
    console.log(`📱 تم حفظ ${templates.length} قالب في localStorage`);
    
    return { imported: templates.length, total: templates.length };
    
  } catch (error) {
    console.error('❌ خطأ في استيراد القوالب:', error);
    throw error;
  }
};

// حذف قوالب حسب المادة (للتوافق)
export const deleteTemplatesByCourse = async (courseName: string): Promise<void> => {
  const templates = await fetchLessonTemplates();
  const toDelete = templates.filter(t => t.courseName === courseName || t.subject === courseName);
  
  for (const template of toDelete) {
    await deleteLessonTemplate(template.id);
  }
};