import { useState, useEffect } from 'react';
import { Card, CardBody, Typography, Button } from '@material-tailwind/react';

interface Student {
  id: number;
  name: string;
  section_id: number;
  total_xp?: number;
  student_level?: number;
  last_evaluation?: string;
}

const LEVEL_NAMES: Record<number, string> = {
  1: 'مبتدئ',
  2: 'متطور', 
  3: 'ماهر',
  4: 'خبير',
  5: 'متقن',
  6: 'محترف',
  7: 'استثنائي'
};

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-gray-100 text-gray-700',
  2: 'bg-green-100 text-green-700',
  3: 'bg-blue-100 text-blue-700', 
  4: 'bg-purple-100 text-purple-700',
  5: 'bg-orange-100 text-orange-700',
  6: 'bg-red-100 text-red-700',
  7: 'bg-yellow-100 text-yellow-700'
};

const StudentEvaluationBoard: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);

  useEffect(() => {
    loadStudents();
  }, [selectedSection]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const url = selectedSection 
        ? `/api/students?section_id=${selectedSection}` 
        : '/api/students';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        // Normalize student data and add evaluation info
        const normalizedStudents = data.map((student: any) => ({
          id: student.id,
          name: student.name,
          section_id: student.section_id,
          total_xp: student.total_xp || 0,
          student_level: student.student_level || 1,
          last_evaluation: student.last_evaluation
        }));
        
        setStudents(normalizedStudents);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const openQuickEvaluation = (studentId: number) => {
    window.open(`/evaluation/quick/${studentId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <Typography>جاري تحميل بيانات الطلاب...</Typography>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Typography variant="h4" className="text-blue-800">
          لوحة تقييم الطلاب
        </Typography>
        <Button color="blue" onClick={() => loadStudents()}>
          تحديث البيانات
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((student) => (
          <Card key={student.id} className="hover:shadow-lg transition-shadow">
            <CardBody className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Typography variant="h6" className="text-gray-800 mb-1">
                    {student.name}
                  </Typography>
                  <div className="text-sm text-gray-500">
                    ID: {student.id}
                  </div>
                </div>
                
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${LEVEL_COLORS[student.student_level || 1]}`}>
                  {LEVEL_NAMES[student.student_level || 1]}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">المستوى:</span>
                  <span className="font-medium">{student.student_level || 1}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">نقاط الخبرة:</span>
                  <span className="font-medium text-blue-600">💎 {student.total_xp || 0}</span>
                </div>
                
                {student.last_evaluation && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">آخر تقييم:</span>
                    <span className="text-xs text-gray-500">
                      {new Date(student.last_evaluation).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                )}
              </div>

              <Button 
                size="sm" 
                color="blue" 
                variant="outlined" 
                className="w-full"
                onClick={() => openQuickEvaluation(student.id)}
              >
                تقييم سريع
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>

      {students.length === 0 && (
        <div className="text-center p-8">
          <Typography className="text-gray-500">
            لا توجد بيانات طلاب متاحة
          </Typography>
        </div>
      )}
    </div>
  );
};

export default StudentEvaluationBoard;