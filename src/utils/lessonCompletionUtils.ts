import { LessonStage, ScheduledLesson } from '../types/lessonLogTypes';

/**
 * حساب اكتمال الدرس بناءً على جميع المراحل الرئيسية في جميع الحصص المرتبطة
 */

// نوع لتجميع الحصص حسب الدرس
export interface LessonGroup {
  lessonGroupId: string;
  templateId?: string;
  lessonTitle: string;
  sessions: ScheduledLesson[];
  coreStages: LessonStage[]; // المراحل الرئيسية المشتركة
  completionStatus: 'not-started' | 'in-progress' | 'completed';
  overallProgress: number; // نسبة مئوية
}

/**
 * تجميع الحصص حسب الدرس (lessonGroupId أو templateId)
 */
export const groupLessonsByLesson = (scheduledLessons: ScheduledLesson[]): LessonGroup[] => {
  const groups = new Map<string, ScheduledLesson[]>();
  
  scheduledLessons.forEach(lesson => {
    const groupKey = lesson.lessonGroupId || lesson.templateId || lesson.id;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(lesson);
  });

  return Array.from(groups.entries()).map(([groupKey, sessions]) => {
    return calculateLessonGroupCompletion(groupKey, sessions);
  });
};

/**
 * حساب اكتمال مجموعة حصص (درس واحد)
 */
export const calculateLessonGroupCompletion = (
  groupId: string, 
  sessions: ScheduledLesson[]
): LessonGroup => {
  if (sessions.length === 0) {
    return {
      lessonGroupId: groupId,
      lessonTitle: 'درس غير محدد',
      sessions: [],
      coreStages: [],
      completionStatus: 'not-started',
      overallProgress: 0
    };
  }

  const firstSession = sessions[0];
  
  // استخراج المراحل الرئيسية (مشتركة بين جميع الحصص)
  const coreStages = firstSession.stages.filter(stage => stage.isCore === true);
  
  // حساب اكتمال المراحل الرئيسية عبر جميع الحصص
  const coreStageCompletion = calculateCoreStagesCompletion(coreStages, sessions);
  
  // تحديد حالة الاكتمال
  let completionStatus: 'not-started' | 'in-progress' | 'completed';
  if (coreStageCompletion.completedCount === 0) {
    completionStatus = 'not-started';
  } else if (coreStageCompletion.completedCount === coreStageCompletion.totalCount) {
    completionStatus = 'completed';
  } else {
    completionStatus = 'in-progress';
  }

  return {
    lessonGroupId: groupId,
    templateId: firstSession.templateId,
    lessonTitle: firstSession.customTitle || 'درس غير محدد',
    sessions: sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    coreStages: coreStageCompletion.updatedStages,
    completionStatus,
    overallProgress: Math.round((coreStageCompletion.completedCount / coreStageCompletion.totalCount) * 100)
  };
};

/**
 * حساب اكتمال المراحل الرئيسية عبر جميع الحصص
 */
export const calculateCoreStagesCompletion = (
  coreStages: LessonStage[], 
  sessions: ScheduledLesson[]
) => {
  const updatedStages = coreStages.map(coreStage => {
    // البحث عن هذه المرحلة في جميع الحصص
    const completedInAllSessions = sessions.every(session => {
      const matchingStage = session.stages.find(stage => 
        stage.templateStageId === coreStage.id || stage.id === coreStage.id
      );
      return matchingStage?.isCompleted === true;
    });

    return {
      ...coreStage,
      isCompleted: completedInAllSessions,
      completionDate: completedInAllSessions ? new Date().toISOString() : undefined
    };
  });

  const completedCount = updatedStages.filter(stage => stage.isCompleted).length;
  const totalCount = updatedStages.length;

  return {
    updatedStages,
    completedCount,
    totalCount,
    completionPercentage: totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  };
};

/**
 * تحديث حالة مرحلة رئيسية في جميع الحصص المرتبطة
 */
export const updateCoreStageInAllSessions = (
  sessions: ScheduledLesson[],
  stageId: string,
  isCompleted: boolean
): ScheduledLesson[] => {
  return sessions.map(session => ({
    ...session,
    stages: session.stages.map(stage => 
      (stage.templateStageId === stageId || stage.id === stageId)
        ? { ...stage, isCompleted, completionDate: isCompleted ? new Date().toISOString() : undefined }
        : stage
    )
  }));
};

/**
 * إحصائيات شاملة للدروس
 */
export const calculateLessonsStatistics = (lessonGroups: LessonGroup[]) => {
  const total = lessonGroups.length;
  const completed = lessonGroups.filter(group => group.completionStatus === 'completed').length;
  const inProgress = lessonGroups.filter(group => group.completionStatus === 'in-progress').length;
  const notStarted = lessonGroups.filter(group => group.completionStatus === 'not-started').length;

  return {
    total,
    completed,
    inProgress,
    notStarted,
    completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0
  };
};