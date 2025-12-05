import React, { useMemo } from 'react';
import { useCurriculum } from '../contexts/CurriculumContext';
import { useSections } from '../contexts/SectionsContext';
import { processDashboardData } from '../utils/dashboardUtils';
import { CircularProgress, Typography, Card, CardContent } from '@mui/material';
import KpiCard from '../components/KpiCard';
import SectionPerformanceChart from '../components/SectionPerformanceChart';
import SectionPerformanceCard from '../components/SectionPerformanceCard';
import WeeklyTrendsChart from '../components/WeeklyTrendsChart';
import { FaChartLine, FaCheckCircle, FaArrowUp, FaArrowDown } from 'react-icons/fa';

// This is the new main component for the dashboard tab.
function ProgressDashboardTab() {
  const { scheduledLessons, isLoading: lessonsLoading } = useCurriculum();
  const { sections, isLoading: sectionsLoading } = useSections();

  const isLoading = lessonsLoading || sectionsLoading;

  // useMemo is crucial for performance. It ensures the complex calculations
  // only run when the source data (lessons or sections) actually changes.
  const dashboardData = useMemo(() => {
    if (isLoading || !scheduledLessons.length || !sections.length) {
      return null;
    }
    return processDashboardData(scheduledLessons, sections);
  }, [scheduledLessons, sections, isLoading]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress size={48} />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-4 text-center">
        <Typography variant="h6">لا توجد بيانات كافية لعرض لوحة التحكم.</Typography>
        <Typography>الرجاء إضافة بعض الأقسام والدروس أولاً.</Typography>
      </div>
    );
  }

  const { kpiData, performanceData, weeklyTrends } = dashboardData;

  return (
    <div dir="rtl">
      <Typography variant="h4" className="mb-6">لوحة تتبع الأداء</Typography>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="إجمالي الدروس المخططة"
          value={kpiData.totalLessons}
          icon={<FaChartLine className="h-8 w-8" />}
          color="blue"
        />
        <KpiCard 
          title="متوسط نسبة الإنجاز"
          value={`${kpiData.averageCompletion}%`}
          icon={<FaCheckCircle className="h-8 w-8" />}
          color="green"
        />
        <KpiCard 
          title="أكثر قسم متقدم"
          value={`${kpiData.topPerformer.name} (${kpiData.topPerformer.progress}%)`}
          icon={<FaArrowUp className="h-8 w-8" />}
          color="purple"
        />
        <KpiCard 
          title="أكثر قسم يحتاج دعم"
          value={`${kpiData.needsSupport.name} (${kpiData.needsSupport.progress}%)`}
          icon={<FaArrowDown className="h-8 w-8" />}
          color="red"
        />
      </div>

      {/* Main Chart */}
      <div>
        <Typography variant="h5">مخطط أداء الأقسام</Typography>
        <Card className="w-full p-4">
          <CardContent>
            <SectionPerformanceChart 
              performanceData={performanceData} 
              averageCompletion={kpiData.averageCompletion} 
            />
          </CardContent>
        </Card>
      </div>

      {/* Section Performance Cards */}
      <div>
        <Typography variant="h5">بطاقات أداء الأقسام</Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {performanceData.map(section => (
            <SectionPerformanceCard key={section.sectionId} data={section} />
          ))}
        </div>
      </div>

      {/* Weekly Trends Chart */}
      <div>
        <Typography variant="h5">جدول الأداء الأسبوعي</Typography>
        <Card className="w-full p-4">
          <CardContent>
            <WeeklyTrendsChart weeklyTrends={weeklyTrends} sections={sections} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ProgressDashboardTab;
