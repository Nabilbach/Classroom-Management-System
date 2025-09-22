
import React, { useMemo, useState } from 'react';
import { Button, Card, Typography, Select, MenuItem } from '@mui/material';
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

const StatisticsAndReports: React.FC = () => {
  // جلب البيانات من السياقات
  const { lessons } = useCurriculum();
  const { sections } = useSections();
  const { students } = useStudents();

  // خيارات التصفية
  const [selectedSection, setSelectedSection] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  // تقرير الحضور للطلاب (بيانات تجريبية)
  const attendanceStats = useMemo(() => {
    // في حال عدم توفر بيانات حضور، نستخدم بيانات تجريبية
    if (!students || students.length === 0) return { sectionAttendance: [], mostAbsent: [] };
    // مثال: كل طالب لديه عدد أيام غياب عشوائي
    const sectionAttendance: { sectionName: string; percent: number }[] = sections.map(section => ({
      sectionName: section.name,
      percent: Math.floor(Math.random() * 30) + 70 // نسبة حضور عشوائية بين 70% و99%
    }));
    // الطلاب الأكثر غياباً
    const mostAbsent = students.slice(0, 5).map(st => ({
      name: `${st.firstName} ${st.lastName}`,
      absences: Math.floor(Math.random() * 10) + 1
    }));
    return { sectionAttendance, mostAbsent };
  }, [students, sections]);

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
    <div className="p-6" dir="rtl">
      <Typography variant="h4" className="mb-6 font-bold text-right">الإحصائيات والتقارير</Typography>
      
      {/* مؤشرات الأداء والتنبيهات الذكية */}
      {performanceAlerts.length > 0 && (
        <Card className="p-4 mb-6">
          <Typography variant="h6" className="mb-4">مؤشرات الأداء والتنبيهات الذكية</Typography>
          <div className="space-y-3">
            {performanceAlerts.map((alert, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border-l-4 ${
                  alert.type === 'danger' ? 'bg-red-50 border-red-500' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <Typography variant="subtitle2" className={`font-bold ${
                  alert.type === 'danger' ? 'text-red-700' :
                  alert.type === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>
                  {alert.message}
                </Typography>
                <Typography variant="body2" className="text-gray-600 mt-1">
                  💡 {alert.suggestion}
                </Typography>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* بطاقات إنجاز الأقسام */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {sectionStats.length === 0 ? (
          <Card className="p-4 text-center">لا توجد بيانات إنجاز للأقسام حالياً.</Card>
        ) : (
          sectionStats.map(stat => (
            <Card key={stat.sectionName} className="p-4 flex flex-col items-center justify-center">
              <Typography variant="h6" className="mb-2">{stat.sectionName}</Typography>
              <Typography variant="body2" color="textSecondary" className="mb-1">{stat.courseName}</Typography>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div className="bg-green-500 h-3 rounded-full" style={{ width: `${stat.percent}%` }}></div>
              </div>
              <Typography variant="body2">{stat.completed} من {stat.total} مكتملة</Typography>
              <Typography variant="body2" color="primary">{stat.percent}% إنجاز</Typography>
            </Card>
          ))
        )}
      </div>

      {/* تقرير الحضور */}
      <Typography variant="h5" className="mb-4 font-bold text-right">تقرير الحضور للطلاب</Typography>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <Typography variant="subtitle1" className="mb-2">نسب الحضور حسب القسم</Typography>
          {attendanceStats.sectionAttendance.map(stat => (
            <div key={stat.sectionName} className="mb-2 flex items-center justify-between">
              <span>{stat.sectionName}</span>
              <div className="w-32 bg-gray-200 rounded-full h-3 mx-2">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${stat.percent}%` }}></div>
              </div>
              <span>{stat.percent}%</span>
            </div>
          ))}
        </Card>
        <Card className="p-4">
          <Typography variant="subtitle1" className="mb-2">الطلاب الأكثر غياباً</Typography>
          <ul className="list-disc pr-4">
            {attendanceStats.mostAbsent.map(st => (
              <li key={st.name} className="mb-1">{st.name} - {st.absences} أيام غياب</li>
            ))}
          </ul>
        </Card>
      </div>

      {/* سجل التقدم في الدروس */}
      <Card className="p-4 mb-6">
        <Typography variant="h6" className="mb-4">سجل التقدم في الدروس (دفتر النصوص)</Typography>
        {/* خيارات التصفية */}
        <div className="flex gap-4 mb-4 items-center">
          <Select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} displayEmpty>
            <MenuItem value="all">كل الأقسام</MenuItem>
            {sections.map(section => (
              <MenuItem key={section.id} value={section.id}>{section.name}</MenuItem>
            ))}
          </Select>
          <div className="flex gap-2 items-center">
            <label>من:</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <label>إلى:</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
        <Button variant="contained" color="primary" onClick={handleDownloadProgressPDF}>
          تنزيل سجل التقدم PDF
        </Button>
        {/* عرض جدول مصغر */}
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full border text-right">
            <thead className="bg-blue-100">
              <tr>
                {progressColumns.map(col => (
                  <th key={col.dataKey} className="p-2 border font-bold">{col.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {progressData.map((row, idx) => (
                <tr key={idx}>
                  {progressColumns.map(col => (
                    <td key={col.dataKey} className="p-2 border">{row[col.dataKey]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {/* يمكن إضافة Tabs أو Cards لباقي الإحصائيات والتقارير لاحقاً */}
    </div>
  );
}

export default StatisticsAndReports;
