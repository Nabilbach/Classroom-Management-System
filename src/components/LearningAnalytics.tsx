import React, { useMemo, useState } from 'react';
import { Box, Paper, Typography, Grid, Card, CardContent, Collapse, Chip, IconButton, Tooltip } from '@mui/material';
import { ScheduledLesson, AdaptedLesson } from '../types/lessonLogTypes';
import Chart from 'react-apexcharts';
import { isBefore, startOfDay, parseISO, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CheckCircle, Schedule, Warning, TrendingUp, ExpandMore, ExpandLess, EventBusy, Edit, Delete } from '@mui/icons-material';
import { migrateLessonToAdapted } from '../utils/lessonLogMigrationUtils';

interface LearningAnalyticsProps {
  scheduledLessons: ScheduledLesson[];
  onEditLesson?: (lesson: AdaptedLesson) => void;
  onDeleteLesson?: (lessonId: string) => void;
}

const LearningAnalytics: React.FC<LearningAnalyticsProps> = ({ scheduledLessons, onEditLesson, onDeleteLesson }) => {
  const [showDelayedDetails, setShowDelayedDetails] = useState(false);

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    let total = 0;
    let completed = 0;
    let delayed = 0;
    let planned = 0;
    const subjectProgress: { [key: string]: { total: number; completed: number } } = {};
    const delayedLessonsList: ScheduledLesson[] = [];

    scheduledLessons.forEach(lesson => {
      total++;
      
      // Determine completion status
      // Check if stages exist and are all completed, or if progress is 100
      const isLessonCompleted = (lesson.stages && lesson.stages.length > 0 && lesson.stages.every((s: any) => s.isCompleted)) || lesson.progress === 100;
      
      if (isLessonCompleted) {
        completed++;
      } else {
        // Check for delay
        const lessonDate = lesson.date ? parseISO(lesson.date) : null;
        if (lessonDate && isBefore(lessonDate, today)) {
          delayed++;
          delayedLessonsList.push(lesson);
        } else {
          planned++;
        }
      }

      // Subject aggregation
      const subject = lesson.subject || 'غير محدد';
      if (!subjectProgress[subject]) {
        subjectProgress[subject] = { total: 0, completed: 0 };
      }
      subjectProgress[subject].total++;
      if (isLessonCompleted) {
        subjectProgress[subject].completed++;
      }
    });

    return { total, completed, delayed, planned, subjectProgress, delayedLessonsList };
  }, [scheduledLessons]);

  // Chart Data
  const chartOptions = {
    chart: {
      id: 'subject-progress-bar',
      fontFamily: 'Cairo, sans-serif',
      toolbar: { show: false }
    },
    xaxis: {
      categories: Object.keys(stats.subjectProgress),
      labels: {
        style: { fontFamily: 'Cairo, sans-serif' }
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true,
      }
    },
    colors: ['#10b981'],
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return `${val.toFixed(0)}%`;
      },
      style: { fontFamily: 'Cairo, sans-serif' }
    },
    tooltip: {
      style: { fontFamily: 'Cairo, sans-serif' }
    }
  };

  const chartSeries = [{
    name: 'نسبة الإنجاز',
    data: Object.values(stats.subjectProgress).map(s => s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0)
  }];

  const StatCard = ({ title, value, icon, color, subtitle, onClick, isClickable }: any) => (
    <Card 
      sx={{ 
        height: '100%', 
        borderLeft: `4px solid ${color}`,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': isClickable ? {
          transform: 'translateY(-2px)',
          boxShadow: 3
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: color }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color: color, p: 1, borderRadius: '50%', bgcolor: `${color}15` }}>
            {icon}
          </Box>
        </Box>
        {isClickable && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Typography variant="caption" sx={{ color: color, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {showDelayedDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
              {showDelayedDetails ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TrendingUp color="primary" />
        لوحة التحليلات والأداء
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="إجمالي الحصص"
            value={stats.total}
            icon={<Schedule />}
            color="#3b82f6"
            subtitle="في الجدول الزمني"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="حصص مكتملة"
            value={stats.completed}
            icon={<CheckCircle />}
            color="#10b981"
            subtitle={`${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% معدل الإنجاز`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="حصص متأخرة"
            value={stats.delayed}
            icon={<Warning />}
            color="#ef4444"
            subtitle="حصص سابقة غير مكتملة"
            isClickable={stats.delayed > 0}
            onClick={() => stats.delayed > 0 && setShowDelayedDetails(!showDelayedDetails)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="حصص قادمة"
            value={stats.planned}
            icon={<Schedule />}
            color="#f59e0b"
            subtitle="مخطط لها"
          />
        </Grid>
      </Grid>

      {/* Delayed Lessons Details Section */}
      <Collapse in={showDelayedDetails}>
        <Paper sx={{ p: 2, mb: 4, bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#991b1b', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventBusy />
            قائمة الحصص المتأخرة ({stats.delayed})
          </Typography>
          <Grid container spacing={2}>
            {stats.delayedLessonsList.map((lesson) => (
              <Grid item xs={12} sm={6} md={4} key={lesson.id}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    borderLeft: '4px solid #ef4444',
                    position: 'relative',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {lesson.customTitle && !lesson.customTitle.includes('???') ? lesson.customTitle : 'عنوان غير متوفر (اضغط للتعديل)'}
                      </Typography>
                      <Typography variant="caption" display="block" color="textSecondary">
                        {lesson.subject && !lesson.subject.includes('???') ? lesson.subject : 'مادة غير محددة'}
                      </Typography>
                    </Box>
                    {onEditLesson && (
                      <Box>
                        <Tooltip title="تعديل الحصة">
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              const adapted = migrateLessonToAdapted(lesson);
                              if (adapted) onEditLesson(adapted);
                            }}
                            sx={{ bgcolor: 'rgba(0,0,0,0.04)', mr: 1 }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {onDeleteLesson && (
                          <Tooltip title="حذف الحصة">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => {
                                if (window.confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
                                  onDeleteLesson(lesson.id);
                                }
                              }}
                              sx={{ bgcolor: 'rgba(255,0,0,0.04)' }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip 
                      label={format(parseISO(lesson.date), 'EEEE d MMMM', { locale: ar })} 
                      size="small" 
                      color="error" 
                      variant="outlined" 
                    />
                    <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 'bold' }}>
                      {lesson.progress || 0}% منجز
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Collapse>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              تقدم المناهج حسب المادة (المجدول vs المكتمل)
            </Typography>
            <Box sx={{ height: 350 }} dir="ltr">
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="bar"
                height="100%"
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              توزيع الحالة
            </Typography>
            <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }} dir="ltr">
              <Chart
                options={{
                  labels: ['مكتمل', 'متأخر', 'قادم'],
                  colors: ['#10b981', '#ef4444', '#f59e0b'],
                  legend: { position: 'bottom', fontFamily: 'Cairo, sans-serif' },
                  dataLabels: { style: { fontFamily: 'Cairo, sans-serif' } },
                  tooltip: { style: { fontFamily: 'Cairo, sans-serif' } }
                }}
                series={[stats.completed, stats.delayed, stats.planned]}
                type="donut"
                width="100%"
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LearningAnalytics;
