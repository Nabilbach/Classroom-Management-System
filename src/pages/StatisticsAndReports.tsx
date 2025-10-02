
import React, { useMemo, useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  Typography, 
  Select, 
  MenuItem, 
  Box, 
  Tabs, 
  Tab, 
  Grid, 
  Chip,
  IconButton,
  Tooltip,
  Paper,
  LinearProgress
} from '@mui/material';
import { 
  TrendingUp, 
  Assessment, 
  Download, 
  FilterList, 
  Today, 
  CalendarMonth, 
  Analytics,
  PieChart,
  BarChart,
  Timeline
} from '@mui/icons-material';
import { useCurriculum } from '../contexts/CurriculumContext';
import { useSections } from '../contexts/SectionsContext';
import { useStudents } from '../contexts/StudentsContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// تعريف نوع البيانات لسجل التقدم
type ProgressDataItem = {
  date: string;
  time: string;
  section: string;
  content: string;
  notes: string;
};

// نموذج الأعمدة لسجل التقدم في الدروس
const progressColumns = [
  { title: 'التاريخ', dataKey: 'date' as keyof ProgressDataItem },
  { title: 'التوقيت', dataKey: 'time' as keyof ProgressDataItem },
  { title: 'القسم', dataKey: 'section' as keyof ProgressDataItem },
  { title: 'تفصيل الموضوع / المحتوى', dataKey: 'content' as keyof ProgressDataItem },
  { title: 'التوقيع / الملاحظات', dataKey: 'notes' as keyof ProgressDataItem },
];

// واجهة البيانات الجديدة
interface AttendanceData {
  id: number;
  studentId: number;
  sectionId: string;
  date: string;
  isPresent: boolean;
  student?: {
    firstName: string;
    lastName: string;
  };
}

interface AttendanceStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
  weeklyTrend: number[];
}

