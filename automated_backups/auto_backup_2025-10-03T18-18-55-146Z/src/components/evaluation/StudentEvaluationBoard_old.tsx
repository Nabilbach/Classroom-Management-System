import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Typography,
  Button,
  Input,
  Select,
  Option,
  Dialog,
  DialogBody,
  Progress,
} from "@material-tailwind/react";
import QuickEvaluation from './QuickEvaluation';

interface Student {
  id: string;
  name: string;
  section_id: string;
  section_name?: string;
}

interface StudentEvaluation {
  student_id: string;
  behavior_score: number;
  participation_score: number;
  notebook_score: number;
  attendance_score: number;
  portfolio_score: number;
  quran_memorization: number;
  bonus_points: number;
  total_xp: number;
  student_level: number;
  last_updated: string;
}

interface Section {
  id: string;
  name: string;
}

const LEVEL_NAMES = {
  1: "المبتدئ",
  2: "الناشط", 
  3: "المتميز",
  4: "المتفوق",
  5: "الخبير"
};

const LEVEL_COLORS = {
  1: "bg-gray-100 text-gray-700",
  2: "bg-blue-100 text-blue-700",
  3: "bg-green-100 text-green-700", 
  4: "bg-purple-100 text-purple-700",
  5: "bg-yellow-100 text-yellow-700"
};

