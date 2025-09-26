import { useState, useEffect } from 'react';
import { Card, CardBody, Typography, Slider, Button, Textarea, Input } from "@material-tailwind/react";

interface QuickEvaluationProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
  onSave?: (evaluation: any) => void;
}

interface EvaluationData {
  behavior_score: number;
  participation_score: number;
  notebook_score: number;
  attendance_score: number;
  portfolio_score: number;
  quran_memorization: number;
  bonus_points: number;
  notes: string;
  total_xp: number;
  student_level: number;
}

const LEVEL_NAMES = {
  1: "المبتدئ",
  2: "الناشط", 
  3: "المتميز",
  4: "المتفوق",
  5: "الخبير"
};

const LEVEL_COLORS = {
  1: "text-gray-600",
  2: "text-blue-600",
  3: "text-green-600", 
  4: "text-purple-600",
  5: "text-yellow-600"
};

function QuickEvaluation({ studentId, studentName, onClose, onSave }: QuickEvaluationProps) {
  const [evaluation, setEvaluation] = useState<EvaluationData>({
    behavior_score: 5.0,
    participation_score: 5.0,
    notebook_score: 5.0,
    attendance_score: 5.0,
    portfolio_score: 5.0,
    quran_memorization: 0,
    bonus_points: 0,
    notes: '',
    total_xp: 250,
    student_level: 2
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // جلب التقييم الحالي
  useEffect(() => {
    const fetchEvaluation = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/api/evaluation/student/${studentId}`);
        if (response.ok) {
          const data = await response.json();
          setEvaluation(data);
        }
      } catch (error) {
        console.error('خطأ في جلب التقييم:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [studentId]);

  // حساب XP والمستوى عند التغيير
  const calculateXPAndLevel = (scores: Partial<EvaluationData>) => {
    const sliderXP = (
      (scores.behavior_score || 5) +
      (scores.participation_score || 5) + 
      (scores.notebook_score || 5) +
      (scores.attendance_score || 5) +
      (scores.portfolio_score || 5)
    ) * 10;

    const quranXP = (scores.quran_memorization || 0) * 10;
    const bonusXP = (scores.bonus_points || 0) * 5;
    const totalXP = sliderXP + quranXP + bonusXP;

    let level = 1;
    if (totalXP >= 600) level = 5;
    else if (totalXP >= 450) level = 4; 
    else if (totalXP >= 300) level = 3;
    else if (totalXP >= 150) level = 2;

    return { total_xp: totalXP, student_level: level };
  };

  // تحديث قيمة Slider
  const updateScore = (field: keyof EvaluationData, value: number) => {
    const newEvaluation = { ...evaluation, [field]: value };
    const { total_xp, student_level } = calculateXPAndLevel(newEvaluation);
    
    setEvaluation({
      ...newEvaluation,
      total_xp,
      student_level
    });
  };

  // حفظ التقييم
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`http://localhost:3000/api/evaluation/student/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluation),
      });

      if (response.ok) {
        const updatedEvaluation = await response.json();
        console.log('✅ تم حفظ التقييم بنجاح');
        onSave?.(updatedEvaluation);
        onClose();
      } else {
        console.error('❌ خطأ في حفظ التقييم');
      }
    } catch (error) {
      console.error('❌ خطأ في الشبكة:', error);
    } finally {
      setSaving(false);
    }
  };

  // تقييم السلوك النصي
  const getBehaviorText = (score: number) => {
    if (score >= 7.6) return "ممتاز - سلوك مثالي";
    if (score >= 5.1) return "جيد جداً - مشاكل بسيطة نادرة";
    if (score >= 2.6) return "جيد - بعض المشاغبات";
    return "ضعيف - مشاكل سلوكية متكررة";
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardBody className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <Typography variant="h5" color="blue-gray" className="mb-1">
              تقييم سريع
            </Typography>
            <Typography variant="small" color="gray">
              {studentName}
            </Typography>
          </div>
          <div className="text-center">
            <Typography variant="h6" className={LEVEL_COLORS[evaluation.student_level]}>
              {LEVEL_NAMES[evaluation.student_level]} - المستوى {evaluation.student_level}
            </Typography>
            <Typography variant="small" color="blue-gray">
              💎 {evaluation.total_xp} XP
            </Typography>
          </div>
        </div>

        {/* العناصر الأساسية */}
        <div className="space-y-6">
          
          {/* السلوك */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Typography variant="h6" color="blue-gray">😊 السلوك</Typography>
              <Typography variant="small" color="blue-gray">
                {evaluation.behavior_score.toFixed(1)}/10
              </Typography>
            </div>
            <Slider
              value={evaluation.behavior_score}
              onChange={(e) => updateScore('behavior_score', Number(e.target.value))}
              min={0}
              max={10}
              step={0.1}
              className="mb-2"
            />
            <Typography variant="small" color="gray">
              {getBehaviorText(evaluation.behavior_score)}
            </Typography>
          </div>

          {/* المشاركة */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Typography variant="h6" color="blue-gray">🗣️ المشاركة</Typography>
              <Typography variant="small" color="blue-gray">
                {evaluation.participation_score.toFixed(1)}/10
              </Typography>
            </div>
            <Slider
              value={evaluation.participation_score}
              onChange={(e) => updateScore('participation_score', Number(e.target.value))}
              min={0}
              max={10}
              step={0.1}
            />
          </div>

          {/* الدفتر */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Typography variant="h6" color="blue-gray">📝 الدفتر</Typography>
              <Typography variant="small" color="blue-gray">
                {evaluation.notebook_score.toFixed(1)}/10
              </Typography>
            </div>
            <Slider
              value={evaluation.notebook_score}
              onChange={(e) => updateScore('notebook_score', Number(e.target.value))}
              min={0}
              max={10}
              step={0.1}
            />
          </div>

          {/* البورتفوليو */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Typography variant="h6" color="blue-gray">🎯 البورتفوليو</Typography>
              <Typography variant="small" color="blue-gray">
                {evaluation.portfolio_score.toFixed(1)}/10
              </Typography>
            </div>
            <Slider
              value={evaluation.portfolio_score}
              onChange={(e) => updateScore('portfolio_score', Number(e.target.value))}
              min={0}
              max={10}
              step={0.1}
            />
          </div>

          {/* الحضور (للعرض فقط) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Typography variant="h6" color="blue-gray">📅 الحضور (تلقائي)</Typography>
              <Typography variant="small" color="blue-gray">
                {evaluation.attendance_score.toFixed(1)}/10
              </Typography>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${(evaluation.attendance_score / 10) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* حفظ القرآن */}
          <div>
            <Typography variant="h6" color="blue-gray" className="mb-3">📿 حفظ القرآن</Typography>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 0, label: "لم يحفظ", reward: "0 XP" },
                { value: 5, label: "جزئي", reward: "+50 XP" },
                { value: 10, label: "كامل", reward: "+100 XP" },
                { value: 15, label: "متقن", reward: "+150 XP" }
              ].map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={evaluation.quran_memorization === option.value ? "filled" : "outlined"}
                  color={evaluation.quran_memorization === option.value ? "green" : "gray"}
                  onClick={() => updateScore('quran_memorization', option.value)}
                  className="text-xs p-2"
                >
                  <div className="text-center">
                    <div>{option.label}</div>
                    <div className="text-xs">{option.reward}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* نقاط إضافية */}
          <div>
            <Typography variant="h6" color="blue-gray" className="mb-2">
              ⭐ أعمال مميزة (+{evaluation.bonus_points * 5} XP)
            </Typography>
            <Input
              type="number"
              value={evaluation.bonus_points}
              onChange={(e) => updateScore('bonus_points', Number(e.target.value) || 0)}
              min={0}
              max={20}
              label="عدد الأعمال المميزة"
            />
          </div>

          {/* ملاحظات */}
          <div>
            <Typography variant="h6" color="blue-gray" className="mb-2">📝 ملاحظات</Typography>
            <Textarea
              value={evaluation.notes}
              onChange={(e) => setEvaluation({ ...evaluation, notes: e.target.value })}
              placeholder="أضف ملاحظات حول أداء الطالب..."
              rows={3}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outlined" onClick={onClose}>
            إلغاء
          </Button>
          <Button 
            color="green" 
            onClick={handleSave}
            loading={saving}
            disabled={saving}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التقييم'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export default QuickEvaluation;