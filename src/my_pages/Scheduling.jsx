import { useState, useEffect } from 'react'
import { Button } from "@material-tailwind/react"; // تم التعديل: Button من Material Tailwind
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/my_components/ui/card.jsx' // تم التعديل
import { Badge } from '@/my_components/ui/badge.jsx' // تم التعديل
import { Input } from '@/my_components/ui/input.jsx' // تم التعديل
import { Label } from '@/my_components/ui/label.jsx' // تم التعديل
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  RefreshCw,
  X
} from 'lucide-react'

const API_BASE_URL = ''; // Backend URL

const Scheduling = () => {
  const [currentView, setCurrentView] = useState('week') // week, month
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showAddSession, setShowAddSession] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null)
  const [schedule, setSchedule] = useState([])

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/schedules`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSchedule(data);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      alert("فشل في جلب بيانات الجداول الزمنية.");
    }
  };

  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'
  ]

  const getSessionsForDayAndTime = (day, time) => {
    return schedule.filter(session =>
      session.day === day && session.startTime === time
    )
  }

  const AddSessionModal = ({ onClose, onSave, timeSlot }) => {
    const [newSession, setNewSession] = useState({
      section: '',
      teacher: '',
      day: timeSlot?.day || '',
      startTime: timeSlot?.time || '',
      endTime: '',
      subject: '',
      room: '',
      students: 0,
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    })

    const handleSave = async () => {
      if (newSession.section && newSession.teacher && newSession.day &&
          newSession.startTime && newSession.endTime && newSession.subject && newSession.room) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/schedules`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newSession),
          });

          if (response.ok) {
            const addedSession = await response.json();
            alert('تم إضافة الحصة بنجاح!');
            onSave(addedSession);
            onClose();
            fetchSchedules(); // Refresh schedules list
          } else {
            alert('فشل في إضافة الحصة.');
          }
        } catch (error) {
          console.error("Error adding session:", error);
          alert("حدث خطأ أثناء إضافة الحصة.");
        }
      }
    }

    const colorOptions = [
      { value: 'bg-blue-100 text-blue-800 border-blue-200', label: 'أزرق' },
      { value: 'bg-green-100 text-green-800 border-green-200', label: 'أخضر' },
      { value: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'أصفر' },
      { value: 'bg-purple-100 text-purple-800 border-purple-200', label: 'بنفسجي' },
      { value: 'bg-red-100 text-red-800 border-red-200', label: 'أحمر' },
      { value: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'نيلي' }
    ]

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">إضافة حصة جديدة</h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="section-name" className="block text-sm font-medium text-gray-700 mb-1">القسم</Label>
                <Input
                  id="section-name"
                  value={newSession.section}
                  onChange={(e) => setNewSession(prev => ({ ...prev, section: e.target.value }))}
                  placeholder="اسم القسم"
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="teacher-name" className="block text-sm font-medium text-gray-700 mb-1">المعلم</Label>
                <Input
                  id="teacher-name"
                  value={newSession.teacher}
                  onChange={(e) => setNewSession(prev => ({ ...prev, teacher: e.target.value }))}
                  placeholder="اسم المعلم"
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="day" className="block text-sm font-medium text-gray-700 mb-1">اليوم</Label>
                <select
                  id="day"
                  className="w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newSession.day}
                  onChange={(e) => setNewSession(prev => ({ ...prev, day: e.target.value }))}
                  required
                >
                  <option value="">اختر اليوم</option>
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="start-time" className="block text-sm font-medium text-gray-700 mb-1">وقت البداية</Label>
                <select
                  id="start-time"
                  className="w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newSession.startTime}
                  onChange={(e) => setNewSession(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                >
                  <option value="">اختر الوقت</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="end-time" className="block text-sm font-medium text-gray-700 mb-1">وقت النهاية</Label>
                <select
                  id="end-time"
                  className="w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newSession.endTime}
                  onChange={(e) => setNewSession(prev => ({ ...prev, endTime: e.target.value }))}
                  required
                >
                  <option value="">اختر الوقت</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">المادة</Label>
                <Input
                  id="subject"
                  value={newSession.subject}
                  onChange={(e) => setNewSession(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="اسم المادة"
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-1">القاعة</Label>
                <Input
                  id="room"
                  value={newSession.room}
                  onChange={(e) => setNewSession(prev => ({ ...prev, room: e.target.value }))}
                  placeholder="رقم القاعة"
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="students-count" className="block text-sm font-medium text-gray-700 mb-1">عدد التلاميذ</Label>
                <Input
                  id="students-count"
                  type="number"
                  value={newSession.students}
                  onChange={(e) => setNewSession(prev => ({ ...prev, students: parseInt(e.target.value) }))}
                  placeholder="عدد التلاميذ"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">لون التمييز</Label>
              <select
                id="color"
                className="w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newSession.color}
                onChange={(e) => setNewSession(prev => ({ ...prev, color: e.target.value }))}
              >
                {colorOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              {/* Button from Material Tailwind */}
              <Button variant="outlined" onClick={onClose} className="px-5 py-2 border-gray-300 hover:bg-gray-100 text-gray-700 rounded-md">
                إلغاء
              </Button>
              <Button onClick={handleSave} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                إضافة الحصة
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const WeeklyView = () => (
    <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-200 p-3 text-right font-bold text-gray-700 sticky right-0 bg-gray-100 z-10">الوقت</th>
            {days.map(day => (
              <th key={day} className="border border-gray-200 p-3 text-center font-bold text-gray-700 min-w-[180px]">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map(time => (
            <tr key={time} className="hover:bg-gray-50">
              <td className="border border-gray-200 p-3 font-semibold bg-gray-100 text-gray-800 sticky right-0 z-10">
                {time}
              </td>
              {days.map(day => {
                const sessions = getSessionsForDayAndTime(day, time)
                return (
                  <td
                    key={`${day}-${time}`}
                    className="border border-gray-200 p-2 h-28 align-top cursor-pointer hover:bg-blue-50 transition-colors duration-200"
                    onClick={() => {
                      setSelectedTimeSlot({ day, time })
                      setShowAddSession(true)
                    }}
                  >
                    {sessions.length > 0 ? (
                      <div className="space-y-1">
                        {sessions.map(session => (
                          <div
                            key={session.id}
                            className={`p-2 rounded-md border ${session.color} shadow-sm`}
                          >
                            <div className="font-bold text-sm">{session.subject}</div>
                            <div className="text-xs text-gray-700">{session.section} - {session.room}</div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-600">{session.teacher}</span>
                              <div className="flex gap-1">
                                <button className="text-blue-600 hover:text-blue-800" onClick={(e) => { e.stopPropagation(); alert("سيتم تعديل الحصة: " + session.id); }}>
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button className="text-red-600 hover:text-red-800" onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}>
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                        انقر لإضافة حصة
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const addSession = (session) => {
    setSchedule(prev => [...prev, session])
  }

  const deleteSession = async (sessionId) => {
    if (confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/schedules/${sessionId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('تم حذف الحصة بنجاح!');
          fetchSchedules(); // Refresh schedules list
        } else {
          alert('فشل في حذف الحصة.');
        }
      } catch (error) {
        console.error("Error deleting session:", error);
        alert("حدث خطأ أثناء حذف الحصة.");
      }
    }
  };

  const exportSchedule = () => {
    alert('سيتم تصدير الجدول الزمني')
  }

  const refreshSchedule = () => {
    fetchSchedules();
    alert('تم تحديث الجدول الزمني')
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">جدولة الحصص</h1>
          <p className="text-gray-600 text-lg">إدارة وتنظيم الجداول الزمنية للحصص الدراسية</p>
        </div>
        <div className="flex gap-3">
          {/* Using Material Tailwind Button for consistency */}
          <Button variant="outlined" onClick={refreshSchedule} className="flex items-center gap-2 px-6 py-3 text-lg border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg shadow-sm transition-colors duration-300">
            <RefreshCw className="w-5 h-5" />
            تحديث
          </Button>
          <Button variant="outlined" onClick={exportSchedule} className="flex items-center gap-2 px-6 py-3 text-lg border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg shadow-sm transition-colors duration-300">
            <Download className="w-5 h-5" />
            تصدير
          </Button>
          <Button onClick={() => setShowAddSession(true)} className="flex items-center gap-2 px-6 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors duration-300">
            <Plus className="w-5 h-5" />
            إضافة حصة
          </Button>
        </div>
      </div>

      {/* View Controls */}
      <Card className="shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse">
                {/* Using Material Tailwind Button for consistency */}
                <Button
                  size="lg"
                  variant={currentView === 'week' ? 'filled' : 'outlined'}
                  onClick={() => setCurrentView('week')}
                  className="px-5 py-2 text-base rounded-md"
                >
                  <Calendar className="h-5 w-5 ml-1" />
                  عرض أسبوعي
                </Button>
                <Button
                  size="lg"
                  variant={currentView === 'month' ? 'filled' : 'outlined'}
                  onClick={() => setCurrentView('month')}
                  className="px-5 py-2 text-base rounded-md"
                >
                  <BookOpen className="h-5 w-5 ml-1" />
                  عرض شهري
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-4 space-x-reverse">
              {/* Using Material Tailwind Button for consistency */}
              <Button size="sm" variant="outlined" className="rounded-full w-10 h-10 p-0 min-w-0 !rounded-full"> {/* Adjust p-0 and min-w-0 for icon only buttons */}
                <ChevronRight className="h-5 w-5" />
              </Button>
              <span className="font-semibold text-lg text-gray-800">
                {currentDate.toLocaleDateString('ar-SA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <Button size="sm" variant="outlined" className="rounded-full w-10 h-10 p-0 min-w-0 !rounded-full"> {/* Adjust p-0 and min-w-0 for icon only buttons */}
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule View */}
      {currentView === 'week' && <WeeklyView />}
      {/* {currentView === 'month' && <MonthlyView />} */}

      {showAddSession && (
        <AddSessionModal
          onClose={() => setShowAddSession(false)}
          onSave={addSession}
          timeSlot={selectedTimeSlot}
        />
      )}
    </div>
  )
}

export default Scheduling