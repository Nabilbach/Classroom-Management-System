import React, { useMemo } from 'react';
import { Box, Typography, Card, CardContent, Grid, LinearProgress } from '@mui/material';
import { CheckCircle, Schedule, PlayCircle, PauseCircle } from '@mui/icons-material';
import { ScheduledLesson } from '../types/lessonLogTypes';
import { groupLessonsByLesson, calculateLessonsStatistics, LessonGroup } from '../utils/lessonCompletionUtils';

interface LessonStatisticsProps {
  scheduledLessons: ScheduledLesson[];
}

const LessonStatistics: React.FC<LessonStatisticsProps> = ({ scheduledLessons }) => {
  // تجميع الحصص في دروس وحساب الإحصائيات
  const { lessonGroups, statistics } = useMemo(() => {
    const groups = groupLessonsByLesson(scheduledLessons);
    const stats = calculateLessonsStatistics(groups);
    return { lessonGroups: groups, statistics: stats };
  }, [scheduledLessons]);

  const statCards = [
    {
      title: 'إجمالي الدروس',
      value: statistics.total,
      icon: <Schedule color="primary" />,
      color: 'primary.main',
      bgcolor: 'primary.50'
    },
    {
      title: 'دروس مكتملة',
      value: statistics.completed,
      icon: <CheckCircle color="success" />,
      color: 'success.main',
      bgcolor: 'success.50'
    },
    {
      title: 'دروس قيد التنفيذ',
      value: statistics.inProgress,
      icon: <PlayCircle color="warning" />,
      color: 'warning.main',
      bgcolor: 'warning.50'
    },
    {
      title: 'دروس لم تبدأ',
      value: statistics.notStarted,
      icon: <PauseCircle color="error" />,
      color: 'error.main',
      bgcolor: 'error.50'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        إحصائيات الدروس
      </Typography>
      
      {/* الإحصائيات العامة */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ 
              bgcolor: stat.bgcolor,
              border: `1px solid ${stat.color}`,
              '&:hover': { boxShadow: 3 }
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ mb: 1 }}>
                  {stat.icon}
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: stat.color }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* شريط التقدم العام */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            نسبة إكمال الدروس
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={statistics.completionPercentage} 
              sx={{ 
                flexGrow: 1, 
                height: 10, 
                borderRadius: 5,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  bgcolor: 'success.main'
                }
              }} 
            />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
              {statistics.completionPercentage}%
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* تفاصيل الدروس */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        تفاصيل الدروس
      </Typography>
      
      <Grid container spacing={2}>
        {lessonGroups.map((lesson) => (
          <Grid item xs={12} md={6} key={lesson.lessonGroupId}>
            <Card sx={{ 
              border: `2px solid ${
                lesson.completionStatus === 'completed' ? 'success.main' : 
                lesson.completionStatus === 'in-progress' ? 'warning.main' : 
                'grey.300'
              }`,
              bgcolor: lesson.completionStatus === 'completed' ? 'success.50' : 
                       lesson.completionStatus === 'in-progress' ? 'warning.50' : 
                       'grey.50'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
                    {lesson.lessonTitle}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      bgcolor: lesson.completionStatus === 'completed' ? 'success.main' : 
                               lesson.completionStatus === 'in-progress' ? 'warning.main' : 
                               'grey.500',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontWeight: 'bold'
                    }}
                  >
                    {lesson.completionStatus === 'completed' ? 'مكتمل' : 
                     lesson.completionStatus === 'in-progress' ? 'قيد التنفيذ' : 
                     'لم يبدأ'}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  عدد الحصص: {lesson.sessions.length}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    المراحل الرئيسية: {lesson.coreStages.filter(s => s.isCompleted).length} / {lesson.coreStages.length}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={lesson.overallProgress} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        bgcolor: lesson.completionStatus === 'completed' ? 'success.main' : 
                                 lesson.completionStatus === 'in-progress' ? 'warning.main' : 
                                 'grey.500'
                      }
                    }} 
                  />
                </Box>
                
                <Typography variant="caption" color="text.secondary">
                  تواريخ الحصص: {lesson.sessions.map(s => new Date(s.date).toISOString().slice(0,10)).join(', ')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default LessonStatistics;