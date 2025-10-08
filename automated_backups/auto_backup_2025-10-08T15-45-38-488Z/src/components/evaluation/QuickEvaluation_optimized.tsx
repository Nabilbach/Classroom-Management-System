import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Typography, Textarea } from '@material-tailwind/react';

// الثوابت الخاصة بالمستويات
const LEVEL_NAMES = {
  1: 'مبتدئ',
  2: 'متوسط', 
  3: 'جيد',
  4: 'جيد جداً',
  5: 'ممتاز',
  6: 'متفوق',
  7: 'عبقري'
};

const LEVEL_COLORS = {
  1: 'text-gray-600',
  2: 'text-blue-600',
  3: 'text-green-600', 
  4: 'text-yellow-600',
  5: 'text-purple-600',
  6: 'text-red-600',
  7: 'text-gradient-to-r from-yellow-400 to-red-500'
};

interface EvaluationData {
  behavior_score: number;
  participation_score: number;
  notebook_score: number;
  attendance_score: number;
  portfolio_score: number;
  quran_memorization: number;
  bonus_points: number;
  notes: string;
  student_level: number;
  total_xp: number;
}

interface QuickEvaluationOptimizedProps {
  studentId: number;
  studentName: string;
  sectionStudents?: Array<{id: number, name: string}>;
  onClose: () => void;
  onSave?: (data: any) => void;
  onSwitchStudent?: (studentId: number) => void;
}

