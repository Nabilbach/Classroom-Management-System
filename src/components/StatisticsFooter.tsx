import React, { useMemo, useCallback } from 'react';
import { useCurriculum } from '../contexts/CurriculumContext';
import { AdaptedLesson } from '../types/lessonLogTypes';
import { migrateLessonToAdapted } from '../utils/lessonLogMigrationUtils';

const statusColors: Record<string, string> = {
  planned: 'blue-500',
  'in-progress': 'yellow-500',
  completed: 'green-500',
};

  const statusTranslations: Record<string, string> = {
    planned: 'مخطط لها',
    'in-progress': 'قيد التقدم',
    completed: 'مكتملة',
    cancelled: 'ملغاة', // Added
  };

const StatisticsFooter = () => {
  const { scheduledLessons } = useCurriculum();

  const calculateStatistics = useCallback((lessons: AdaptedLesson[]) => {
    return lessons.reduce((stats, lesson) => {
      stats.total++;
      stats[lesson.status]++;
      return stats;
    }, {
      total: 0,
      planned: 0,
      'in-progress': 0,
      completed: 0,
    });
  }, []);

  const adaptedLessons = useMemo(() => scheduledLessons.map(lesson => migrateLessonToAdapted(lesson as any)).filter(Boolean), [scheduledLessons]);
  const stats = useMemo(() => calculateStatistics(adaptedLessons), [adaptedLessons, calculateStatistics]);

  const completionPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <footer className="bg-white bg-gray-100 border-t border-gray-200 border-gray-200 p-4">
      {/* Mobile View */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">إجمالي الدروس: {stats.total}</span>
          <div className="w-24 h-2.5 bg-gray-200 rounded-full bg-gray-200">
            <div
              className="bg-green-500 h-2.5 rounded-full transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:flex items-center justify-between">
        <div className="text-sm font-medium">الإحصائيات</div>
        <div className="flex items-center gap-6">
          {['planned', 'in-progress', 'completed'].map(status => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full bg-${statusColors[status]}`} />
              <span className="text-sm font-medium">{stats[status as keyof typeof stats]}</span>
              <span className="text-xs text-gray-500 capitalize">{statusTranslations[status] || status.replace('-', ' ')}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium">الإنجاز</div>
          <div className="w-32 h-2.5 bg-gray-200 rounded-full bg-gray-200">
            <div
              className="bg-green-500 h-2.5 rounded-full transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span className="text-sm font-medium">{completionPercentage.toFixed(0)}%</span>
        </div>
      </div>
    </footer>
  );
};

export default StatisticsFooter;
