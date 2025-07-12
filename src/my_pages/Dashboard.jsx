import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/my_components/ui/card.jsx' // تم التعديل
import { Badge } from '@/my_components/ui/badge.jsx' // تم التعديل
import { Button } from "@material-tailwind/react"; // تم التعديل (Button من Material Tailwind)
import { 
  Users, 
  BookOpen, 
  Star, 
  Award, 
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
  Calendar,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useState, useEffect } from 'react'

const API_BASE_URL = '' // Use relative paths for deployment

const Dashboard = ({ onNavigate }) => {
  const [showSectionsDropdown, setShowSectionsDropdown] = useState(false)
  const [sections, setSections] = useState([])
  const [stats, setStats] = useState([
    { title: 'إجمالي التلاميذ', value: '0', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { title: 'إجمالي الأقسام', value: '0', icon: BookOpen, color: 'text-green-600', bgColor: 'bg-green-100' },
    { title: 'الحصص المجدولة', value: '0', icon: Calendar, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { title: 'التنبيهات النشطة', value: '3', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100' }
  ])

  useEffect(() => {
    fetchStats()
    fetchSections()
  }, [])

  const fetchStats = async () => {
    try {
      const [studentsRes, sectionsRes, schedulesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/students`),
        fetch(`${API_BASE_URL}/api/sections`),
        fetch(`${API_BASE_URL}/api/schedules`)
      ])
      
      if (studentsRes.ok && sectionsRes.ok && schedulesRes.ok) {
        const students = await studentsRes.json()
        const sectionsData = await sectionsRes.json()
        const schedulesData = await schedulesRes.json()
        
        setStats(prevStats => [
          { ...prevStats[0], value: students.length.toString() },
          { ...prevStats[1], value: sectionsData.length.toString() },
          { ...prevStats[2], value: schedulesData.length.toString() },
          prevStats[3]
        ])
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchSections = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sections`)
      if (response.ok) {
        const sectionsData = await response.json()
        setSections(sectionsData)
      }
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }

  const handleSectionClick = (sectionName) => {
    // Navigate to students management with section filter
    if (onNavigate) {
      onNavigate('students', { section: sectionName })
    }
    setShowSectionsDropdown(false)
  }

  const handleStatsCardClick = (index) => {
    if (index === 1) { // Sections card
      setShowSectionsDropdown(!showSectionsDropdown)
    }
  }

  const notifications = [
    {
      type: "تنبيه سلوكي",
      message: "محمد عبدالله سالم يحتاج إلى متابعة سلوكية خاصة",
      time: "منذ 5 دقائق",
      priority: "عاجل",
      color: "bg-red-100 text-red-800"
    },
    {
      type: "تذكير حصة",
      message: "حصة الصف الثالث تبدأ خلال 15 دقيقة",
      time: "منذ 10 دقائق", 
      priority: "قريباً",
      color: "bg-orange-100 text-orange-800"
    },
    {
      type: "إنجاز متميز",
      message: "فاطمة أحمد حسن حققت أعلى نقاط هذا الأسبوع",
      time: "منذ ساعة",
      priority: "جديد",
      color: "bg-green-100 text-green-800"
    },
    {
      type: "تحسن ملحوظ",
      message: "الصف الثاني أظهر تحسناً بنسبة 15% هذا الشهر",
      time: "منذ ساعتين",
      priority: "إيجابي",
      color: "bg-blue-100 text-blue-800"
    }
  ]

  const quickActions = [
    { label: "إضافة تلميذ", icon: Plus, color: "bg-blue-500" },
    { label: "جدولة حصة", icon: Calendar, color: "bg-green-500" },
    { label: "عرض التقارير", icon: FileText, color: "bg-purple-500" },
    { label: "إدارة الأقسام", icon: Settings, color: "bg-orange-500" }
  ]

  const recentActivities = [
    { action: "تم إضافة تلميذ جديد: عبدالرحمن محمد", time: "منذ 5 دقائق" },
    { action: "تم تحديث جدول الصف الرابع", time: "منذ 15 دقيقة" },
    { action: "تم إنشاء تقرير شهري للأداء", time: "منذ ساعة" },
    { action: "تم تقييم 5 تلاميذ في الصف الأول", time: "منذ ساعتين" }
  ]

  const recommendations = [
    {
      title: "يُنصح بإجراء جلسات تقوية إضافية للصف الرابع لتحسين المعدل العام من 75% إلى 80%",
      action: "تطبيق الاقتراح"
    },
    {
      title: "تطبيق نظام المكافآت الأسبوعية قد يحسن السلوك العام بنسبة 20%",
      action: "عرض التفاصيل"
    },
    {
      title: "إعادة ترتيب حصص الصف الخامس لتجنب التداخل مع أنشطة أخرى",
      action: "مراجعة الجدول"
    },
    {
      title: "إنشاء برنامج تحدي شهري للمتفوقين لزيادة الدافعية والمنافسة الإيجابية",
      action: "إنشاء البرنامج"
    }
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 bg-gray-50 min-h-screen">
      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">مرحباً بك في نظام إدارة الفصل الدراسي</h1>
          <p className="text-blue-100 text-lg">لوحة تحكم شاملة لإدارة التلاميذ والأقسام الدراسية</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="relative">
                <Card 
                  className={`hover:shadow-lg transition-shadow duration-300 ${index === 1 ? 'cursor-pointer' : ''}`}
                  onClick={() => handleStatsCardClick(index)}
                >
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-full flex items-center justify-center`}>
                      <Icon className={`w-8 h-8 ${stat.color}`} />
                      {index === 1 && (
                        showSectionsDropdown ? 
                        <ChevronUp className="w-5 h-5 ml-2 text-gray-600" /> : 
                        <ChevronDown className="w-5 h-5 ml-2 text-gray-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Sections Dropdown */}
                {index === 1 && showSectionsDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <h4 className="font-semibold text-sm text-gray-700 mb-2 px-2">اختر قسماً لعرض تلاميذه:</h4>
                      {sections.length > 0 ? (
                        sections.map((section, sectionIndex) => (
                          <button
                            key={sectionIndex}
                            onClick={() => handleSectionClick(section.name)}
                            className="w-full text-right px-3 py-2 hover:bg-gray-100 rounded-md text-sm transition-colors duration-200"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{section.name}</span>
                              <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                                {section.students || 0} تلميذ
                              </Badge>
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm px-3 py-2">لا توجد أقسام متاحة</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Sections Overview */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
              <BookOpen className="w-6 h-6 ml-2 text-blue-600" />
              نظرة عامة على الأقسام
            </CardTitle>
            <CardDescription className="text-gray-600">معلومات مفصلة حول كل قسم دراسي</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sections.map((section, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200 shadow-sm">
                  <h3 className="font-semibold text-lg mb-2 text-gray-800">{section.name}</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>عدد التلاميذ:</span>
                      <span className="font-medium">{section.students}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>المتفوقون:</span>
                      <span className="font-medium text-green-600">{section.excellent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>مشاكل سلوكية:</span>
                      <span className="font-medium text-red-600">{section.behavioral}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-1/3 space-y-6">
        {/* Notifications */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
              <AlertTriangle className="w-6 h-6 ml-2 text-red-500" />
              تنبيهات مهمة
            </CardTitle>
            <CardDescription className="text-gray-600">تحتاج إلى انتباهك</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <div key={index} className={`border-r-4 ${notification.type === "تنبيه سلوكي" ? "border-red-500" : notification.type === "تذكير حصة" ? "border-orange-500" : notification.type === "إنجاز متميز" ? "border-green-500" : "border-blue-500"} bg-gray-50 p-3 rounded-md shadow-sm`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-gray-700">{notification.type}</span>
                    <Badge className={`${notification.color} text-xs font-semibold px-2 py-1 rounded-full`}>{notification.priority}</Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{notification.message}</p>
                  <p className="text-xs text-gray-500">{notification.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">أكثر المهام استخداماً</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <Button key={index} variant="outline" className="h-24 flex-col space-y-2 border-gray-200 hover:bg-gray-100 transition-colors duration-200 shadow-sm">
                    <div className={`${action.color} p-3 rounded-full flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{action.label}</span>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
              <Clock className="w-6 h-6 ml-2 text-gray-600" />
              آخر الأنشطة في النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 space-x-reverse p-2 rounded-md hover:bg-gray-50 transition-colors duration-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
              <TrendingUp className="w-6 h-6 ml-2 text-green-600" />
              توصيات مخصصة لتحسين إدارة الفصل الدراسي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200 shadow-sm">
                  <p className="text-sm text-gray-700 mb-3">{rec.title}</p>
                  <Button size="sm" variant="outline" className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 transition-colors duration-200">
                    {rec.action}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard