import { ScheduledLesson } from '../services/api/curriculumService';
import { Section } from '../contexts/SectionsContext';
import { differenceInDays, isAfter, subDays, startOfWeek, endOfWeek, format, addWeeks, isBefore, isSameWeek } from 'date-fns';

// 1. DATA INTERFACES as specified
export interface SectionPerformanceData {
  sectionId: string;
  sectionName: string;
  sectionColor: string;
  overallProgress: number;
  status: 'on-track' | 'behind' | 'critical';
  completedLessons: number;
  inProgressLessons: number;
  plannedLessons: number;
  totalLessons: number;
  weeklyTrend: number;
  alerts: string[];
}

export interface KpiData {
  totalLessons: number;
  averageCompletion: number;
  topPerformer: { name: string; progress: number };
  needsSupport: { name: string; progress: number };
}

export interface WeeklyTrendData {
  weekLabel: string; // e.g., "Week 1", "Week 2"
  [sectionId: string]: number | string; // sectionId: progress percentage for that week
}

// 2. HELPER FUNCTIONS

/**
 * Determines the status of a single scheduled lesson based on its stages.
 */
const getScheduledLessonStatus = (lesson: ScheduledLesson): 'completed' | 'in-progress' | 'planned' => {
        const stages = lesson.LessonTemplate?.stages || [];
    if (!stages || stages.length === 0) {
        return 'planned';
    }
    const completedCount = stages.filter(s => s.isCompleted).length;
    if (completedCount === 0) {
        return 'planned';
    }
    if (completedCount === lesson.stages.length) {
        return 'completed';
    }
    return 'in-progress';
};

/**
 * Determines the performance status category based on progress percentage.
 */
const getPerformanceStatus = (progress: number): 'on-track' | 'behind' | 'critical' => {
    if (progress > 80) return 'on-track';
    if (progress >= 60) return 'behind';
    return 'critical';
};

/**
 * Calculates weekly cumulative progress for each section over the last N weeks.
 */
const calculateWeeklyTrends = (scheduledLessons: ScheduledLesson[], allSections: Section[], numWeeks: number = 4): WeeklyTrendData[] => {
    const trends: WeeklyTrendData[] = [];
    const today = new Date();

    for (let i = numWeeks - 1; i >= 0; i--) { // Iterate backwards from the most recent week
        const weekStartDate = startOfWeek(subDays(today, i * 7), { weekStartsOn: 0 }); // Assuming week starts on Sunday
        const weekEndDate = endOfWeek(subDays(today, i * 7), { weekStartsOn: 0 });
        const weekLabel = `الأسبوع ${numWeeks - i}`; // e.g., الأسبوع 1, الأسبوع 2

        const weekData: WeeklyTrendData = { weekLabel };

        for (const section of allSections) {
            const sectionLessons = scheduledLessons.filter(l => l.assignedSections.includes(section.id));
            
            if (sectionLessons.length === 0) {
                weekData[section.id] = 0;
                continue;
            }

            // Lessons completed up to the end of this week
            const completedLessonsUpToWeek = sectionLessons.filter(l => {
                const lessonStatus = getScheduledLessonStatus(l);
                if (lessonStatus === 'completed' && l.LessonTemplate.stages) {
                    const completedStage = l.LessonTemplate?.stages?.find(s => s.isCompleted);
                    const completionDate = completedStage ? completedStage.completionDate : undefined;
                    return completionDate && isBefore(new Date(completionDate), addWeeks(weekEndDate, 1));
                }
                return false;
            }).length;

            const totalLessonsForSection = sectionLessons.length;
            weekData[section.id] = totalLessonsForSection > 0 ? Math.round((completedLessonsUpToWeek / totalLessonsForSection) * 100) : 0;
        }
        trends.push(weekData);
    }
    return trends;
};


// 3. MAIN CALCULATION FUNCTION

