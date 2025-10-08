import { useState, useEffect } from 'react';
import { formatDateShort } from '../../utils/formatDate';
import { Card, CardBody, Button, Typography } from '@material-tailwind/react';

interface QuickEvaluationProps {
  studentId: number;
  onClose?: () => void;
  onSave?: (data: any) => void;
}

interface EvaluationData {
  id?: number;
  student_id: number;
  behavior: number;
  participation: number;
  homework: number;
  attendance: number;
  collaboration: number;
  creativity: number;
  leadership: number;
  critical_thinking: number;
  problem_solving: number;
  communication: number;
  date: string;
  comments?: string;
  total_xp: number;
  student_level: number;
  xp_gained?: number;
}

interface FollowupData {
  id?: number;
  student_id: number;
  type: 'behavioral' | 'academic' | 'administrative';
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at?: string;
  updated_at?: string;
}

interface Student {
  id: number;
  name: string;
  section_id: number;
  section?: {
    name: string;
  };
}

// Level system constants
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
  1: 'text-gray-600',
  2: 'text-green-600',
  3: 'text-blue-600', 
  4: 'text-purple-600',
  5: 'text-orange-600',
  6: 'text-red-600',
  7: 'text-yellow-600'
};

// XP thresholds for each level
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 850, 1300, 2000, 3000];

const calculateLevel = (xp: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i;
    }
  }
  return 1;
};

const QuickEvaluation: React.FC<QuickEvaluationProps> = ({ studentId, onClose, onSave }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationData>({
    student_id: studentId,
    behavior: 5,
    participation: 5,
    homework: 5,
    attendance: 5,
    collaboration: 5,
    creativity: 5,
    leadership: 5,
    critical_thinking: 5,
    problem_solving: 5,
    communication: 5,
    date: new Date().toISOString().split('T')[0],
    total_xp: 0,
    student_level: 1
  });
  const [followups, setFollowups] = useState<FollowupData[]>([]);
  const [assessmentHistory, setAssessmentHistory] = useState<any[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const studentName = student?.name || 'الطالب';

  useEffect(() => {
    loadData();
  }, [studentId]);

  useEffect(() => {
    calculateXPAndLevel();
  }, [evaluation.behavior, evaluation.participation, evaluation.homework, evaluation.attendance, 
      evaluation.collaboration, evaluation.creativity, evaluation.leadership, 
      evaluation.critical_thinking, evaluation.problem_solving, evaluation.communication]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStudent(),
        loadEvaluation(),
        loadFollowups(),
        loadAssessmentHistory()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudent = async () => {
    try {
      const response = await fetch(`/api/students/${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setStudent(data);
      }
    } catch (error) {
      console.error('Error loading student:', error);
    }
  };

  const loadEvaluation = async () => {
    try {
      const response = await fetch(`/api/evaluations/student/${studentId}/latest`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setEvaluation(prev => ({ ...prev, ...data }));
        }
      }
    } catch (error) {
      console.error('Error loading evaluation:', error);
    }
  };

  const loadFollowups = async () => {
    try {
      const response = await fetch(`/api/followups/student/${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setFollowups(data);
      }
    } catch (error) {
      console.error('Error loading followups:', error);
    }
  };

  const loadAssessmentHistory = async () => {
    try {
      const response = await fetch(`/api/evaluations/student/${studentId}/history`);
      if (response.ok) {
        const data = await response.json();
        setAssessmentHistory(data);
      }
    } catch (error) {
      console.error('Error loading assessment history:', error);
    }
  };

  const calculateXPAndLevel = () => {
    const weights = {
      behavior: 2,
      participation: 2,
      homework: 1.5,
      attendance: 1,
      collaboration: 1,
      creativity: 1,
      leadership: 1,
      critical_thinking: 1.5,
      problem_solving: 1.5,
      communication: 1
    };

    let totalWeightedScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([key, weight]) => {
      const score = evaluation[key as keyof typeof weights];
      if (typeof score === 'number') {
        totalWeightedScore += score * weight;
        totalWeight += weight;
      }
    });

    const averageScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    const xpGained = Math.round(averageScore * 10);
    const currentXP = (evaluation.total_xp || 0) + xpGained;
    const level = calculateLevel(currentXP);

    setEvaluation(prev => ({
      ...prev,
      total_xp: currentXP,
      student_level: level,
      xp_gained: xpGained
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluation)
      });

      if (response.ok) {
        const saved = await response.json();
        onSave?.(saved);
        await loadData(); // Refresh data
      }
    } catch (error) {
      console.error('Error saving evaluation:', error);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardBody className="text-center p-8">
          <Typography>جاري تحميل التقييم...</Typography>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="flex gap-4 w-full max-w-4xl mx-auto">
      <div className="flex-1">
        <Card className="w-full">
          <CardBody className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-2xl font-extrabold text-blue-800 mb-1">تقييم سريع</div>
                <div className="text-sm text-gray-500">{studentName}</div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outlined" 
                    onClick={() => {
                      const prevId = studentId - 1;
                      if (prevId > 0) {
                        window.location.href = `/evaluation/quick/${prevId}`;
                      }
                    }}
                  >
                    ←
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outlined" 
                    onClick={() => {
                      const nextId = studentId + 1;
                      window.location.href = `/evaluation/quick/${nextId}`;
                    }}
                  >
                    →
                  </Button>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }} className={LEVEL_COLORS[evaluation.student_level]}>{LEVEL_NAMES[evaluation.student_level]}</div>
                  <div className="text-sm text-gray-600">المستوى {evaluation.student_level} • 💎 {evaluation.total_xp} XP</div>
                </div>

                <div>
                  <Button size="sm" variant="text" onClick={() => setCollapsed(c => !c)}>{collapsed ? 'إظهار الأرقام' : 'إخفاء الأرقام'}</Button>
                  {onClose && (
                    <Button size="sm" variant="text" onClick={onClose}>×</Button>
                  )}
                </div>
              </div>
            </div>

            {/* Evaluation Form - Simplified */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">السلوك</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={evaluation.behavior}
                    onChange={(e) => setEvaluation(prev => ({ ...prev, behavior: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600">{evaluation.behavior}/10</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">المشاركة</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={evaluation.participation}
                    onChange={(e) => setEvaluation(prev => ({ ...prev, participation: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600">{evaluation.participation}/10</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">الواجبات</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={evaluation.homework}
                    onChange={(e) => setEvaluation(prev => ({ ...prev, homework: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600">{evaluation.homework}/10</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">الحضور</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={evaluation.attendance}
                    onChange={(e) => setEvaluation(prev => ({ ...prev, attendance: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600">{evaluation.attendance}/10</div>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium mb-2">ملاحظات</label>
                <textarea 
                  value={evaluation.comments || ''}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, comments: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                  placeholder="ملاحظات إضافية..."
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-2 pt-4">
                {onClose && <Button variant="outlined" onClick={onClose}>إلغاء</Button>}
                <Button color="blue" onClick={handleSave}>حفظ التقييم</Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default QuickEvaluation;