function StudentEvaluationBoard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, StudentEvaluation>>({});
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // حالة النافذة المنبثقة
  const [evaluationDialog, setEvaluationDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // جلب الأقسام
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/sections');
        if (response.ok) {
          const data = await response.json();
          setSections(data);
          if (data.length > 0) {
            setSelectedSection(data[0].id);
          }
        }
      } catch (error) {
        console.error('خطأ في جلب الأقسام:', error);
      }
    };
    fetchSections();
  }, []);

  // جلب الطلاب والتقييمات
  useEffect(() => {
    if (!selectedSection) return;

    const fetchStudentsAndEvaluations = async () => {
      setLoading(true);
      try {
        // جلب الطلاب
        const studentsResponse = await fetch(`http://localhost:3000/api/students/section/${selectedSection}`);
        if (studentsResponse.ok) {
          const studentsDataRaw = await studentsResponse.json();
          // Normalize shape: backend returns firstName/lastName and sectionId (camelCase)
          const studentsData = (Array.isArray(studentsDataRaw) ? studentsDataRaw : []).map((s: any) => ({
            id: s.id ?? s.student_id ?? s.id,
            // compose display name from possible fields
            name: ((s.firstName ?? s.first_name ?? s.name ?? '') + ' ' + (s.lastName ?? s.last_name ?? '')).trim() || (s.name ?? `${s.firstName ?? ''}`),
            section_id: s.sectionId ?? s.section_id ?? null,
            section_name: s.sectionName ?? s.section_name ?? null,
            classOrder: s.classOrder ?? s.class_order ?? s.number ?? null,
            // keep original raw for other uses
            _raw: s,
          }));
          setStudents(studentsData);

          // جلب التقييمات لكل طالب
          const evaluationsData: Record<string, StudentEvaluation> = {};
          
          for (const student of studentsData) {
            try {
              const evalResponse = await fetch(`http://localhost:3000/api/evaluation/student/${student.id}`);
              if (evalResponse.ok) {
                const evalData = await evalResponse.json();
                evaluationsData[student.id] = evalData;
              }
            } catch (error) {
              console.error(`خطأ في جلب تقييم الطالب ${student.name}:`, error);
            }
          }
          
          setEvaluations(evaluationsData);
        }
      } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsAndEvaluations();
  }, [selectedSection]);

  // فلترة الطلاب
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // فتح نافذة التقييم
  const openEvaluation = (student: Student) => {
    setSelectedStudent(student);
    setEvaluationDialog(true);
  };

  // إغلاق نافذة التقييم
  const closeEvaluation = () => {
    setEvaluationDialog(false);
    setSelectedStudent(null);
  };

  // تحديث التقييم بعد الحفظ
  const handleEvaluationSaved = (updatedEvaluation: StudentEvaluation) => {
    setEvaluations(prev => ({
      ...prev,
      [updatedEvaluation.student_id]: updatedEvaluation
    }));
  };

  // حساب متوسط القسم
  const calculateSectionStats = () => {
    const validEvaluations = Object.values(evaluations);
    if (validEvaluations.length === 0) return { avgXP: 0, avgLevel: 0 };

    const totalXP = validEvaluations.reduce((sum, evaluation) => sum + evaluation.total_xp, 0);
    const totalLevel = validEvaluations.reduce((sum, evaluation) => sum + evaluation.student_level, 0);

    return {
      avgXP: Math.round(totalXP / validEvaluations.length),
      avgLevel: Math.round(totalLevel / validEvaluations.length)
    };
  };

  const sectionStats = calculateSectionStats();

  if (loading) {
    return (
      <Card className="w-full">
        <CardBody className="text-center p-8">
          <Typography>جاري تحميل البيانات...</Typography>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <Typography variant="h5" color="blue-gray">
              نظام التقييم التفاعلي - التربية الإسلامية
            </Typography>
            
            <div className="flex gap-3 items-center">
              {/* إحصائيات القسم */}
              <div className="text-center px-3 py-2 bg-blue-50 rounded-lg">
                <Typography variant="small" color="blue-gray">متوسط القسم</Typography>
                <Typography variant="h6" color="blue">{sectionStats.avgXP} XP</Typography>
              </div>
              
              {/* اختيار القسم */}
              <div className="w-48">
                <Select
                  value={selectedSection}
                  onChange={(value) => setSelectedSection(value || '')}
                  label="اختر القسم"
                >
                  {sections.map((section) => (
                    <Option key={section.id} value={section.id}>
                      {section.name}
                    </Option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {/* البحث */}
          <div className="mt-4">
            <Input
              label="البحث عن طالب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<span>🔍</span>}
            />
          </div>
        </CardBody>
      </Card>

      {/* قائمة الطلاب */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => {
          const evaluation = evaluations[student.id];
          
          return (
            <Card key={student.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardBody className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Typography variant="h6" color="blue-gray" className="mb-1">
                      {student.name}
                    </Typography>
                    <Typography variant="small" color="gray">
                      ID: {student.id}
                    </Typography>
                  </div>
                  
                  {evaluation && (
                    <div className={`px-2 py-1 rounded-full text-xs ${LEVEL_COLORS[evaluation.student_level]}`}>
                      {LEVEL_NAMES[evaluation.student_level]}
                    </div>
                  )}
                </div>

                {evaluation ? (
                  <div className="space-y-3">
                    {/* XP والمستوى */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">نقاط الخبرة</span>
                      <span className="font-bold text-blue-600">{evaluation.total_xp} XP</span>
                    </div>

                    {/* شريط التقدم للمستوى */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>المستوى {evaluation.student_level}</span>
                        <span>{Math.min(evaluation.total_xp, 600)}/600</span>
                      </div>
                      <Progress 
                        value={(evaluation.total_xp / 600) * 100} 
                        color="blue"
                        className="h-2"
                      />
                    </div>

                    {/* العناصر الأساسية */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span>😊 السلوك:</span>
                        <span>{evaluation.behavior_score.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🗣️ المشاركة:</span>
                        <span>{evaluation.participation_score.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>📝 الدفتر:</span>
                        <span>{evaluation.notebook_score.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🎯 البورتفوليو:</span>
                        <span>{evaluation.portfolio_score.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* القرآن والحضور */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span>📿 القرآن:</span>
                        <span className="text-green-600">+{evaluation.quran_memorization * 10}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>📅 الحضور:</span>
                        <span>{evaluation.attendance_score.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* آخر تحديث */}
                    <Typography variant="small" color="gray" className="text-center">
                      آخر تحديث: {new Date(evaluation.last_updated).toLocaleDateString('ar-SA')}
                    </Typography>

                    <Button
                      size="sm"
                      color="blue"
                      variant="filled"
                      fullWidth
                      onClick={() => openEvaluation(student)}
                    >
                      تقييم سريع
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <Typography color="gray">لم يتم التقييم بعد</Typography>
                    <Button
                      size="sm"
                      color="green"
                      variant="filled"
                      fullWidth
                      onClick={() => openEvaluation(student)}
                    >
                      إنشاء تقييم
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* رسالة عدم وجود طلاب */}
      {filteredStudents.length === 0 && (
        <Card>
          <CardBody className="text-center p-8">
            <Typography color="gray">لا توجد نتائج للبحث المحدد</Typography>
          </CardBody>
        </Card>
      )}

      {/* نافذة التقييم السريع */}
      <Dialog 
        open={evaluationDialog} 
        handler={closeEvaluation}
        size="lg"
        className="bg-transparent shadow-none"
      >
        <DialogBody className="bg-transparent p-0">
          {selectedStudent && (
            <QuickEvaluation
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
              onClose={closeEvaluation}
              onSave={handleEvaluationSaved}
            />
          )}
        </DialogBody>
      </Dialog>
    </div>
  );
}

export default StudentEvaluationBoard;