/**
 * Processes all scheduled lessons and sections to generate the full dataset for the dashboard.
 * @param scheduledLessons - Array of all scheduled lessons from ScheduledLessonContext.
 * @param sections - Array of all sections from SectionsContext.
 * @returns A comprehensive object with all data needed for the dashboard.
 */
export const processDashboardData = (scheduledLessons: ScheduledLesson[], sections: Section[]) => {
    const performanceData: SectionPerformanceData[] = [];
    const today = new Date();

    for (const section of sections) {
        const relevantLessons = scheduledLessons.filter(l => l.assignedSections.includes(section.id));
        
        if (relevantLessons.length === 0) {
            performanceData.push({
                sectionId: section.id,
                sectionName: section.name,
                sectionColor: section.color || '#8884d8',
                overallProgress: 0,
                status: 'on-track', // Or some other default
                completedLessons: 0,
                inProgressLessons: 0,
                plannedLessons: 0,
                totalLessons: 0,
                weeklyTrend: 0,
                alerts: [],
            });
            continue;
        }

        const lessonStatuses = relevantLessons.map(getScheduledLessonStatus);
        const completedLessons = lessonStatuses.filter(s => s === 'completed').length;
        const inProgressLessons = lessonStatuses.filter(s => s === 'in-progress').length;
        const plannedLessons = lessonStatuses.filter(s => s === 'planned').length;
        const totalLessons = relevantLessons.length;

        const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        // Calculate weekly trend (progress change in last 7 days)
        const sevenDaysAgo = subDays(today, 7);
        const lessonsCompletedLast7Days = relevantLessons.filter(l => {
            const status = getScheduledLessonStatus(l);
            const completedStage = l.LessonTemplate?.stages?.find(s => s.isCompleted);
            const completionDate = completedStage ? completedStage.completionDate : undefined;
            return status === 'completed' && completionDate && isAfter(new Date(completionDate), sevenDaysAgo);
        }).length;
        const weeklyTrend = totalLessons > 0 ? Math.round((lessonsCompletedLast7Days / totalLessons) * 100) : 0;

        // Check for alerts (e.g., planned lessons with a date in the past)
        const alerts = relevantLessons
            .filter(l => getScheduledLessonStatus(l) === 'planned' && differenceInDays(today, new Date(l.date)) > 3)
            .map(l => `تأخر في "${l.LessonTemplate.title}"`);

        performanceData.push({
            sectionId: section.id,
            sectionName: section.name,
            sectionColor: section.color || '#8884d8',
            overallProgress,
            status: getPerformanceStatus(overallProgress),
            completedLessons,
            inProgressLessons,
            plannedLessons,
            totalLessons,
            weeklyTrend,
            alerts,
        });
    }

    // Calculate KPIs
    const totalScheduledLessons = scheduledLessons.length;
    const totalProgress = performanceData.reduce((acc, curr) => acc + curr.overallProgress, 0);
    const averageCompletion = performanceData.length > 0 ? Math.round(totalProgress / performanceData.length) : 0;

    const sortedByProgress = [...performanceData].sort((a, b) => b.overallProgress - a.overallProgress);
    const topPerformer = sortedByProgress[0] ? { name: sortedByProgress[0].sectionName, progress: sortedByProgress[0].overallProgress } : { name: 'N/A', progress: 0 };
    const needsSupport = sortedByProgress[sortedByProgress.length - 1] ? { name: sortedByProgress[sortedByProgress.length - 1].sectionName, progress: sortedByProgress[sortedByProgress.length - 1].overallProgress } : { name: 'N/A', progress: 0 };

    const kpiData: KpiData = {
        totalLessons: totalScheduledLessons,
        averageCompletion,
        topPerformer,
        needsSupport,
    };

    const weeklyTrends = calculateWeeklyTrends(scheduledLessons, sections);

    return {
        performanceData,
        kpiData,
        weeklyTrends,
    };
};