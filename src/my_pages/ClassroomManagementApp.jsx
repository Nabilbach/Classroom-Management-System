import { useState } from 'react'
import { Button } from "@material-tailwind/react"; // تم التأكد من هذا المسار
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/my_components/ui/card.jsx' // تم التأكد من هذا المسار
import { Badge } from '@/my_components/ui/badge.jsx' // تم التأكد من هذا المسار

// هذه هي مسارات صفحاتك، يجب أن تكون في '@/my_pages/'
import StudentsManagement from '@/my_pages/StudentsManagement.jsx' 
import SectionsManagement from '@/my_pages/SectionsManagement.jsx' 
import StatisticsReports from '@/my_pages/StatisticsReports.jsx' 
import Scheduling from '@/my_pages/Scheduling.jsx' 
 
import Dashboard from '@/my_pages/Dashboard.jsx' // تم التأكد من هذا المسار، بناءً على التحليل السابق

import { 
  Users, 
  BookOpen, 
  Award, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Settings,
  Home,
  UserPlus,
  BarChart3,
  Clock,
  Search,
  Bell,
  Star,
  Target
} from 'lucide-react'
import './App.css' // تم التأكد من هذا المسار (نفس مجلد ClassroomManagementApp.jsx)

function ClassroomManagementApp() { // تأكد من اسم الدالة
  const [activeSection, setActiveSection] = useState('home')
  const [language, setLanguage] = useState('ar') // ar for Arabic, en for English

  const menuItems = [
    { id: 'home', label: 'الصفحة الرئيسية', icon: Home },
    { id: 'students', label: 'إدارة التلاميذ', icon: Users },
    { id: 'sections', label: 'إدارة الأقسام', icon: BookOpen },
    { id: 'statistics', label: 'الإحصائيات والتقارير', icon: BarChart3 },
    { id: 'schedule', label: 'جدولة الحصص', icon: Calendar },
    { id: 'settings', label: 'الإعدادات', icon: Settings }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return <Dashboard onNavigate={setActiveSection} />
      case 'students':
        return <StudentsManagement />
      case 'sections':
        return <SectionsManagement />
      case 'statistics':
        return <StatisticsReports />
      case 'schedule':
        return <Scheduling />
      case 'settings':
        return <SettingsComponent />
      default:
        // تأكد من وجود دالة renderHomePage() إذا كانت مستخدمة في مكان آخر في مشروعك
        // وإلا، يمكنك استبدالها بمكون احتياطي أو رسالة خطأ
        return <p>المحتوى غير موجود</p>; 
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">إدارة الفصل</h1>
              <p className="text-sm text-gray-600">نظام ذكي</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const IconComponent = item.icon
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg text-right transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default ClassroomManagementApp // تأكد من اسم الـ export