const QuickEvaluationOptimized: React.FC<QuickEvaluationOptimizedProps> = ({
  studentId,
  studentName,
  sectionStudents,
  onClose,
  onSave,
  onSwitchStudent
}) => {
  const [evaluation, setEvaluation] = useState<EvaluationData>({
    behavior_score: 5,
    participation_score: 5,
    notebook_score: 5,
    attendance_score: 5,
    portfolio_score: 5,
    quran_memorization: 0,
    bonus_points: 0,
    notes: '',
    student_level: 1,
    total_xp: 0
  });

  const [activeTab, setActiveTab] = useState<'evaluation' | 'followups'>('evaluation');
  const [followups, setFollowups] = useState<Array<any>>([]);
  const [newFollowup, setNewFollowup] = useState('');
  const [behaviorComment, setBehaviorComment] = useState('');
  const [loading, setLoading] = useState(false);

  // حساب المجموع والمستوى
  const calculateTotalXP = (eval: EvaluationData) => {
    const baseXP = (eval.behavior_score + eval.participation_score + eval.notebook_score + 
                   eval.attendance_score + eval.portfolio_score) * 2; // كل نقطة = 2 XP
    const quranXP = eval.quran_memorization * 10; // نقاط حفظ القرآن
    const bonusXP = eval.bonus_points * 5; // نقاط إضافية
    return Math.round(baseXP + quranXP + bonusXP);
  };

  const calculateLevel = (xp: number) => {
    if (xp < 50) return 1;
    if (xp < 100) return 2;
    if (xp < 200) return 3;
    if (xp < 350) return 4;
    if (xp < 550) return 5;
    if (xp < 800) return 6;
    return 7;
  };

  // تحديث النقاط
  const updateScore = (field: keyof EvaluationData, value: number) => {
    const newEval = { ...evaluation, [field]: value };
    const totalXP = calculateTotalXP(newEval);
    const level = calculateLevel(totalXP);
    
    setEvaluation({
      ...newEval,
      total_xp: totalXP,
      student_level: level
    });
  };

  const handleSliderChange = (field: keyof EvaluationData, value: string) => {
    updateScore(field, parseFloat(value));
  };

  // حفظ التقييم
  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/students/${studentId}/assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_score: ((evaluation.behavior_score + evaluation.participation_score + 
                      evaluation.notebook_score + evaluation.attendance_score + 
                      evaluation.portfolio_score) / 5) * 2,
          scores: {
            behavior_score: evaluation.behavior_score,
            participation_score: evaluation.participation_score,
            notebook_score: evaluation.notebook_score,
            attendance_score: evaluation.attendance_score,
            portfolio_score: evaluation.portfolio_score,
            quran_memorization: evaluation.quran_memorization,
            bonus_points: evaluation.bonus_points
          },
          total_xp: evaluation.total_xp,
          student_level: evaluation.student_level,
          notes: evaluation.notes,
          behavior_comment: behaviorComment
        })
      });

      if (response.ok) {
        console.log('تم حفظ التقييم بنجاح');
        onSave?.({ saved: true });
        onClose();
      } else {
        console.error('فشل في حفظ التقييم');
      }
    } catch (error) {
      console.error('خطأ في الشبكة:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[90vh] max-w-7xl mx-auto">
      <Card className="w-full h-full">
        <CardBody className="p-4 h-full flex flex-col">
          {/* رأس الصفحة المضغوط */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-blue-800">تقييم سريع</h2>
              <span className="text-gray-600">{studentName}</span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* أزرار التنقل */}
              <div className="flex gap-1">
                <Button size="sm" variant="outlined" onClick={() => {
                  if (!sectionStudents?.length) return;
                  const idx = sectionStudents.findIndex(s => s.id === studentId);
                  const prev = sectionStudents[idx > 0 ? idx - 1 : sectionStudents.length - 1];
                  if (prev && onSwitchStudent) onSwitchStudent(prev.id);
                }}>‹</Button>
                <Button size="sm" variant="outlined" onClick={() => {
                  if (!sectionStudents?.length) return;
                  const idx = sectionStudents.findIndex(s => s.id === studentId);
                  const next = sectionStudents[(idx + 1) % sectionStudents.length];
                  if (next && onSwitchStudent) onSwitchStudent(next.id);
                }}>›</Button>
              </div>
              
              {/* معلومات المستوى */}
              <div className="text-right">
                <div className={`text-sm font-bold ${LEVEL_COLORS[evaluation.student_level]}`}>
                  {LEVEL_NAMES[evaluation.student_level]}
                </div>
                <div className="text-xs text-gray-600">💎 {evaluation.total_xp} XP</div>
              </div>
              
              <Button size="sm" color="red" variant="outlined" onClick={onClose}>✕</Button>
            </div>
          </div>

          {/* التبويبات */}
          <div className="flex gap-2 mb-3">
            <button 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'evaluation' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('evaluation')}
            >
              📊 تقييم
            </button>
            <button 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'followups' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('followups')}
            >
              📋 متابعة
            </button>
          </div>

          {/* المحتوى الرئيسي */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'evaluation' && (
              <div className="h-full flex gap-6">
                {/* العمود الأيسر - معايير التقييم */}
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-4 h-full">
                    {/* السلوك */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-blue-800">😊 السلوك</span>
                        <span className="text-sm text-blue-600">{evaluation.behavior_score.toFixed(1)}/10</span>
                      </div>
                      <input 
                        type="range" 
                        min={0} 
                        max={10} 
                        step={0.1} 
                        value={evaluation.behavior_score} 
                        onChange={(e) => handleSliderChange('behavior_score', e.target.value)}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider-blue"
                      />
                    </div>

                    {/* المشاركة */}
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-green-800">🗣️ المشاركة</span>
                        <span className="text-sm text-green-600">{evaluation.participation_score.toFixed(1)}/10</span>
                      </div>
                      <input 
                        type="range" 
                        min={0} 
                        max={10} 
                        step={0.1} 
                        value={evaluation.participation_score} 
                        onChange={(e) => handleSliderChange('participation_score', e.target.value)}
                        className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* الدفتر */}
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-yellow-800">📝 الدفتر</span>
                        <span className="text-sm text-yellow-600">{evaluation.notebook_score.toFixed(1)}/10</span>
                      </div>
                      <input 
                        type="range" 
                        min={0} 
                        max={10} 
                        step={0.1} 
                        value={evaluation.notebook_score} 
                        onChange={(e) => handleSliderChange('notebook_score', e.target.value)}
                        className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* الحضور */}
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-purple-800">📅 الحضور</span>
                        <span className="text-sm text-purple-600">{evaluation.attendance_score.toFixed(1)}/10</span>
                      </div>
                      <input 
                        type="range" 
                        min={0} 
                        max={10} 
                        step={0.1} 
                        value={evaluation.attendance_score} 
                        onChange={(e) => handleSliderChange('attendance_score', e.target.value)}
                        className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* البورتفوليو */}
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-red-800">🎯 البورتفوليو</span>
                        <span className="text-sm text-red-600">{evaluation.portfolio_score.toFixed(1)}/10</span>
                      </div>
                      <input 
                        type="range" 
                        min={0} 
                        max={10} 
                        step={0.1} 
                        value={evaluation.portfolio_score} 
                        onChange={(e) => handleSliderChange('portfolio_score', e.target.value)}
                        className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* حفظ القرآن */}
                    <div className="bg-teal-50 p-3 rounded-lg">
                      <div className="mb-2 font-medium text-teal-800">📿 حفظ القرآن</div>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { value: 0, label: "لم يحفظ" },
                          { value: 5, label: "جزئي" },
                          { value: 10, label: "كامل" },
                          { value: 15, label: "متقن" }
                        ].map((option) => (
                          <Button 
                            key={option.value}
                            size="sm" 
                            variant={evaluation.quran_memorization === option.value ? "filled" : "outlined"}
                            color={evaluation.quran_memorization === option.value ? "teal" : "gray"}
                            onClick={() => updateScore('quran_memorization', option.value)}
                            className="text-xs py-1 px-2"
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* العمود الأيمن - الملاحظات والأعمال الإضافية */}
                <div className="w-80 space-y-4">
                  {/* الأعمال المميزة */}
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="mb-2 font-medium text-orange-800">⭐ أعمال مميزة</div>
                    <input 
                      type="number" 
                      className="w-full border rounded p-2 text-sm" 
                      value={evaluation.bonus_points} 
                      onChange={(e) => updateScore('bonus_points', Number(e.target.value) || 0)}
                      min={0} 
                      max={20}
                      placeholder="عدد النقاط الإضافية"
                    />
                    <div className="text-xs text-orange-600 mt-1">
                      +{evaluation.bonus_points * 5} XP
                    </div>
                  </div>

                  {/* تقييم السلوك النصي */}
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <div className="mb-2 font-medium text-indigo-800">💭 تقييم السلوك</div>
                    <Textarea
                      value={behaviorComment}
                      onChange={(e) => setBehaviorComment(e.target.value)}
                      placeholder="اكتب تقييماً مفصلاً لسلوك الطالب..."
                      className="text-sm min-h-[80px]"
                    />
                  </div>

                  {/* الملاحظات العامة */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="mb-2 font-medium text-gray-800">📝 ملاحظات عامة</div>
                    <Textarea
                      value={evaluation.notes}
                      onChange={(e) => setEvaluation({...evaluation, notes: e.target.value})}
                      placeholder="أضف ملاحظات حول أداء الطالب..."
                      className="text-sm min-h-[80px]"
                    />
                  </div>

                  {/* إجمالي النقاط */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-lg text-center">
                    <div className="text-lg font-bold">💎 {evaluation.total_xp} XP</div>
                    <div className="text-sm opacity-90">{LEVEL_NAMES[evaluation.student_level]}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'followups' && (
              <div className="h-full p-4">
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">إضافة متابعة جديدة</h3>
                  <Textarea
                    value={newFollowup}
                    onChange={(e) => setNewFollowup(e.target.value)}
                    placeholder="اكتب متابعة جديدة..."
                    className="mb-2"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" color="blue">إضافة متابعة</Button>
                    <Button size="sm" color="blue" variant="outlined">دفتر</Button>
                    <Button size="sm" color="blue" variant="outlined">كتاب</Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">المتابعات الحالية</h3>
                  {followups.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">لا توجد متابعات</div>
                  ) : (
                    <div className="space-y-2">
                      {followups.map((followup, index) => (
                        <div key={index} className="border rounded p-3 bg-white">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{followup.type}</span>
                            <Button size="sm" color="red" variant="outlined">إغلاق</Button>
                          </div>
                          <div className="text-sm text-gray-600">{followup.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* أزرار الحفظ والإغلاق */}
          <div className="flex justify-between items-center pt-3 border-t mt-3">
            <div className="text-sm text-gray-600">
              المتوسط: {((evaluation.behavior_score + evaluation.participation_score + evaluation.notebook_score + evaluation.attendance_score + evaluation.portfolio_score) / 5).toFixed(1)}/10
            </div>
            <div className="flex gap-2">
              <Button variant="outlined" onClick={onClose} disabled={loading}>
                إلغاء
              </Button>
              <Button color="blue" onClick={handleSave} disabled={loading}>
                {loading ? 'جاري الحفظ...' : 'حفظ التقييم'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default QuickEvaluationOptimized;