const StatisticsAndReports: React.FC = () => {
  // جلب البيانات من السياقات
  const { lessons } = useCurriculum();
  const { sections } = useSections();
  const { students } = useStudents();

  // حالة التبويبات والفلاتر
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(false);

  // جلب بيانات الحضور من API الأساسي مباشرة
  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      // تحديد التاريخ بناءً على الفترة المختارة
      let dateParam = '';
      const today = new Date().toISOString().split('T')[0];
      
      switch (selectedDateRange) {
        case 'today':
          dateParam = `date=${today}`;
          break;
        case 'week':
          // جلب بيانات الأسبوع الحالي
          dateParam = `date=${today}`;
          break;
        case 'month':
          // جلب بيانات الشهر الحالي
          dateParam = `date=${today}`;
          break;
        default:
          dateParam = `date=${today}`;
      }
      
      const sectionParam = selectedSection !== 'all' ? `&sectionId=${selectedSection}` : '';
      const response = await fetch(`/api/attendance?${dateParam}${sectionParam}`);
      const data = await response.json();
      
      // تحويل البيانات للتنسيق المطلوب
      const formattedData: AttendanceData[] = data.map((record: any) => ({
        id: record.id,
        studentId: record.studentId,
        sectionId: record.sectionId,
        date: record.date,
        isPresent: record.isPresent,
        student: {
          firstName: record.student?.firstName || '',
          lastName: record.student?.lastName || ''
        }
      }));
      
      setAttendanceData(formattedData);
      
      // جلب الإحصائيات أيضاً
      await fetchAttendanceStats();
      
    } catch (error) {
      console.error('خطأ في جلب بيانات الحضور:', error);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  // تشغيل جلب البيانات عند تغيير الفلاتر
  useEffect(() => {
    fetchAttendanceData();
  }, [selectedSection, selectedDateRange]);

  // حساب الإحصائيات السريعة
  const quickStats = useMemo((): AttendanceStats => {
    const totalStudents = students.length;
    const presentToday = attendanceData.filter(record => record.isPresent).length;
    const absentToday = attendanceData.filter(record => !record.isPresent).length;
    const attendanceRate = totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0;
    
    // حساب الاتجاه الأسبوعي من بيانات الحضور الحقيقية
    const weeklyTrend: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayAttendance = attendanceData.filter(record => record.date === date.toISOString().split('T')[0]);
      const dayRate = dayAttendance.length > 0 ? 
        Math.round((dayAttendance.filter(r => r.isPresent).length / dayAttendance.length) * 100) : 0;
      weeklyTrend.push(dayRate);
    }
    
    return {
      totalStudents,
      presentToday,
      absentToday,
      attendanceRate,
      weeklyTrend
    };
  }, [students, attendanceData]);

  // تجهيز بيانات سجل التقدم (دفتر النصوص)
  const progressData: ProgressDataItem[] = useMemo(() => {
    // في حال عدم توفر بيانات كافية، نستخدم بيانات تجريبية
    if (!lessons || lessons.length === 0) {
      return [
        { date: '2025-09-21', time: '08:00', section: 'TCSF-1', content: 'درس تجريبي', notes: '' },
      ];
    }
    // تصفية حسب القسم والفترة الزمنية
    return lessons
      .filter(lesson => {
        const sectionMatch = selectedSection === 'all' || lesson.assignedSections?.includes(selectedSection);
        const dateMatch = (!startDate || lesson.date >= startDate) && (!endDate || lesson.date <= endDate);
        return sectionMatch && dateMatch;
      })
      .map(lesson => ({
        date: lesson.date,
        time: lesson.estimatedSessions ? `${lesson.estimatedSessions * 60} دقيقة` : '',
        section: lesson.assignedSections?.[0] || '',
        content: lesson.title,
        notes: '',
      }));
  }, [lessons, selectedSection, startDate, endDate]);

  // دالة توليد PDF مطابق للنموذج الورقي
  const handleDownloadProgressPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    
    // تحسين الخط والعنوان
    doc.setFont('Times', 'bold');
    doc.setFontSize(16);
    doc.text('سجل التقدم في الدروس', 400, 40, { align: 'center' });
    
    // إضافة معلومات إضافية
    doc.setFont('Times', 'normal');
    doc.setFontSize(12);
    doc.text(`التاريخ: ${new Date().toLocaleDateString('ar-EG')}`, 50, 70);
    if (selectedSection !== 'all') {
      const section = sections.find(s => s.id === selectedSection);
      doc.text(`القسم: ${section?.name || ''}`, 300, 70);
    }
    
    autoTable(doc, {
      head: [progressColumns.map(col => col.title)],
      body: progressData.map(row => progressColumns.map(col => row[col.dataKey] || '')),
      startY: 90,
      styles: { 
        font: 'Times', 
        halign: 'center', 
        fontSize: 10,
        cellPadding: 8,
        lineColor: [0, 0, 0],
        lineWidth: 1
      },
      headStyles: { 
        fillColor: [240, 240, 240], // لون رمادي فاتح للرؤوس
        textColor: [0, 0, 0], // نص أسود
        halign: 'center',
        fontStyle: 'bold',
        fontSize: 11
      },
      columnStyles: { 
        0: { cellWidth: 80, halign: 'center' }, // التاريخ
        1: { cellWidth: 70, halign: 'center' }, // التوقيت  
        2: { cellWidth: 80, halign: 'center' }, // القسم
        3: { cellWidth: 300, halign: 'right' }, // المحتوى - محاذاة يمين
        4: { cellWidth: 150, halign: 'center' } // الملاحظات
      },
      margin: { left: 50, right: 50 },
      theme: 'grid', // استخدام تصميم الشبكة
      tableLineColor: [0, 0, 0],
      tableLineWidth: 1
    });
    
    doc.save('سجل-التقدم-في-الدروس.pdf');
  };

  // حساب نسبة الإنجاز لكل قسم ومادة
  const sectionStats = useMemo(() => {
    if (!lessons || lessons.length === 0) return [];
    const stats: Record<string, { total: number; completed: number; courseName?: string }> = {};
    lessons.forEach(lesson => {
      lesson.assignedSections?.forEach(sectionId => {
        if (!stats[sectionId]) stats[sectionId] = { total: 0, completed: 0, courseName: lesson.courseName };
        stats[sectionId].total++;
        if (lesson.completionStatus && lesson.completionStatus[sectionId] === 'completed') stats[sectionId].completed++;
      });
    });
    return Object.entries(stats).map(([sectionId, stat]) => {
      const section = sections.find(s => s.id === sectionId);
      return {
        sectionName: section?.name || sectionId,
        courseName: stat.courseName || '',
        total: stat.total,
        completed: stat.completed,
        percent: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
      };
    });
  }, [lessons, sections]);

  // إحصائيات الحضور الحقيقية من قاعدة البيانات
  const [attendanceStats, setAttendanceStats] = useState<any>({ sectionAttendance: [], mostAbsent: [] });
  
  // جلب إحصائيات الحضور الحقيقية
  const fetchAttendanceStats = async () => {
    try {
      // جلب البيانات من API الحضور المباشر
      const today = new Date().toISOString().split('T')[0];
      
      // حساب إحصائيات الأقسام من البيانات الموجودة
      const sectionAttendance = await Promise.all(
        sections.map(async (section) => {
          try {
            const response = await fetch(`/api/attendance?date=${today}&sectionId=${section.id}`);
            const data = await response.json();
            const total = data.length;
            const present = data.filter((record: any) => record.isPresent).length;
            const percent = total > 0 ? Math.round((present / total) * 100) : 0;
            
            return {
              sectionName: section.name,
              percent,
              total,
              present,
              absent: total - present
            };
          } catch (error) {
            console.error(`خطأ في جلب بيانات القسم ${section.name}:`, error);
            return { sectionName: section.name, percent: 0, total: 0, present: 0, absent: 0 };
          }
        })
      );

      // حساب الطلاب الأكثر غياباً من البيانات الحقيقية
      const mostAbsent = await Promise.all(
        students.slice(0, 10).map(async (student) => {
          try {
            // جلب سجل الحضور للطالب من بداية الشهر
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            const monthStart = startOfMonth.toISOString().split('T')[0];
            
            const response = await fetch(`/api/attendance?studentId=${student.id}&startDate=${monthStart}`);
            const data = await response.json();
            const absences = data.filter((record: any) => !record.isPresent).length;
            
            return {
              name: `${student.firstName} ${student.lastName}`,
              absences
            };
          } catch (error) {
            return {
              name: `${student.firstName} ${student.lastName}`,
              absences: 0
            };
          }
        })
      );

      // ترتيب حسب عدد الغيابات وأخذ أعلى 5
      const sortedAbsent = mostAbsent
        .filter(student => student.absences > 0)
        .sort((a, b) => b.absences - a.absences)
        .slice(0, 5);

      setAttendanceStats({ sectionAttendance, mostAbsent: sortedAbsent });
    } catch (error) {
      console.error('خطأ في جلب إحصائيات الحضور:', error);
      setAttendanceStats({ sectionAttendance: [], mostAbsent: [] });
    }
  };

  // تشغيل جلب الإحصائيات عند تغيير الطلاب أو الأقسام
  useEffect(() => {
    if (students.length > 0 && sections.length > 0) {
      fetchAttendanceStats();
    }
  }, [students, sections, selectedSection]);

  // مؤشرات الأداء والتنبيهات الذكية
  const performanceAlerts = useMemo(() => {
    const alerts: { type: 'warning' | 'danger' | 'info'; message: string; suggestion: string }[] = [];
    
    // تحليل إنجاز الأقسام
    sectionStats.forEach(stat => {
      if (stat.percent < 50) {
        alerts.push({
          type: 'danger',
          message: `قسم ${stat.sectionName} متأخر في الإنجاز (${stat.percent}%)`,
          suggestion: 'ينصح بجدولة حصص إضافية أو مراجعة طريقة التدريس'
        });
      } else if (stat.percent < 75) {
        alerts.push({
          type: 'warning',
          message: `قسم ${stat.sectionName} يحتاج متابعة (${stat.percent}%)`,
          suggestion: 'ينصح بمتابعة أكثر وتحفيز الطلاب'
        });
      }
    });

    // تحليل الحضور
    attendanceStats.sectionAttendance.forEach(stat => {
      if (stat.percent < 80) {
        alerts.push({
          type: 'warning',
          message: `نسبة حضور منخفضة في قسم ${stat.sectionName} (${stat.percent}%)`,
          suggestion: 'ينصح بالتواصل مع أولياء الأمور ومتابعة أسباب الغياب'
        });
      }
    });

    // إضافة معلومات مفيدة
    if (sectionStats.length > 0) {
      const avgProgress = Math.round(sectionStats.reduce((sum, stat) => sum + stat.percent, 0) / sectionStats.length);
      alerts.push({
        type: 'info',
        message: `متوسط الإنجاز العام: ${avgProgress}%`,
        suggestion: avgProgress > 80 ? 'أداء ممتاز! استمر في هذا المعدل' : 'يمكن تحسين الأداء العام'
      });
    }

    return alerts;
  }, [sectionStats, attendanceStats]);

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }} dir="rtl">
      {/* Header Section */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Assessment sx={{ fontSize: 40 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              الإحصائيات والتقارير
            </Typography>
          </Box>
          <Chip 
            label={`آخر تحديث: ${new Date().toLocaleTimeString('ar-EG')}`} 
            sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
        </Box>
        
        {/* Quick Filters */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select 
            value={selectedSection} 
            onChange={e => setSelectedSection(e.target.value)}
            sx={{ minWidth: 150, backgroundColor: 'white', borderRadius: 1 }}
            size="small"
          >
            <MenuItem value="all">جميع الأقسام</MenuItem>
            {sections.map(section => (
              <MenuItem key={section.id} value={section.id}>{section.name}</MenuItem>
            ))}
          </Select>
          
          <Select 
            value={selectedDateRange} 
            onChange={e => setSelectedDateRange(e.target.value)}
            sx={{ minWidth: 150, backgroundColor: 'white', borderRadius: 1 }}
            size="small"
          >
            <MenuItem value="today">اليوم</MenuItem>
            <MenuItem value="week">هذا الأسبوع</MenuItem>
            <MenuItem value="month">هذا الشهر</MenuItem>
            <MenuItem value="custom">فترة مخصصة</MenuItem>
          </Select>
          
          <Tooltip title="تحديث البيانات">
            <IconButton 
              onClick={fetchAttendanceData} 
              sx={{ color: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <TrendingUp />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Loading State */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Quick Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)', color: 'white' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {quickStats.totalStudents}
            </Typography>
            <Typography variant="body1">إجمالي الطلاب</Typography>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)', color: 'white' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {quickStats.presentToday}
            </Typography>
            <Typography variant="body1">حاضر اليوم</Typography>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)', color: 'white' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {quickStats.absentToday}
            </Typography>
            <Typography variant="body1">غائب اليوم</Typography>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)', color: 'white' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              %{quickStats.attendanceRate}
            </Typography>
            <Typography variant="body1">معدل الحضور</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(_, newValue) => setCurrentTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<Today />} label="التقارير اليومية" />
          <Tab icon={<CalendarMonth />} label="التقارير الأسبوعية" />
          <Tab icon={<Analytics />} label="التقارير الشهرية" />
          <Tab icon={<PieChart />} label="التحليلات" />
          <Tab icon={<BarChart />} label="المقارنات" />
          <Tab icon={<Timeline />} label="دفتر النصوص" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {currentTab === 0 && <DailyReportsTab attendanceData={attendanceData} />}
        {currentTab === 1 && <WeeklyReportsTab />}
        {currentTab === 2 && <MonthlyReportsTab />}
        {currentTab === 3 && <AnalyticsTab sectionStats={sectionStats} attendanceStats={attendanceStats} />}
        {currentTab === 4 && <ComparisonsTab />}
        {currentTab === 5 && <TextbookTab progressData={progressData} onDownloadPDF={handleDownloadProgressPDF} />}
      </Box>

      {/* Export Tools */}
      <Paper sx={{ p: 2, mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button 
          variant="contained" 
          startIcon={<Download />}
          onClick={handleDownloadProgressPDF}
          sx={{ minWidth: 150 }}
        >
          تصدير PDF
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<Download />}
          sx={{ minWidth: 150 }}
        >
          تصدير Excel
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<FilterList />}
          sx={{ minWidth: 150 }}
        >
          تقرير مخصص
        </Button>
      </Paper>
    </Box>
  );
}

