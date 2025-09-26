import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Typography, 
  Box, 
  Grid, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  CircularProgress,
  Chip
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Assessment, School, Person } from '@mui/icons-material';

interface WeeklyTrendData {
  date: string;
  dayOfWeek: string;
  present: number;
  total: number;
  rate: number;
}

interface SectionStats {
  sectionName: string;
  total: number;
  present: number;
  absent: number;
  rate: number;
}

const AttendanceCharts: React.FC = () => {
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrendData[]>([]);
  const [sectionStats, setSectionStats] = useState<SectionStats[]>([]);
  const [selectedSection, setSelectedSection] = useState('all');
  const [loading, setLoading] = useState(false);

  // ألوان للمخططات
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  // جلب بيانات الاتجاه الأسبوعي
  const fetchWeeklyTrend = async () => {
    try {
      const response = await fetch(`/api/attendance-reports/weekly-trend?sectionId=${selectedSection}`);
      const data = await response.json();
      setWeeklyTrend(data.weeklyTrend || []);
    } catch (error) {
      console.error('خطأ في جلب الاتجاه الأسبوعي:', error);
    }
  };

  // جلب إحصائيات الأقسام
  const fetchSectionStats = async () => {
    try {
      const response = await fetch(`/api/attendance-reports/overview?period=week`);
      const data = await response.json();
      setSectionStats(data.sectionStats || []);
    } catch (error) {
      console.error('خطأ في جلب إحصائيات الأقسام:', error);
    }
  };

  // جلب البيانات عند تحميل المكون
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchWeeklyTrend(), fetchSectionStats()])
      .finally(() => setLoading(false));
  }, [selectedSection]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* فلاتر التحليل */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Assessment sx={{ color: 'primary.main' }} />
          <Typography variant="h6">تحليلات الحضور المرئية</Typography>
          
          <FormControl sx={{ minWidth: 200, mr: 'auto' }}>
            <InputLabel>اختر القسم للتحليل</InputLabel>
            <Select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              label="اختر القسم للتحليل"
            >
              <MenuItem value="all">جميع الأقسام</MenuItem>
              {sectionStats.map((section) => (
                <MenuItem key={section.sectionName} value={section.sectionName}>
                  {section.sectionName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Card>

      <Grid container spacing={3}>
        {/* مخطط الاتجاه الأسبوعي */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 3, height: 400 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">اتجاه الحضور الأسبوعي</Typography>
              <Chip 
                label={`متوسط الأسبوع: ${weeklyTrend.length > 0 ? 
                  Math.round(weeklyTrend.reduce((sum, day) => sum + day.rate, 0) / weeklyTrend.length) : 0
                }%`}
                color="primary"
                sx={{ mr: 'auto' }}
              />
            </Box>
            
            <ResponsiveContainer width="100%" height="80%">
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="dayOfWeek" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'نسبة الحضور (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, 'نسبة الحضور']}
                  labelFormatter={(label) => `يوم ${label}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  name="نسبة الحضور"
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#8884d8" 
                  strokeWidth={3}
                  dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
                  name="نسبة الحضور"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* مخطط دائري لتوزيع الحضور */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 3, height: 400 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <School sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">توزيع الحضور اليومي</Typography>
            </Box>
            
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'حاضر', value: weeklyTrend.reduce((sum, day) => sum + day.present, 0), color: '#4caf50' },
                    { name: 'غائب', value: weeklyTrend.reduce((sum, day) => sum + (day.total - day.present), 0), color: '#f44336' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[{ color: '#4caf50' }, { color: '#f44336' }].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* مخطط أعمدة مقارنة الأقسام */}
        <Grid item xs={12}>
          <Card sx={{ p: 3, height: 400 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Person sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="h6">مقارنة نسب الحضور بين الأقسام</Typography>
            </Box>
            
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={sectionStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="sectionName" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'نسبة الحضور (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'rate' ? `${value}%` : value,
                    name === 'rate' ? 'نسبة الحضور' : 
                    name === 'present' ? 'حاضر' : 
                    name === 'absent' ? 'غائب' : 'المجموع'
                  ]}
                />
                <Legend />
                <Bar dataKey="present" fill="#4caf50" name="حاضر" />
                <Bar dataKey="absent" fill="#f44336" name="غائب" />
                <Bar 
                  dataKey="rate" 
                  fill="#2196f3" 
                  name="نسبة الحضور (%)"
                  yAxisId="rate"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AttendanceCharts;