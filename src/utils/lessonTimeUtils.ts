// دالة لتحديد رقم الحصة والفترة بناءً على الوقت
export interface LessonInfo {
  lessonNumber: number;
  period: 'صباحية' | 'مسائية';
  timeRange: string;
}

export const getLessonInfo = (dateTime: string): LessonInfo | null => {
  try {
    // استخراج الوقت من التاريخ والوقت
    const date = new Date(dateTime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    // تعريف أوقات الحصص بالدقائق
    const morningLessons = [
      { start: 9 * 60, end: 10 * 60, number: 1 }, // 09:00 - 10:00
      { start: 10 * 60, end: 11 * 60, number: 2 }, // 10:00 - 11:00
      { start: 11 * 60, end: 12 * 60, number: 3 }, // 11:00 - 12:00
      { start: 12 * 60, end: 13 * 60, number: 4 }, // 12:00 - 13:00
    ];

    const eveningLessons = [
      { start: 15 * 60, end: 16 * 60, number: 1 }, // 15:00 - 16:00
      { start: 16 * 60, end: 17 * 60, number: 2 }, // 16:00 - 17:00
      { start: 17 * 60, end: 18 * 60, number: 3 }, // 17:00 - 18:00
      { start: 18 * 60, end: 19 * 60, number: 4 }, // 18:00 - 19:00
    ];

    // البحث في الحصص الصباحية
    for (const lesson of morningLessons) {
      if (timeInMinutes >= lesson.start && timeInMinutes < lesson.end) {
        return {
          lessonNumber: lesson.number,
          period: 'صباحية',
          timeRange: `${Math.floor(lesson.start / 60)}:00 - ${Math.floor(lesson.end / 60)}:00`
        };
      }
    }

    // البحث في الحصص المسائية
    for (const lesson of eveningLessons) {
      if (timeInMinutes >= lesson.start && timeInMinutes < lesson.end) {
        return {
          lessonNumber: lesson.number,
          period: 'مسائية',
          timeRange: `${Math.floor(lesson.start / 60)}:00 - ${Math.floor(lesson.end / 60)}:00`
        };
      }
    }

    // إذا لم يكن الوقت ضمن أي حصة، نحاول تقدير أقرب حصة
    if (timeInMinutes < 9 * 60) {
      // قبل بداية اليوم الدراسي
      return {
        lessonNumber: 1,
        period: 'صباحية',
        timeRange: '09:00 - 10:00'
      };
    } else if (timeInMinutes >= 13 * 60 && timeInMinutes < 15 * 60) {
      // وقت الراحة بين الصباح والمساء
      return {
        lessonNumber: 1,
        period: 'مسائية',
        timeRange: '15:00 - 16:00'
      };
    } else if (timeInMinutes >= 19 * 60) {
      // بعد انتهاء اليوم الدراسي
      return {
        lessonNumber: 4,
        period: 'مسائية',
        timeRange: '18:00 - 19:00'
      };
    }

    return null;
  } catch (error) {
    console.error('خطأ في تحديد معلومات الحصة:', error);
    return null;
  }
};

// دالة لتحويل الوقت إلى نص عربي
export const formatTimeToArabic = (time: string): string => {
  try {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  } catch (error) {
    return time;
  }
};

// دالة لتحويل التاريخ إلى تنسيق DD-MM-YYYY
export const formatDateToArabic = (dateString: string): string => {
  try {
    if (!dateString) return 'لا يوجد تاريخ';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // إرجاع القيمة الأصلية إذا لم يكن تاريخاً صحيحاً
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ:', error, 'للقيمة:', dateString);
    return dateString || 'خطأ في التاريخ';
  }
};