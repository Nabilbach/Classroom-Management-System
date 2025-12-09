// خدمة مركزية للكشف عن الحصة الحالية والقسم المناسب
export interface CurrentLessonInfo {
  currentLesson?: {
    sectionId: string;
    sectionName: string;
    startTime: string;
    duration: number;
    subject?: string;
    teacher?: string;
    classroom?: string;
  };
  nextLesson?: {
    sectionId: string;
    sectionName: string;
    startTime: string;
    duration: number;
    subject?: string;
    teacher?: string;
    classroom?: string;
  };
  defaultSection?: {
    id: string;
    name: string;
  };
  currentTime: string;
  currentDay: string;
  isTeachingTime: boolean;
  recommendedSectionId: string; // القسم المقترح للعرض
  displayMessage: string; // رسالة للعرض
}

class CurrentLessonService {
  private static instance: CurrentLessonService;
  private cachedInfo: CurrentLessonInfo | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 ثانية

  static getInstance(): CurrentLessonService {
    if (!CurrentLessonService.instance) {
      CurrentLessonService.instance = new CurrentLessonService();
    }
    return CurrentLessonService.instance;
  }

  async getCurrentLessonInfo(): Promise<CurrentLessonInfo> {
    const now = Date.now();
    
    // استخدام الكاش إذا كان حديث
    if (this.cachedInfo && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.cachedInfo!;
    }

    try {
      const response = await fetch('/api/schedule/current-lesson');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      const data = result.data;

      // تحديد القسم المقترح والرسالة
      let recommendedSectionId: string;
      let displayMessage: string;

      if (data.isTeachingTime && data.currentLesson) {
        recommendedSectionId = data.currentLesson.sectionId;
        displayMessage = `🎯 الحصة الحالية - ${data.currentLesson.sectionName} - ${data.currentLesson.startTime}`;
      } else if (data.nextLesson) {
        recommendedSectionId = data.nextLesson.sectionId;
        displayMessage = `⏭️ الحصة القادمة - ${data.nextLesson.sectionName} - ${data.nextLesson.startTime}`;
      } else if (data.defaultSection) {
        recommendedSectionId = data.defaultSection.id;
        displayMessage = `📝 القسم الافتراضي - ${data.defaultSection.name}`;
      } else {
        recommendedSectionId = '';
        displayMessage = '⏰ لا يوجد جدول محدد';
      }

      this.cachedInfo = {
        ...data,
        recommendedSectionId,
        displayMessage
      };
      
      this.lastFetchTime = now;
      return this.cachedInfo;

    } catch (error) {
      console.error('خطأ في جلب معلومات الحصة الحالية:', error);
      
      // إرجاع قيم افتراضية في حالة الخطأ
      return {
        currentTime: new Date().toTimeString().slice(0, 5),
        currentDay: new Date().toLocaleDateString('ar-MA', { weekday: 'long' }),
        isTeachingTime: false,
        recommendedSectionId: '',
        displayMessage: '🔄 يتم التحديث...'
      };
    }
  }

  // إعادة تعيين الكاش (للاستخدام عند تغيير البيانات)
  resetCache(): void {
    this.cachedInfo = null;
    this.lastFetchTime = 0;
  }

  // الاشتراك في تحديثات تلقائية
  subscribeToUpdates(callback: (info: CurrentLessonInfo) => void, intervalMs: number = 60000): () => void {
    const interval = setInterval(async () => {
      try {
        const info = await this.getCurrentLessonInfo();
        callback(info);
      } catch (error) {
        console.error('خطأ في التحديث التلقائي:', error);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }
}

export default CurrentLessonService;