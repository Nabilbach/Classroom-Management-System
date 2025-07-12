import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { 
  Grid, 
  User, 
  Edit, 
  Save, 
  X, 
  RotateCcw,
  Users,
  MapPin
} from 'lucide-react'

const SeatingChart = ({ sectionName = "الصف الأول", students = [] }) => {
  const [editMode, setEditMode] = useState(false)
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [seatingArrangement, setSeatingArrangement] = useState(() => {
    // Initialize a 6x5 grid (6 rows, 5 columns = 30 seats)
    const grid = Array(6).fill(null).map((_, rowIndex) => 
      Array(5).fill(null).map((_, colIndex) => ({
        id: `seat-${rowIndex}-${colIndex}`,
        row: rowIndex + 1,
        col: colIndex + 1,
        number: rowIndex * 5 + colIndex + 1,
        student: null
      }))
    )
    
    // Assign some sample students to seats
    const sampleStudents = [
      { id: 1, name: 'أحمد محمد علي', grade: 'A' },
      { id: 2, name: 'فاطمة أحمد حسن', grade: 'A+' },
      { id: 3, name: 'محمد عبدالله سالم', grade: 'B' },
      { id: 4, name: 'عائشة سعد محمد', grade: 'A-' },
      { id: 5, name: 'عبدالرحمن أحمد', grade: 'B+' },
      { id: 6, name: 'زينب محمد علي', grade: 'A' },
      { id: 7, name: 'يوسف أحمد سالم', grade: 'B' },
      { id: 8, name: 'مريم عبدالله', grade: 'A+' }
    ]
    
    // Assign students to first few seats
    sampleStudents.forEach((student, index) => {
      if (index < 30) {
        const row = Math.floor(index / 5)
        const col = index % 5
        if (grid[row] && grid[row][col]) {
          grid[row][col].student = student
        }
      }
    })
    
    return grid
  })

  const handleSeatClick = (rowIndex, colIndex) => {
    if (!editMode) return
    
    const seat = seatingArrangement[rowIndex][colIndex]
    setSelectedSeat({ ...seat, rowIndex, colIndex })
  }

  const handleStudentAssignment = (studentId) => {
    if (!selectedSeat) return
    
    const student = students.find(s => s.id === parseInt(studentId)) || null
    
    setSeatingArrangement(prev => {
      const newArrangement = [...prev]
      newArrangement[selectedSeat.rowIndex][selectedSeat.colIndex] = {
        ...newArrangement[selectedSeat.rowIndex][selectedSeat.colIndex],
        student
      }
      return newArrangement
    })
    
    setSelectedSeat(null)
  }

  const handleRemoveStudent = () => {
    if (!selectedSeat) return
    
    setSeatingArrangement(prev => {
      const newArrangement = [...prev]
      newArrangement[selectedSeat.rowIndex][selectedSeat.colIndex] = {
        ...newArrangement[selectedSeat.rowIndex][selectedSeat.colIndex],
        student: null
      }
      return newArrangement
    })
    
    setSelectedSeat(null)
  }

  const resetSeating = () => {
    setSeatingArrangement(prev => 
      prev.map(row => 
        row.map(seat => ({ ...seat, student: null }))
      )
    )
    setSelectedSeat(null)
  }

  const getSeatColor = (seat) => {
    if (!seat.student) return 'bg-gray-100 border-gray-300'
    
    switch (seat.student.grade) {
      case 'A+':
      case 'A':
        return 'bg-green-100 border-green-300'
      case 'A-':
      case 'B+':
        return 'bg-blue-100 border-blue-300'
      case 'B':
        return 'bg-yellow-100 border-yellow-300'
      default:
        return 'bg-red-100 border-red-300'
    }
  }

  const occupiedSeats = seatingArrangement.flat().filter(seat => seat.student).length
  const totalSeats = seatingArrangement.flat().length

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen" dir="rtl">
      {/* Header */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-xl font-bold text-gray-800">
            <div className="flex items-center">
              <Grid className="h-6 w-6 ml-2 text-purple-600" />
              مخطط مقاعد {sectionName}
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-3 py-1 text-base bg-gray-100 text-gray-700">
                {occupiedSeats}/{totalSeats} مقعد مشغول
              </Badge>
              <Button
                variant={editMode ? "destructive" : "default"}
                size="lg"
                onClick={() => {
                  setEditMode(!editMode)
                  setSelectedSeat(null)
                }}
                className="px-5 py-2 text-base rounded-md"
              >
                {editMode ? (
                  <>
                    <X className="h-5 w-5 ml-2" />
                    إلغاء التعديل
                  </>
                ) : (
                  <>
                    <Edit className="h-5 w-5 ml-2" />
                    تعديل المقاعد
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
          <CardDescription className="text-gray-600">
            {editMode 
              ? "انقر على أي مقعد لتعديل التلميذ المخصص له" 
              : "عرض ترتيب مقاعد التلاميذ في الفصل"
            }
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Seating Chart */}
        <div className="lg:col-span-3">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-xl font-semibold text-gray-800">
                <div className="flex items-center justify-center">
                  <MapPin className="h-6 w-6 ml-2 text-gray-600" />
                  السبورة
                </div>
                <div className="w-full h-3 bg-gray-800 rounded-md mt-3"></div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {seatingArrangement.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex justify-center gap-4">
                    {row.map((seat, colIndex) => (
                      <div
                        key={seat.id}
                        onClick={() => handleSeatClick(rowIndex, colIndex)}
                        className={`
                          w-24 h-24 border-2 rounded-lg flex flex-col items-center justify-center
                          transition-all duration-200 relative
                          ${getSeatColor(seat)}
                          ${editMode ? 'cursor-pointer hover:shadow-md' : ''}
                          ${selectedSeat?.id === seat.id ? 'ring-4 ring-purple-500 ring-offset-2' : ''}
                        `}
                      >
                        <div className="text-xs font-bold text-gray-600 absolute top-2 right-2">
                          {seat.number}
                        </div>
                        {seat.student ? (
                          <div className="text-center">
                            <User className="h-8 w-8 text-gray-700 mx-auto" />
                            <div className="text-sm font-semibold text-gray-800 mt-1 leading-tight">
                              {seat.student.name.split(' ')[0]}
                            </div>
                            <Badge 
                              variant="secondary" 
                              className="text-xs px-2 py-0.5 mt-1 bg-gray-200 text-gray-700"
                            >
                              {seat.student.grade}
                            </Badge>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-8 h-8 border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center mx-auto">
                              <Plus className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="text-sm text-gray-500 mt-1">مقعد فارغ</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls Panel */}
        <div className="space-y-6">
          {/* Legend */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">مفتاح الألوان</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 border border-green-300 rounded-md"></div>
                <span className="text-base text-gray-700">ممتاز (A+, A)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 border border-blue-300 rounded-md"></div>
                <span className="text-base text-gray-700">جيد جداً (A-, B+)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-yellow-100 border border-yellow-300 rounded-md"></div>
                <span className="text-base text-gray-700">جيد (B)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-red-100 border border-red-300 rounded-md"></div>
                <span className="text-base text-gray-700">يحتاج تحسين (C, D, F)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-100 border border-gray-300 rounded-md"></div>
                <span className="text-base text-gray-700">مقعد فارغ</span>
              </div>
            </CardContent>
          </Card>

          {/* Edit Controls */}
          {editMode && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">أدوات التعديل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedSeat ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 mb-1">
                        المقعد رقم {selectedSeat.number}
                      </Label>
                      <p className="text-xs text-gray-500">
                        الصف {selectedSeat.row}، العمود {selectedSeat.col}
                      </p>
                    </div>
                    
                    {selectedSeat.student && (
                      <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                        <p className="text-base font-semibold text-blue-800">{selectedSeat.student.name}</p>
                        <Badge variant="secondary" className="text-sm px-2 py-0.5 mt-1 bg-blue-100 text-blue-800">
                          {selectedSeat.student.grade}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="student-select" className="block text-sm font-medium text-gray-700 mb-1">
                        اختر تلميذ:
                      </Label>
                      <select
                        id="student-select"
                        className="w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => handleStudentAssignment(e.target.value)}
                        value=""
                      >
                        <option value="">-- اختر تلميذ --</option>
                        {students.map(student => (
                          <option key={student.id} value={student.id}>
                            {student.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleRemoveStudent}
                        className="flex-1 px-5 py-2 text-base border-gray-300 hover:bg-gray-100 text-gray-700 rounded-md"
                      >
                        إزالة التلميذ
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setSelectedSeat(null)}
                        className="flex-1 px-5 py-2 text-base border-gray-300 hover:bg-gray-100 text-gray-700 rounded-md"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-base text-gray-600 text-center py-4">
                    انقر على مقعد لتعديله
                  </p>
                )}
                
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={resetSeating}
                    className="w-full px-5 py-2 text-base border-gray-300 hover:bg-gray-100 text-gray-700 rounded-md"
                  >
                    <RotateCcw className="h-5 w-5 ml-2" />
                    إعادة تعيين جميع المقاعد
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">إحصائيات المقاعد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-base text-gray-700">
                <span>المقاعد المشغولة:</span>
                <span className="font-semibold text-gray-900">{occupiedSeats}</span>
              </div>
              <div className="flex justify-between text-base text-gray-700">
                <span>المقاعد الفارغة:</span>
                <span className="font-semibold text-gray-900">{totalSeats - occupiedSeats}</span>
              </div>
              <div className="flex justify-between text-base text-gray-700">
                <span>إجمالي المقاعد:</span>
                <span className="font-semibold text-gray-900">{totalSeats}</span>
              </div>
              <div className="flex justify-between text-base text-gray-700">
                <span>نسبة الإشغال:</span>
                <span className="font-semibold text-gray-900">
                  {Math.round((occupiedSeats / totalSeats) * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SeatingChart