// مكون التقارير اليومية
const DailyReportsTab: React.FC<{ attendanceData: AttendanceData[] }> = ({ attendanceData }) => (
  <Grid container spacing={2}>
    <Grid item xs={12} md={8}>
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Today />
          تقرير الحضور اليومي
        </Typography>
        <Box sx={{ mt: 2 }}>
          {attendanceData.length > 0 ? (
            attendanceData.map((record) => (
              <Box 
                key={record.id} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'between', 
                  alignItems: 'center', 
                  p: 1, 
                  borderBottom: '1px solid #eee' 
                }}
              >
                <Typography>
                  {record.student?.firstName} {record.student?.lastName}
                </Typography>
                <Chip 
                  label={record.isPresent ? 'حاضر' : 'غائب'}
                  color={record.isPresent ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            ))
          ) : (
            <Typography color="textSecondary">لا توجد بيانات حضور لليوم</Typography>
          )}
        </Box>
      </Card>
    </Grid>
    <Grid item xs={12} md={4}>
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>إحصائيات سريعة</Typography>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
            {attendanceData.length > 0 ? 
              Math.round((attendanceData.filter(r => r.isPresent).length / attendanceData.length) * 100) : 0
            }%
          </Typography>
          <Typography color="textSecondary">معدل الحضور اليوم</Typography>
        </Box>
      </Card>
    </Grid>
  </Grid>
);

