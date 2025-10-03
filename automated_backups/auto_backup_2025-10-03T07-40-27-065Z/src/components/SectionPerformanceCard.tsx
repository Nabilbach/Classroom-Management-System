import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
} from '@mui/material';
import { SectionPerformanceData } from '../utils/dashboardUtils';
import { FaCheckCircle, FaHourglassHalf, FaClipboardList, FaArrowUp, FaArrowDown, FaExclamationTriangle } from 'react-icons/fa';

interface SectionPerformanceCardProps {
  data: SectionPerformanceData;
}

function SectionPerformanceCard({ data }: SectionPerformanceCardProps) {
  const getStatusColor = (status: 'on-track' | 'behind' | 'critical') => {
    switch (status) {
      case 'on-track': return 'success';
      case 'behind': return 'warning';
      case 'critical': return 'error';
      default: return 'primary';
    }
  };

  const getStatusIcon = (status: 'on-track' | 'behind' | 'critical') => {
    switch (status) {
      case 'on-track': return '🟢';
      case 'behind': return '🟡';
      case 'critical': return '🔴';
      default: return '';
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h5" color="blue-gray" className="font-bold">
            {data.sectionName}
          </Typography>
          <div className="flex items-center gap-2">
            <Typography variant="h6" color="blue-gray">
              {data.overallProgress}%
            </Typography>
            <span className="text-xl">{getStatusIcon(data.status)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <LinearProgress variant="determinate" value={data.overallProgress} color={getStatusColor(data.status)} className="mb-4" />

        {/* Lesson Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          <div className="flex flex-col items-center">
            <FaCheckCircle className="text-green-500 text-lg" />
            <Typography variant="small" color="blue-gray">مكتملة</Typography>
            <Typography variant="h6" color="blue-gray">{data.completedLessons}</Typography>
          </div>
          <div className="flex flex-col items-center">
            <FaHourglassHalf className="text-amber-500 text-lg" />
            <Typography variant="small" color="blue-gray">قيد الإنجاز</Typography>
            <Typography variant="h6" color="blue-gray">{data.inProgressLessons}</Typography>
          </div>
          <div className="flex flex-col items-center">
            <FaClipboardList className="text-blue-500 text-lg" />
            <Typography variant="small" color="blue-gray">مخططة</Typography>
            <Typography variant="h6" color="blue-gray">{data.plannedLessons}</Typography>
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="flex items-center justify-between mb-4">
          <Typography variant="small" color="blue-gray" className="font-bold">مؤشر السرعة (آخر 7 أيام):</Typography>
          <div className="flex items-center gap-1">
            {data.weeklyTrend > 0 ? (
              <FaArrowUp className="text-green-500" />
            ) : data.weeklyTrend < 0 ? (
              <FaArrowDown className="text-red-500" />
            ) : null}
            <Typography variant="small" color="blue-gray">{data.weeklyTrend}%</Typography>
          </div>
        </div>

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <div className="space-y-2">
            {data.alerts.map((alert, index) => (
              <Chip
                key={index}
                variant="outlined" // "ghost" is not a direct equivalent, "outlined" is closest
                color="error" // "red" becomes "error"
                label={ // "value" becomes "label"
                  <div className="flex items-center gap-2">
                    <FaExclamationTriangle className="text-red-500" />
                    <Typography variant="caption" color="error" className="font-medium"> // "small" becomes "caption"
                      {alert}
                    </Typography>
                  </div>
                }
                sx={{ width: '100%', justifyContent: 'center' }} // className becomes sx prop
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SectionPerformanceCard;
