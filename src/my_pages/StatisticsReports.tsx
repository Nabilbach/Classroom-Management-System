import { Label } from '@/my_components/ui/label';
import React, { useState } from 'react';
import Button from '@/my_components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/my_components/ui/card';
import { Badge } from '@/my_components/ui/badge';
import * as XLSX from 'xlsx';

import {
  BarChart3,
  TrendingUp,
  Download,
  Mail,
  Trophy,
  Users,
  Award,
  AlertTriangle,
  Calendar,
  FileText,
  PieChart,
  Target,
  Star,
  ChevronUp,
  ChevronDown,
  Filter
} from 'lucide-react';

interface LeaderboardStudent {
  rank: number;
  name: string;
  section: string;
  totalPoints: number;
  participationPoints: number;
  behaviorPoints: number;
  homeworkPoints: number;
  badges: string[];
  starRating: number;
}

interface OverviewStats {
  totalStudents: number;
  excellentStudents: number;
  averageStudents: number;
  poorStudents: number;
  averageGrade: number;
  attendanceRate: number;
  homeworkCompletionRate: number;
  behaviorScore: number;
}

interface SectionPerformance {
  section: string;
  average: number;
  students: number;
  excellent: number;
  poor: number;
}

interface BehaviorTrend {
  month: string;
  excellent: number;
  good: number;
  poor: number;
}

interface Statistics {
  overview: OverviewStats;
  sectionPerformance: SectionPerformance[];
  behaviorTrends: BehaviorTrend[];
}