// مكون التقارير الأسبوعية  
const WeeklyReportsTab: React.FC = () => (
  <Card sx={{ p: 3 }}>
    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
      <CalendarMonth />
      التقارير الأسبوعية
    </Typography>
    <Typography color="textSecondary">قريباً - سيتم إضافة التقارير الأسبوعية والمخططات البيانية</Typography>
  </Card>
);

// مكون التقارير الشهرية
const MonthlyReportsTab: React.FC = () => (
  <Card sx={{ p: 3 }}>
    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
      <Analytics />
      التقارير الشهرية  
    </Typography>
    <Typography color="textSecondary">قريباً - سيتم إضافة التقارير الشهرية والإحصائيات المتقدمة</Typography>
  </Card>
);

// مكون التحليلات - محدث ليستخدم المخططات البيانية
const AnalyticsTab: React.FC<{ sectionStats: any; attendanceStats: any }> = ({ sectionStats, attendanceStats }) => {
  // استيراد مكون المخططات بشكل ديناميكي لتجنب مشاكل SSR
  const [ChartsComponent, setChartsComponent] = useState<React.ComponentType | null>(null);
  
  useEffect(() => {
    import('../components/AttendanceCharts').then((module) => {
      setChartsComponent(() => module.default);
    });
  }, []);

  return (
    <Box>
      {/* المخططات البيانية المتقدمة */}
      {ChartsComponent && <ChartsComponent />}
      
      {/* الإحصائيات التقليدية */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>إنجاز الأقسام</Typography>
            {sectionStats.map((stat: any) => (
              <Box key={stat.sectionName} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'between', mb: 1 }}>
                  <Typography>{stat.sectionName}</Typography>
                  <Typography>{stat.percent}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stat.percent} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            ))}
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>الطلاب الأكثر غياباً</Typography>
            {attendanceStats.mostAbsent.map((student: any, index: number) => (
              <Box key={student.name} sx={{ display: 'flex', justifyContent: 'between', mb: 1 }}>
                <Typography>{student.name}</Typography>
                <Chip label={`${student.absences} أيام`} color="warning" size="small" />
              </Box>
            ))}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// مكون المقارنات
