import { useState, useEffect } from 'react'
import Button from '@/my_components/ui/button.jsx' // تم التعديل
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/my_components/ui/card.jsx' // تم التعديل
import { Badge } from '@/my_components/ui/badge.jsx' // تم التعديل
import { Input } from '@/my_components/ui/input.jsx' // تم التعديل
import { Label } from '@/my_components/ui/label.jsx' // تم التعديل
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Users,
  Award,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock,
  Target,
  Grid,
  X // تم إضافة X لإغلاق الـ modals
} from 'lucide-react'

const SectionsManagement = () => {
  const [sections, setSections] = useState([])

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      // Mock API call for sections. In a real app, this would fetch from a backend.
      // For demonstration, we'll use dummy data.
      const dummySections = [
        {
          id: 1,
          name: 'الصف السابع أ',
          classLevel: 'السابع',
          teacher: 'أ. أحمد علي',
          description: 'قسم متخصص في العلوم والرياضيات.',
          schedule: [{ day: 'الأحد', time: '08:00 - 09:00' }, { day: 'الثلاثاء', time: '10:00 - 11:00' }],
          seatMap: [['أحمد', 'فاطمة', 'محمد', null, null, null], ['ليلى', 'خالد', null, null, null, null], [null, null, null, null, null, null], [null, null, null, null, null, null], [null, null, null, null, null, null]],
          totalStudents: 25,
          excellentStudents: 8,
          behaviorIssues: 2,
          averageGrade: 88,
          createdAt: '2023-09-01'
        },
        {
          id: 2,
          name: 'الصف الخامس ب',
          classLevel: 'الخامس',
          teacher: 'أ. سارة محمود',
          description: 'قسم للطلاب الموهوبين في الفنون.',
          schedule: [{ day: 'الاثنين', time: '09:00 - 10:00' }, { day: 'الأربعاء', time: '11:00 - 12:00' }],
          seatMap: [['زينب', 'علي', null, null, null, null], [null, null, null, null, null, null], [null, null, null, null, null, null], [null, null, null, null, null, null], [null, null, null, null, null, null]],
          totalStudents: 20,
          excellentStudents: 5,
          behaviorIssues: 1,
          averageGrade: 75,
          createdAt: '2023-09-01'
        },
        {
          id: 3,
          name: 'روضة 1',
          classLevel: 'روضة',
          teacher: 'أ. نورة صالح',
          description: 'قسم خاص بمرحلة الروضة لتعليم أساسيات الحروف والأرقام.',
          schedule: [{ day: 'الخميس', time: '08:30 - 10:30' }],
          seatMap: [['مها', null, null, null, null, null], [null, null, null, null, null, null], [null, null, null, null, null, null], [null, null, null, null, null, null], [null, null, null, null, null, null]],
          totalStudents: 15,
          excellentStudents: 3,
          behaviorIssues: 0,
          averageGrade: 92,
          createdAt: '2024-01-15'
        }
      ];
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setSections(dummySections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      // Fallback to empty array or show error message
      setSections([]);
    }
  };

  const [showAddSection, setShowAddSection] = useState(false)
  const [newSection, setNewSection] = useState({
    name: '',
    classLevel: '',
    teacher: '',
    description: '',
    schedule: [],
    seatMap: Array(5).fill(null).map(() => Array(6).fill(null))
  })
  const [selectedSection, setSelectedSection] = useState(null)
  const [showEditSection, setShowEditSection] = useState(false) // Keep if you plan to implement an edit modal
  const [showSectionDetails, setShowSectionDetails] = useState(false)
  const [showSeatMapEditor, setShowSeatMapEditor] = useState(false)

  const classLevels = ['روضة', 'تمهيدي', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر']

  const getPerformanceColor = (grade) => {
    if (grade >= 85) return 'text-green-600'
    if (grade >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceText = (grade) => {
    if (grade >= 85) return 'ممتاز'
    if (grade >= 70) return 'جيد'
    return 'يحتاج تحسين'
  }

  const AddSectionModal = ({ onClose, onSave }) => {
    const [newSectionData, setNewSectionData] = useState({ // Renamed to avoid conflict with outer newSection
      name: '',
      classLevel: '',
      teacher: '',
      description: '',
      schedule: [
        { day: '', time: '' }
      ],
      seatMap: Array(5).fill(null).map(() => Array(6).fill(null))
    })

    const handleSave = () => {
      if (newSectionData.name && newSectionData.classLevel && newSectionData.teacher) {
        const section = {
          ...newSectionData,
          id: Date.now(), // Generate a unique ID
          totalStudents: 0, // Default values for new sections
          excellentStudents: 0,
          behaviorIssues: 0,
          averageGrade: 0,
          createdAt: new Date().toISOString().split('T')[0]
        }
        onSave(section)
        onClose()
      } else {
        alert('الرجاء تعبئة جميع الحقول المطلوبة (اسم القسم، المستوى الدراسي، المعلم المسؤول).');
      }
    }

    const addScheduleSlot = () => {
      setNewSectionData(prev => ({
        ...prev,
        schedule: [...prev.schedule, { day: '', time: '' }]
      }))
    }

    const updateScheduleSlot = (index, field, value) => {
      setNewSectionData(prev => ({
        ...prev,
        schedule: prev.schedule.map((slot, i) =>
          i === index ? { ...slot, [field]: value } : slot
        )
      }))
    }

    const removeScheduleSlot = (index) => {
      setNewSectionData(prev => ({
        ...prev,
        schedule: prev.schedule.filter((_, i) => i !== index)
      }))
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">إضافة قسم جديد</h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="section-name" className="block text-sm font-medium text-gray-700 mb-1">اسم القسم</Label>
              <Input
                id="section-name"
                value={newSectionData.name}
                onChange={(e) => setNewSectionData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: الصف السابع أ"
                required
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="class-level" className="block text-sm font-medium text-gray-700 mb-1">المستوى الدراسي</Label>
              <select
                id="class-level"
                value={newSectionData.classLevel}
                onChange={(e) => setNewSectionData(prev => ({ ...prev, classLevel: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">اختر مستوى</option>
                {classLevels.map((level, index) => (
                  <option key={index} value={level}>{level}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="teacher-name" className="block text-sm font-medium text-gray-700 mb-1">المعلم المسؤول</Label>
              <Input
                id="teacher-name"
                value={newSectionData.teacher}
                onChange={(e) => setNewSectionData(prev => ({ ...prev, teacher: e.target.value }))}
                placeholder="اسم المعلم"
                required
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">وصف القسم (اختياري)</Label>
              <Input
                id="description"
                value={newSectionData.description}
                onChange={(e) => setNewSectionData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف مختصر للقسم"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="pt-4">
              <div className="flex justify-between items-center mb-3">
                <Label className="block text-sm font-medium text-gray-700">الجدول الزمني</Label>
                <Button type="button" size="sm" onClick={addScheduleSlot} className="bg-blue-500 hover:bg-blue-600 text-white rounded-md">
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة حصة
                </Button>
              </div>

              {newSectionData.schedule.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">لا توجد حصص مضافة بعد. اضغط على "إضافة حصة" لإضافة حصص.</p>
              )}

              {newSectionData.schedule.map((slot, index) => (
                <div key={index} className="flex gap-3 items-center mb-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <select
                    className="flex-1 p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={slot.day}
                    onChange={(e) => updateScheduleSlot(index, 'day', e.target.value)}
                    required
                  >
                    <option value="">اختر اليوم</option>
                    <option value="الأحد">الأحد</option>
                    <option value="الاثنين">الاثنين</option>
                    <option value="الثلاثاء">الثلاثاء</option>
                    <option value="الأربعاء">الأربعاء</option>
                    <option value="الخميس">الخميس</option>
                    <option value="الجمعة">الجمعة</option>
                    <option value="السبت">السبت</option>
                  </select>
                  <Input
                    className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    value={slot.time}
                    onChange={(e) => updateScheduleSlot(index, 'time', e.target.value)}
                    placeholder="مثال: 08:00 - 09:00"
                    required
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeScheduleSlot(index)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="px-5 py-2 border-gray-300 hover:bg-gray-100 text-gray-700 rounded-md">
                إلغاء
              </Button>
              <Button type="button" onClick={handleSave} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                إضافة القسم
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const SeatMapEditorModal = ({ section, onClose, onSave }) => {
    const [currentSeatMap, setCurrentSeatMap] = useState(section.seatMap || Array(5).fill(null).map(() => Array(6).fill(null)));

    const handleSeatChange = (rowIndex, colIndex, value) => {
      const newSeatMap = currentSeatMap.map((row, rIdx) =>
        row.map((seat, cIdx) => {
          if (rowIndex === rIdx && colIndex === cIdx) {
            return value;
          } else {
            return seat;
          }
        })
      );
      setCurrentSeatMap(newSeatMap);
    };

    const handleSave = () => {
      onSave(section.id, currentSeatMap);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">مخطط مقاعد {section.name}</h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600 text-sm">انقر على المقعد لتعديل رقم التلميذ أو اسمه.</p>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${currentSeatMap[0].length}, minmax(0, 1fr))` }}>
              {currentSeatMap.map((row, rowIndex) => (
                row.map((seat, colIndex) => (
                  <Input
                    key={`${rowIndex}-${colIndex}`}
                    type="text"
                    value={seat || ''}
                    onChange={(e) => handleSeatChange(rowIndex, colIndex, e.target.value)}
                    className="w-full h-16 text-center text-lg font-bold border-2 border-gray-300 rounded-md flex items-center justify-center focus:border-blue-500 focus:ring-blue-500"
                    placeholder="مقعد فارغ"
                  />
                ))
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="px-5 py-2 border-gray-300 hover:bg-gray-100 text-gray-700 rounded-md">
              إلغاء
            </Button>
            <Button type="button" onClick={handleSave} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
              حفظ المخطط
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const SectionDetailsModal = ({ section, onClose }) => {
    if (!section) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">تفاصيل {section.name}</h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">إجمالي التلاميذ</p>
                    <p className="text-2xl font-bold text-blue-900">{section.totalStudents}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">المتفوقون</p>
                    <p className="text-2xl font-bold text-green-900">{section.excellentStudents}</p>
                  </div>
                  <Award className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">مشاكل سلوكية</p>
                    <p className="text-2xl font-bold text-yellow-900">{section.behaviorIssues}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">المعدل العام</p>
                    <p className={`text-2xl font-bold ${getPerformanceColor(section.averageGrade)}`}>
                      {section.averageGrade}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">معلومات القسم</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">اسم القسم:</Label>
                    <p className="font-semibold text-gray-900">{section.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">المستوى الدراسي:</Label>
                    <p className="font-semibold text-gray-900">{section.classLevel}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">المعلم المسؤول:</Label>
                    <p className="font-semibold text-gray-900">{section.teacher}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">الوصف:</Label>
                    <p className="text-gray-700">{section.description || 'لا يوجد وصف'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">تاريخ الإنشاء:</Label>
                    <p className="text-gray-700">{section.createdAt}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">الأداء العام:</Label>
                    <Badge className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      section.averageGrade >= 85 ? 'bg-green-100 text-green-800' :
                      section.averageGrade >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getPerformanceText(section.averageGrade)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">الجدول الزمني</CardTitle>
              </CardHeader>
              <CardContent>
                {section.schedule && section.schedule.length > 0 ? (
                  <div className="space-y-3">
                    {section.schedule.map((slot, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-gray-800">{slot.day}</span>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Clock className="h-5 w-5 text-gray-500" />
                          <span className="text-gray-700">{slot.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">لا يوجد جدول زمني محدد لهذا القسم.</p>
                )}
              </CardContent>
            </Card>

            {/* Seat Map Section */}
            <Card className="md:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">مخطط المقاعد</CardTitle>
              </CardHeader>
              <CardContent>
                {section.seatMap && section.seatMap.length > 0 && section.seatMap[0].length > 0 ? (
                  <div className="grid gap-2 p-4 bg-gray-100 rounded-md border border-gray-200" style={{ gridTemplateColumns: `repeat(${section.seatMap[0].length}, minmax(0, 1fr))` }}>
                    {section.seatMap.map((row, rowIndex) => (
                      row.map((seat, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className="w-full h-16 bg-white border border-gray-300 rounded-md flex items-center justify-center text-base font-medium text-gray-700 shadow-sm"
                        >
                          {seat || 'فارغ'}
                        </div>
                      ))
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">لا يوجد مخطط مقاعد محدد لهذا القسم.</p>
                )}
                <Button onClick={() => { setSelectedSection(section); setShowSeatMapEditor(true); }} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md">
                  <Edit className="h-4 w-4 ml-2" />
                  تعديل مخطط المقاعد
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    )
  }

  const updateSectionSeatMap = (sectionId, newSeatMap) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId ? { ...section, seatMap: newSeatMap } : section
    ));
  };

  const addSection = (section) => {
    setSections(prev => [...prev, section])
  }

  const deleteSection = (sectionId) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع البيانات المرتبطة به.')) {
      setSections(prev => prev.filter(section => section.id !== sectionId))
    }
  }

  const totalSectionsCount = sections.length; // New variable
  const totalStudents = sections.reduce((sum, section) => sum + section.totalStudents, 0)
  const totalExcellent = sections.reduce((sum, section) => sum + section.excellentStudents, 0)
  const totalIssues = sections.reduce((sum, section) => sum + section.behaviorIssues, 0)
  const averagePerformance = sections.length > 0
    ? Math.round(sections.reduce((sum, section) => sum + section.averageGrade, 0) / sections.length)
    : 0

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الأقسام</h1>
          <p className="text-gray-600 text-lg">إدارة شاملة للأقسام الدراسية والجداول الزمنية</p>
        </div>
        <Button onClick={() => setShowAddSection(true)} className="flex items-center gap-2 px-6 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors duration-300">
          <Plus className="w-5 h-5" />
          إضافة قسم جديد
        </Button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">إجمالي الأقسام</p>
                <p className="text-2xl font-bold text-blue-900">{totalSectionsCount}</p> {/* Changed to totalSectionsCount */}
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">إجمالي التلاميذ</p>
                <p className="text-2xl font-bold text-green-900">{totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">المتفوقون</p>
                <p className="text-2xl font-bold text-yellow-900">{totalExcellent}</p>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">مشاكل سلوكية</p>
                <p className="text-2xl font-bold text-red-900">{totalIssues}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sections List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.length > 0 ? (
          sections.map(section => (
            <Card key={section.id} className="hover:shadow-lg transition-shadow duration-300 border border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-center text-xl font-bold text-gray-800">
                  <span>{section.name}</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                    {section.classLevel}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-gray-600">المعلم: <span className="font-medium">{section.teacher}</span></CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <span className="flex items-center"><Users className="h-4 w-4 ml-2 text-blue-500" /> عدد التلاميذ:</span>
                    <span className="font-semibold">{section.totalStudents}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <span className="flex items-center"><Award className="h-4 w-4 ml-2 text-green-500" /> تلاميذ نشطون:</span>
                    <span className="font-semibold text-green-600">{section.excellentStudents}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <span className="flex items-center"><AlertTriangle className="h-4 w-4 ml-2 text-red-500" /> مشاكل سلوكية:</span>
                    <span className="font-semibold text-red-600">{section.behaviorIssues}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <span className="flex items-center"><TrendingUp className="h-4 w-4 ml-2 text-purple-500" /> متوسط الأداء:</span>
                    <span className={`font-semibold ${getPerformanceColor(section.averageGrade)}`}>{section.averageGrade}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${section.averageGrade}%` }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSection(section)
                      setShowSectionDetails(true)
                    }}
                    className="flex items-center justify-center gap-2 text-sm border-gray-300 hover:bg-gray-100 text-gray-700"
                  >
                    <BookOpen className="h-4 w-4" />
                    تفاصيل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSection(section)
                      // Assuming an edit modal or form exists
                      // setShowEditSection(true)
                      alert('وظيفة التعديل غير مفعلة حاليا.'); // Placeholder
                    }}
                    className="flex items-center justify-center gap-2 text-sm border-gray-300 hover:bg-gray-100 text-gray-700"
                  >
                    <Edit className="h-4 w-4" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSection(section)
                      // Assuming a navigation to students page with section filter
                      // onNavigate('students', { section: section.name })
                      alert('وظيفة عرض التلاميذ غير مفعلة حاليا.'); // Placeholder
                    }}
                    className="flex items-center justify-center gap-2 text-sm border-gray-300 hover:bg-gray-100 text-gray-700"
                  >
                    <Users className="h-4 w-4" />
                    التلاميذ
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteSection(section.id)}
                    className="flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500 text-lg">
            لا توجد أقسام متاحة حالياً. ابدأ بإضافة قسم جديد!
          </div>
        )}
      </div>

      {showAddSection && (
        <AddSectionModal
          onClose={() => setShowAddSection(false)}
          onSave={addSection}
        />
      )}

      {showSectionDetails && selectedSection && (
        <SectionDetailsModal
          section={selectedSection}
          onClose={() => { setShowSectionDetails(false); setSelectedSection(null); }}
        />
      )}

      {showSeatMapEditor && selectedSection && (
        <SeatMapEditorModal
          section={selectedSection}
          onClose={() => { setShowSeatMapEditor(false); setSelectedSection(null); }}
          onSave={updateSectionSeatMap}
        />
      )}
    </div>
  )
}

export default SectionsManagement