const StatisticsReports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState('overview');

  const leaderboard: LeaderboardStudent[] = [
    {
      rank: 1,
      name: 'فاطمة أحمد حسن',
      section: 'الصف الأول',
      totalPoints: 275,
      participationPoints: 95,
      behaviorPoints: 95,
      homeworkPoints: 85,
      badges: ['متفوقة', 'مبدعة', 'منتظمة'],
      starRating: 5
    },
    {
      rank: 2,
      name: 'أحمد محمد علي',
      section: 'الصف الأول',
      totalPoints: 253,
      participationPoints: 85,
      behaviorPoints: 90,
      homeworkPoints: 78,
      badges: ['مجتهد', 'متعاون'],
      starRating: 4
    },
    {
      rank: 3,
      name: 'عبدالله سالم أحمد',
      section: 'الصف الثالث',
      totalPoints: 248,
      participationPoints: 88,
      behaviorPoints: 85,
      homeworkPoints: 75,
      badges: ['مجتهد', 'مشارك'],
      starRating: 4
    },
    {
      rank: 4,
      name: 'مريم حسن محمد',
      section: 'الصف الثاني',
      totalPoints: 235,
      participationPoints: 80,
      behaviorPoints: 85,
      homeworkPoints: 70,
      badges: ['منتظمة', 'متعاونة'],
      starRating: 4
    },
    {
      rank: 5,
      name: 'يوسف علي حسن',
      section: 'الصف الرابع',
      totalPoints: 228,
      participationPoints: 75,
      behaviorPoints: 80,
      homeworkPoints: 73,
      badges: ['مجتهد'],
      starRating: 3
    }
  ];

  const statistics: Statistics = {
    overview: {
      totalStudents: 180,
      excellentStudents: 45,
      averageStudents: 127,
      poorStudents: 8,
      averageGrade: 81,
      attendanceRate: 94,
      homeworkCompletionRate: 87,
      behaviorScore: 89
    },
    sectionPerformance: [
      { section: 'الصف الأول', average: 85, students: 30, excellent: 8, poor: 1 },
      { section: 'الصف الثاني', average: 78, students: 28, excellent: 7, poor: 2 },
      { section: 'الصف الثالث', average: 88, students: 32, excellent: 9, poor: 1 },
      { section: 'الصف الرابع', average: 75, students: 29, excellent: 6, poor: 2 },
      { section: 'الصف الخامس', average: 82, students: 31, excellent: 8, poor: 1 },
      { section: 'الصف السادس', average: 80, students: 30, excellent: 7, poor: 1 }
    ],
    behaviorTrends: [
      { month: 'يناير', excellent: 38, good: 125, poor: 17 },
      { month: 'فبراير', excellent: 42, good: 128, poor: 10 },
      { month: 'مارس', excellent: 45, good: 127, poor: 8 },
      { month: 'أبريل', excellent: 47, good: 125, poor: 8 },
      { month: 'مايو', excellent: 45, good: 127, poor: 8 }
    ]
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getPerformanceColor = (average: number) => {
    if (average >= 85) return 'text-green-600';
    if (average >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceText = (average: number) => {
    if (average >= 85) return 'ممتاز';
    if (average >= 70) return 'جيد';
    return 'يحتاج تحسين';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  // Define your API base URL here (change to your actual backend URL if needed)
  const API_BASE_URL = 'http://localhost:5000';

  const exportData = async (format: string, reportType: string) => {
    if (format === 'Excel') {
      let dataToExport: any[] = [];
      let fileName = '';
      if (reportType === 'leaderboard') {
        dataToExport = leaderboard;
        fileName = 'leaderboard.xlsx';
      } else if (reportType === 'overview') {
        dataToExport = [statistics.overview];
        fileName = 'overview_report.xlsx';
      } else if (reportType === 'sectionPerformance') {
        dataToExport = statistics.sectionPerformance;
        fileName = 'section_performance_report.xlsx';
      } else if (reportType === 'behaviorTrends') {
        dataToExport = statistics.behaviorTrends;
        fileName = 'behavior_trends_report.xlsx';
      }

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, reportType);
      XLSX.writeFile(wb, fileName);
      alert(`تم تصدير ${reportType} إلى Excel بنجاح!`);
    } else if (format === 'PDF') {
      let reportData = {};
      let fileName = '';

      if (reportType === 'leaderboard') {
        reportData = { reportType: 'leaderboard', data: leaderboard };
        fileName = 'leaderboard.pdf';
      } else if (reportType === 'overview') {
        reportData = { reportType: 'overview', data: statistics.overview };
        fileName = 'overview_report.pdf';
      } else if (reportType === 'sectionPerformance') {
        reportData = { reportType: 'sectionPerformance', data: statistics.sectionPerformance };
        fileName = 'section_performance_report.pdf';
      } else if (reportType === 'behaviorTrends') {
        reportData = { reportType: 'behaviorTrends', data: statistics.behaviorTrends };
        fileName = 'behavior_trends_report.pdf';
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/generate-report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reportData),
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          alert(`تم تصدير ${reportType} إلى PDF بنجاح!`);
        } else {
          alert('حدث خطأ أثناء تصدير التقرير إلى PDF');
        }
      } catch (error) {
        console.error('Error exporting PDF:', error);
        alert('حدث خطأ أثناء تصدير التقرير إلى PDF');
      }
    }
  };

  const sendReport = () => {
    alert("سيتم إرسال التقرير إلى البريد الإلكتروني (هذه الميزة تتطلب إعدادات خادم البريد الإلكتروني)");
  };

  const OverviewReport = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">إجمالي التلاميذ</p>
                <p className="text-3xl font-bold text-blue-900">{statistics.overview.totalStudents}</p>
              </div>
              <Users className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">تلاميذ نشطون</p>
                <p className="text-3xl font-bold text-green-900">{statistics.overview.excellentStudents}</p>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <ChevronUp className="w-4 h-4" />
                  <span>{Math.round((statistics.overview.excellentStudents / statistics.overview.totalStudents) * 100)}%</span>
                </div>
              </div>
              <Award className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">مشاكل سلوكية</p>
                <p className="text-3xl font-bold text-red-900">{statistics.overview.poorStudents}</p>
                <div className="flex items-center text-xs text-red-600 mt-1">
                  <ChevronDown className="w-4 h-4" />
                  <span>{Math.round((statistics.overview.poorStudents / statistics.overview.totalStudents) * 100)}%</span>
                </div>
              </div>
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">المعدل العام</p>
                <p className={`text-3xl font-bold ${getPerformanceColor(statistics.overview.averageGrade)}`}>
                  {statistics.overview.averageGrade}%
                </p>
                <div className="flex items-center text-xs text-purple-600 mt-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>مستقر</span>
                </div>
              </div>
              <Target className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">نسبة الحضور</p>
                <p className="text-3xl font-bold text-orange-900">{statistics.overview.attendanceRate}%</p>
                <div className="flex items-center text-xs text-orange-600 mt-1">
                  <ChevronUp className="w-4 h-4" />
                  <span>+1.2%</span>
                </div>
              </div>
              <Calendar className="h-10 w-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-teal-600">نسبة إنجاز الواجبات</p>
                <p className="text-3xl font-bold text-teal-900">{statistics.overview.homeworkCompletionRate}%</p>
                <div className="flex items-center text-xs text-teal-600 mt-1">
                  <ChevronUp className="w-4 h-4" />
                  <span>+0.8%</span>
                </div>
              </div>
              <FileText className="h-10 w-10 text-teal-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-lime-50 to-lime-100 border-lime-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-lime-600">متوسط السلوك</p>
                <p className="text-3xl font-bold text-lime-900">{statistics.overview.behaviorScore}/100</p>
                <div className="flex items-center text-xs text-lime-600 mt-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>مستقر</span>
                </div>
              </div>
              <Star className="h-10 w-10 text-lime-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Performance */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">أداء الأقسام</CardTitle>
          <CardDescription className="text-gray-600">مقارنة الأداء بين الأقسام المختلفة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statistics.sectionPerformance.map((section, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-bold text-lg">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{section.section}</h3>
                    <p className="text-sm text-gray-600">{section.students} تلميذ</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 space-x-reverse">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">المعدل</p>
                    <p className={`font-bold text-lg ${getPerformanceColor(section.average)}`}>
                      {section.average}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">متفوقون</p>
                    <p className="font-bold text-lg text-green-600">{section.excellent}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">يحتاجون تحسين</p>
                    <p className="font-bold text-lg text-red-600">{section.poor}</p>
                  </div>
                  <Badge className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    section.average >= 85 ? 'bg-green-100 text-green-800' :
                    section.average >= 70 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {getPerformanceText(section.average)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Behavior Trends */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">اتجاهات السلوك</CardTitle>
          <CardDescription className="text-gray-600">تطور السلوك على مدار الأشهر الماضية</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statistics.behaviorTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg shadow-sm">
                <div className="font-medium text-gray-800">{trend.month}</div>
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">ممتاز: {trend.excellent}</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">جيد: {trend.good}</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">يحتاج تحسين: {trend.poor}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const LeaderboardReport = () => (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
          <Trophy className="h-6 w-6 ml-2 text-yellow-600" />
          لوحة الصدارة
        </CardTitle>
        <CardDescription className="text-gray-600">أفضل التلاميذ أداءً بناءً على النقاط المحصلة</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboard.map((student, index) => (
            <div key={index} className={`flex items-center justify-between p-4 rounded-lg border border-gray-200 shadow-sm ${
              student.rank === 1 ? 'bg-yellow-50' :
              student.rank === 2 ? 'bg-gray-50' :
              student.rank === 3 ? 'bg-orange-50' :
              'bg-white'
            }`}>
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                  student.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                  student.rank === 2 ? 'bg-gray-100 text-gray-800' :
                  student.rank === 3 ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {getRankIcon(student.rank)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{student.name}</h3>
                  <p className="text-sm text-gray-600">{student.section}</p>
                  <div className="flex items-center space-x-1 space-x-reverse mt-1">
                    {renderStars(student.starRating)}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-6 space-x-reverse">
                <div className="text-center">
                  <p className="text-sm text-gray-600">إجمالي النقاط</p>
                  <p className="text-xl font-bold text-blue-600">{student.totalPoints}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">المشاركة</p>
                  <p className="font-medium text-gray-800">{student.participationPoints}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">السلوك</p>
                  <p className="font-medium text-gray-800">{student.behaviorPoints}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">الواجبات</p>
                  <p className="font-medium text-gray-800">{student.homeworkPoints}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">البادجات</p>
                  <div className="flex flex-wrap gap-1">
                    {student.badges.map((badge, badgeIndex) => (
                      <Badge key={badgeIndex} variant="secondary" className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderReport = () => {
    switch (selectedReport) {
      case 'overview':
        return <OverviewReport />;
      case 'leaderboard':
        return <LeaderboardReport />;
      case 'sectionPerformance':
        return (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">أداء الأقسام</CardTitle>
              <CardDescription className="text-gray-600">مقارنة الأداء بين الأقسام المختلفة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics.sectionPerformance.map((section, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-bold text-lg">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{section.section}</h3>
                        <p className="text-sm text-gray-600">{section.students} تلميذ</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 space-x-reverse">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">المعدل</p>
                        <p className={`font-bold text-lg ${getPerformanceColor(section.average)}`}>
                          {section.average}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">متفوقون</p>
                        <p className="font-bold text-lg text-green-600">{section.excellent}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">يحتاجون تحسين</p>
                        <p className="font-bold text-lg text-red-600">{section.poor}</p>
                      </div>
                      <Badge className={`text-sm font-semibold px-3 py-1 rounded-full ${
                        section.average >= 85 ? 'bg-green-100 text-green-800' :
                        section.average >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getPerformanceText(section.average)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      case 'behaviorTrends':
        return (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">اتجاهات السلوك</CardTitle>
              <CardDescription className="text-gray-600">تطور السلوك على مدار الأشهر الماضية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics.behaviorTrends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg shadow-sm">
                    <div className="font-medium text-gray-800">{trend.month}</div>
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">ممتاز: {trend.excellent}</span>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">جيد: {trend.good}</span>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">يحتاج تحسين: {trend.poor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      default:
        return <OverviewReport />;
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الإحصائيات والتقارير</h1>
          <p className="text-gray-600 text-lg">تحليل شامل لأداء التلاميذ والأقسام الدراسية</p>
        </div>
        <div className="flex gap-3">
          <Button className="flex items-center gap-2 px-6 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors duration-300">
            <FileText className="w-5 h-5" />
            إنشاء تقرير
          </Button>
          <Button variant="outline" onClick={() => exportData('Excel', selectedReport)} className="flex items-center gap-2 px-6 py-3 text-lg border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg shadow-sm transition-colors duration-300">
            <Download className="w-5 h-5" />
            تصدير Excel
          </Button>
          <Button variant="outline" onClick={() => exportData('PDF', selectedReport)} className="flex items-center gap-2 px-6 py-3 text-lg border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg shadow-sm transition-colors duration-300">
            <FileText className="w-5 h-5" />
            تصدير PDF
          </Button>
        </div>
      </div>

      {/* Filtering Section */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="date-range" className="text-gray-700 font-medium mb-2 block">النطاق الزمني</Label>
              <select
                id="date-range"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">اليوم</option>
                <option value="week">هذا الأسبوع</option>
                <option value="month">هذا الشهر</option>
                <option value="year">هذه السنة</option>
                <option value="custom">نطاق مخصص</option>
              </select>
            </div>
            <div>
              <Label htmlFor="report-type" className="text-gray-700 font-medium mb-2 block">نوع التقرير</Label>
              <select
                id="report-type"
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="overview">نظرة عامة</option>
                <option value="leaderboard">لوحة الصدارة</option>
                <option value="sectionPerformance">أداء الأقسام</option>
                <option value="behaviorTrends">اتجاهات السلوك</option>
              </select>
            </div>
            <div>
              <Button className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-md py-2">
                <Filter className="w-5 h-5 ml-2" />
                تطبيق الفلاتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Render Selected Report */}
      {renderReport()}
    </div>
  );
};

export default StatisticsReports;