const ComparisonsTab: React.FC = () => (
  <Card sx={{ p: 3 }}>
    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
      <BarChart />
      المقارنات والتحليلات
    </Typography>
    <Typography color="textSecondary">قريباً - سيتم إضافة مخططات المقارنة بين الأقسام والفترات الزمنية</Typography>
  </Card>
);

// مكون دفتر النصوص
const TextbookTab: React.FC<{ progressData: any[]; onDownloadPDF: () => void }> = ({ progressData, onDownloadPDF }) => (
  <Card sx={{ p: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Timeline />
        سجل التقدم في الدروس
      </Typography>
      <Button variant="contained" onClick={onDownloadPDF} startIcon={<Download />}>
        تحميل PDF
      </Button>
    </Box>
    <Box sx={{ overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '12px', border: '1px solid #ddd' }}>التاريخ</th>
            <th style={{ padding: '12px', border: '1px solid #ddd' }}>التوقيت</th>
            <th style={{ padding: '12px', border: '1px solid #ddd' }}>القسم</th>
            <th style={{ padding: '12px', border: '1px solid #ddd' }}>المحتوى</th>
            <th style={{ padding: '12px', border: '1px solid #ddd' }}>الملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {progressData.map((row, idx) => (
            <tr key={idx}>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{row.date}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{row.time}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{row.section}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{row.content}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{row.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  </Card>
);

export default StatisticsAndReports;
