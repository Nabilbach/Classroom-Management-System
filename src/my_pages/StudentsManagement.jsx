import { useState, useEffect } from 'react'

const API_BASE_URL = 'http://127.0.0.1:5000';
import Button from '@/my_components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/my_components/ui/card.jsx'
import { Badge } from '@/my_components/ui/badge.jsx'
import { Input } from '@/my_components/ui/input.jsx'
import { Label } from '@/my_components/ui/label.jsx'
import * as XLSX from 'xlsx'
import {
  Users,
  UserPlus,
  Upload,
  Search,
  Filter,
  Star,
  Award,
  AlertTriangle,
  Edit,
  Trash2,
  FileSpreadsheet,
  Download,
  X,
  Eye
} from 'lucide-react'

const StudentsManagement = () => {
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSection, setSelectedSection] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [newStudent, setNewStudent] = useState({ name: '', section: '', idNumber: '', status: 'active' })
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedStudentForOrder, setSelectedStudentForOrder] = useState(null)
  const [newOrderNumber, setNewOrderNumber] = useState('')
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedStudentForEvaluation, setSelectedStudentForEvaluation] = useState(null)
  const [evaluation, setEvaluation] = useState({
    behaviorScore: 5,
    participationScore: 5,
    homeworkScore: 5,
    attendance: 100
  })
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)

  const sections = ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس']
  const availableBadges = ['مجتهد', 'متعاون', 'متفوق', 'مبدع', 'منتظم', 'مشارك', 'قائد']

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload-excel`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        alert(`تم استيراد ${result.count} تلميذ بنجاح!`)
        fetchStudents() // Refresh the list
      } else {
        alert('حدث خطأ أثناء استيراد الملف')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('حدث خطأ أثناء استيراد الملف')
    }
  }

  const addStudent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newStudent)
      })

      if (response.ok) {
        const student = await response.json()
        setStudents([...students, student])
        setShowAddModal(false)
        setNewStudent({ name: '', section: '', idNumber: '', status: 'active' })
        alert('تم إضافة التلميذ بنجاح!')
      } else {
        alert('حدث خطأ أثناء إضافة التلميذ')
      }
    } catch (error) {
      console.error('Error adding student:', error)
      alert('حدث خطأ أثناء إضافة التلميذ')
    }
  }

  const updateStudent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${selectedStudent.id}` , {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(selectedStudent)
      })

      if (response.ok) {
        const updatedStudent = await response.json()
        setStudents(students.map(s => s.id === selectedStudent.id ? updatedStudent : s))
        setShowEditModal(false)
        alert('تم تحديث بيانات التلميذ بنجاح!')
      } else {
        alert('حدث خطأ أثناء تحديث البيانات')
      }
    } catch (error) {
      console.error('Error updating student:', error)
      alert('حدث خطأ أثناء تحديث البيانات')
    }
  }

  const deleteStudent = async (studentId) => {
    if (!confirm('هل أنت متأكد من حذف هذا التلميذ؟')) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${studentId}` , {
        method: 'DELETE'
      })

      if (response.ok) {
        setStudents(students.filter(s => s.id !== studentId))
        alert('تم حذف التلميذ بنجاح!')
      } else {
        alert('حدث خطأ أثناء حذف التلميذ')
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('حدث خطأ أثناء حذف التلميذ')
    }
  }

  const handleEditOrderNumber = (student) => {
    setSelectedStudentForOrder(student)
    setNewOrderNumber(student.orderNumber?.toString() || student.id.toString())
    setShowOrderModal(true)
  }

  const updateOrderNumber = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${selectedStudentForOrder.id}/order` , {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderNumber: parseInt(newOrderNumber) })
      })

      if (response.ok) {
        setStudents(students.map(s => 
          s.id === selectedStudentForOrder.id 
            ? { ...s, orderNumber: parseInt(newOrderNumber) } 
            : s
        ))
        setShowOrderModal(false)
        alert('تم تحديث الرقم الترتيبي بنجاح!')
      } else {
        alert('حدث خطأ أثناء تحديث الرقم الترتيبي')
      }
    } catch (error) {
      console.error('Error updating order number:', error)
      alert('حدث خطأ أثناء تحديث الرقم الترتيبي')
    }
  }

  const handleInstantEvaluation = (student) => {
    setSelectedStudentForEvaluation(student)
    setEvaluation({
      behaviorScore: student.behaviorScore || 5,
      participationScore: student.participationScore || 5,
      homeworkScore: student.homeworkScore || 5,
      attendance: student.attendance || 100
    })
    setShowEvaluationModal(true)
  }

  const submitEvaluation = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${selectedStudentForEvaluation.id}/evaluate` , {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(evaluation)
      })

      if (response.ok) {
        const result = await response.json()
        setStudents(students.map(s => 
          s.id === selectedStudentForEvaluation.id 
            ? { ...s, ...evaluation, color: result.color } 
            : s
        ))
        setShowEvaluationModal(false)
        alert('تم تقييم التلميذ بنجاح!')
      } else {
        alert('حدث خطأ أثناء التقييم')
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error)
      alert('حدث خطأ أثناء التقييم')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = statusOptions.find(opt => opt.value === status)
    return statusConfig || { label: status, color: 'bg-gray-100 text-gray-800' }
  }

  const getStudentColorClass = (color) => {
    switch (color) {
      case 'green': return 'border-l-4 border-green-500 bg-green-50'
      case 'yellow': return 'border-l-4 border-yellow-500 bg-yellow-50'
      case 'blue': return 'border-l-4 border-blue-500 bg-blue-50'
      case 'red': return 'border-l-4 border-red-500 bg-red-50'
      default: return 'border-l-4 border-gray-300'
    }
  }

  const statusOptions = [
    { value: 'all', label: 'الكل', color: 'bg-gray-100 text-gray-800' },
    { value: 'active', label: 'نشط', color: 'bg-green-100 text-green-800' },
    { value: 'inactive', label: 'غير نشط', color: 'bg-red-100 text-red-800' },
    { value: 'graduated', label: 'متخرج', color: 'bg-blue-100 text-blue-800' }
  ]

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSection = selectedSection === 'all' || student.section === selectedSection
    const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus
    return matchesSearch && matchesSection && matchesStatus
  })

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة التلاميذ</h1>
          <p className="text-gray-600 text-lg">إدارة شاملة لبيانات التلاميذ والحضور</p>
        </div>
        
        <div className="flex gap-3">
          <Button onClick={() => setShowAddStudent(true)} className="flex items-center gap-2 px-6 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors duration-300">
            <UserPlus className="w-5 h-5" />
            إضافة تلميذ جديد
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" className="flex items-center gap-2 px-6 py-3 text-lg border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg shadow-sm transition-colors duration-300">
              <Upload className="w-5 h-5" />
              رفع ملف Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search" className="text-gray-700 font-medium mb-2 block">البحث عن تلميذ</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="search"
                  placeholder="ابحث بالاسم أو رقم الهوية..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="section-filter" className="text-gray-700 font-medium mb-2 block">تصفية حسب القسم</Label>
              <select
                id="section-filter"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الأقسام</option>
                {sections.map((section, index) => (
                  <option key={index} value={section}>{section}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="status-filter" className="text-gray-700 font-medium mb-2 block">تصفية حسب الحالة</Label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map((option, index) => (
                  <option key={index} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
            <Users className="w-6 h-6 ml-2 text-blue-600" />
            قائمة التلاميذ ({filteredStudents.length})
          </CardTitle>
          <CardDescription className="text-gray-600">جميع التلاميذ المسجلين في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => {
                const statusConfig = getStatusBadge(student.status)
                return (
                  <div key={student.id} className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 ${getStudentColorClass(student.color)}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer hover:bg-blue-200 transition-colors"
                            onClick={() => handleEditOrderNumber(student)}
                            title="اضغط لتعديل الرقم الترتيبي"
                          >
                            #{student.orderNumber || student.id}
                          </span>
                          <h3 className="font-bold text-lg text-gray-900">{student.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">القسم: <span className="font-medium">{student.section}</span></p>
                        <p className="text-xs text-gray-500">رقم الهوية: <span className="font-mono">{student.idNumber}</span></p>
                      </div>
                      <Badge className={`${statusConfig.color} text-xs font-semibold px-3 py-1 rounded-full`}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    
                    {/* Badges */}
                    {student.badges && student.badges.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {student.badges.map((badge, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                            <Award className="w-3 h-3 ml-1" /> {badge}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedStudent(student)
                          setShowViewModal(true)
                        }}
                        className="flex-1 border-gray-300 hover:bg-gray-100 text-gray-700"
                      >
                        <Eye className="w-4 h-4 ml-1" />
                        عرض
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedStudent(student)
                          setShowEditModal(true)
                        }}
                        className="flex-1 border-gray-300 hover:bg-gray-100 text-gray-700"
                      >
                        <Edit className="w-4 h-4 ml-1" />
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInstantEvaluation(student)}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                      >
                        <Star className="w-4 h-4 ml-1" />
                        تقييم آني
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteStudent(student.id)}
                        className="w-10 h-10 p-0 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500 text-lg">
                لا توجد تلاميذ مطابقة لمعايير البحث
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg mx-auto shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800">إضافة تلميذ جديد</CardTitle>
              <CardDescription className="text-gray-600">أدخل بيانات التلميذ الجديد</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); addStudent(); }} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</Label>
                  <Input
                    id="name"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    placeholder="اسم التلميذ"
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-1">رقم الهوية</Label>
                  <Input
                    id="idNumber"
                    value={newStudent.idNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, idNumber: e.target.value })}
                    placeholder="رقم الهوية (اختياري)"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">القسم</Label>
                  <select
                    id="section"
                    value={newStudent.section}
                    onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">اختر قسماً</option>
                    {sections.map((section, index) => (
                      <option key={index} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">الحالة</Label>
                  <select
                    id="status"
                    value={newStudent.status}
                    onChange={(e) => setNewStudent({ ...newStudent, status: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map((option, index) => (
                      <option key={index} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddStudent(false)} className="px-5 py-2 border-gray-300 hover:bg-gray-100 text-gray-700 rounded-md">
                    إلغاء
                  </Button>
                  <Button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                    إضافة تلميذ
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg mx-auto shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800">تعديل بيانات التلميذ</CardTitle>
              <CardDescription className="text-gray-600">تعديل بيانات {selectedStudent.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); updateStudent(); }} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</Label>
                  <Input
                    id="edit-name"
                    value={selectedStudent.name}
                    onChange={(e) => setSelectedStudent({ ...selectedStudent, name: e.target.value })}
                    placeholder="اسم التلميذ"
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-idNumber" className="block text-sm font-medium text-gray-700 mb-1">رقم الهوية</Label>
                  <Input
                    id="edit-idNumber"
                    value={selectedStudent.idNumber}
                    onChange={(e) => setSelectedStudent({ ...selectedStudent, idNumber: e.target.value })}
                    placeholder="رقم الهوية (اختياري)"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-section" className="block text-sm font-medium text-gray-700 mb-1">القسم</Label>
                  <select
                    id="edit-section"
                    value={selectedStudent.section}
                    onChange={(e) => setSelectedStudent({ ...selectedStudent, section: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">اختر قسماً</option>
                    {sections.map((section, index) => (
                      <option key={index} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">الحالة</Label>
                  <select
                    id="edit-status"
                    value={selectedStudent.status}
                    onChange={(e) => setSelectedStudent({ ...selectedStudent, status: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map((option, index) => (
                      <option key={index} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="px-5 py-2 border-gray-300 hover:bg-gray-100 text-gray-700 rounded-md">
                    إلغاء
                  </Button>
                  <Button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                    حفظ التعديلات
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Student Modal */}
      {showViewModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg mx-auto shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800">تفاصيل التلميذ</CardTitle>
              <CardDescription className="text-gray-600">عرض بيانات {selectedStudent.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">الاسم الكامل:</p>
                <p className="text-lg font-semibold text-gray-900">{selectedStudent.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">رقم الهوية:</p>
                <p className="text-lg font-semibold text-gray-900">{selectedStudent.idNumber || 'غير محدد'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">القسم:</p>
                <p className="text-lg font-semibold text-gray-900">{selectedStudent.section}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">الحالة:</p>
                <Badge className={`${getStatusBadge(selectedStudent.status).color} text-lg font-semibold px-3 py-1 rounded-full`}>
                  {getStatusBadge(selectedStudent.status).label}
                </Badge>
              </div>
              {selectedStudent.badges && selectedStudent.badges.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">الأوسمة:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.badges.map((badge, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                        <Award className="w-4 h-4 ml-1" /> {badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end pt-4">
                <Button onClick={() => setShowViewModal(false)} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                  إغلاق
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Order Number Edit Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">تعديل الرقم الترتيبي</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowOrderModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {selectedStudentForOrder && (
              <div className="space-y-4">
                <div className="text-center p-3 bg-blue-50 rounded-md border border-blue-200">
                  <h4 className="font-medium text-lg text-blue-800">{selectedStudentForOrder.name}</h4>
                  <p className="text-sm text-blue-600">{selectedStudentForOrder.section}</p>
                </div>

                <div>
                  <Label htmlFor="new-order-number" className="block text-sm font-medium text-gray-700 mb-2">
                    الرقم الترتيبي الجديد
                  </Label>
                  <Input
                    id="new-order-number"
                    type="number"
                    min="1"
                    value={newOrderNumber}
                    onChange={(e) => setNewOrderNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل الرقم الترتيبي"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    هذا الرقم يساعدك على استدعاء التلميذ بسرعة
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={updateOrderNumber}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    disabled={!newOrderNumber || newOrderNumber < 1}
                  >
                    حفظ
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowOrderModal(false)}
                    className="flex-1 px-5 py-2 border-gray-300 hover:bg-gray-100 text-gray-700 rounded-md"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instant Evaluation Modal */}
      {showEvaluationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">التقييم الآني</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowEvaluationModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {selectedStudentForEvaluation && (
              <div className="space-y-4">
                <div className="text-center p-3 bg-blue-50 rounded-md border border-blue-200">
                  <h4 className="font-medium text-lg text-blue-800">{selectedStudentForEvaluation.name}</h4>
                  <p className="text-sm text-blue-600">{selectedStudentForEvaluation.section}</p>
                </div>

                {/* Behavior Score */}
                <div>
                  <Label htmlFor="behavior-score" className="block text-sm font-medium text-gray-700 mb-2">
                    تقييم السلوك (1-10)
                  </Label>
                  <input
                    id="behavior-score"
                    type="range"
                    min="1"
                    max="10"
                    value={evaluation.behaviorScore}
                    onChange={(e) => setEvaluation({...evaluation, behaviorScore: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>ضعيف</span>
                    <span className="font-medium text-blue-600">{evaluation.behaviorScore}/10</span>
                    <span>ممتاز</span>
                  </div>
                </div>

                {/* Participation Score */}
                <div>
                  <Label htmlFor="participation-score" className="block text-sm font-medium text-gray-700 mb-2">
                    المشاركة في القسم (1-10)
                  </Label>
                  <input
                    id="participation-score"
                    type="range"
                    min="1"
                    max="10"
                    value={evaluation.participationScore}
                    onChange={(e) => setEvaluation({...evaluation, participationScore: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>لا يشارك</span>
                    <span className="font-medium text-blue-600">{evaluation.participationScore}/10</span>
                    <span>مشاركة ممتازة</span>
                  </div>
                </div>

                {/* Homework Score */}
                <div>
                  <Label htmlFor="homework-score" className="block text-sm font-medium text-gray-700 mb-2">
                    أداء الواجبات (1-10)
                  </Label>
                  <input
                    id="homework-score"
                    type="range"
                    min="1"
                    max="10"
                    value={evaluation.homeworkScore}
                    onChange={(e) => setEvaluation({...evaluation, homeworkScore: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>لا ينجز</span>
                    <span className="font-medium text-blue-600">{evaluation.homeworkScore}/10</span>
                    <span>ينجز بامتياز</span>
                  </div>
                </div>

                {/* Attendance */}
                <div>
                  <Label htmlFor="attendance-score" className="block text-sm font-medium text-gray-700 mb-2">
                    نسبة الحضور (%)
                  </Label>
                  <input
                    id="attendance-score"
                    type="range"
                    min="0"
                    max="100"
                    value={evaluation.attendance}
                    onChange={(e) => setEvaluation({...evaluation, attendance: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span className="font-medium text-blue-600">{evaluation.attendance}%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Color Preview */}
                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-2">التصنيف المتوقع:</p>
                  <div className="flex items-center gap-2">
                    {evaluation.behaviorScore >= 8 && evaluation.participationScore >= 8 && evaluation.homeworkScore >= 8 && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">تلميذ مجتهد وخلوق</span>
                      </div>
                    )}
                    {evaluation.behaviorScore < 6 && evaluation.participationScore >= 6 && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">تلميذ مجتهد ولكنه مشاغب</span>
                      </div>
                    )}
                    {evaluation.participationScore < 6 && evaluation.behaviorScore >= 6 && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">متوسط ولا يشارك في القسم</span>
                      </div>
                    )}
                    {evaluation.behaviorScore < 6 && evaluation.participationScore < 6 && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">يحتاج ضبط السلوك</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={submitEvaluation}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    حفظ التقييم
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowEvaluationModal(false)}
                    className="flex-1 px-5 py-2 border-gray-300 hover:bg-gray-100 text-gray-700 rounded-md"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
export default StudentsManagement


