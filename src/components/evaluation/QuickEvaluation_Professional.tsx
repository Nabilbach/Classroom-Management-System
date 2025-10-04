import React, { useState, useEffect } from 'react';
import {
  Paper, Box, Typography, Button, Slider, TextField, IconButton, Chip, 
  LinearProgress, Card, CardContent, Tooltip, Badge, Avatar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SchoolIcon from '@mui/icons-material/School';
import BookIcon from '@mui/icons-material/Book';
import PersonIcon from '@mui/icons-material/Person';
import { useSnackbar } from 'notistack';
import { formatDateShort } from '../../utils/dateUtils';

// (أزيل استخدام الأكورديون واستبدل بتبويبات فرعية داخل التقييم)
// v3: Professional design with proper colors, XP system, and clear visual hierarchy
// Updated: Better UX, visual feedback, and gamification elements

interface QuickEvaluationProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
  onSave?: (evaluation: any) => void;
  sectionStudents?: Array<any>;
  onSwitchStudent?: (studentId: number) => void;
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

const LEVEL_NAMES: Record<number, string> = {
  1: "المبتدئ",
  2: "الناشط", 
  3: "المتميز",
  4: "المتفوق",
  5: "الخبير",
};

const LEVEL_COLORS: Record<number, string> = {
  1: "#9E9E9E", // Gray
  2: "#2196F3", // Blue
  3: "#4CAF50", // Green
  4: "#9C27B0", // Purple
  5: "#FF9800", // Orange
};

const LEVEL_THRESHOLDS = [0, 150, 300, 450, 600];

const ZERO_EVALUATION: EvaluationData = {
  behavior_score: 0,
  participation_score: 0,
  notebook_score: 0,
  attendance_score: 0,
  portfolio_score: 0,
  quran_memorization: 0,
  bonus_points: 0,
  notes: '',
  total_xp: 0,
  student_level: 1,
};

const EVALUATION_CATEGORIES = [
  {
    id: 'behavior',
    label: 'السلوك',
    icon: '😊',
    color: '#FF5722',
    field: 'behavior_score' as keyof EvaluationData,
    max: 10,
    step: 0.5,
    description: 'تقييم سلوك الطالب وانضباطه في الفصل'
  },
  {
    id: 'participation',
    label: 'المشاركة',
    icon: '🗣️',
    color: '#2196F3',
    field: 'participation_score' as keyof EvaluationData,
    max: 10,
    step: 0.5,
    description: 'مستوى المشاركة والتفاعل في الدرس'
  },
  {
    id: 'notebook',
    label: 'الدفتر',
    icon: '📝',
    color: '#4CAF50',
    field: 'notebook_score' as keyof EvaluationData,
    max: 10,
    step: 0.5,
    description: 'تنظيم وجودة الدفتر والواجبات'
  },
  {
    id: 'homework',
    label: 'الواجبات',
    icon: '📚',
    color: '#9C27B0',
    field: 'portfolio_score' as keyof EvaluationData,
    max: 10,
    step: 0.5,
    description: 'الالتزام بأداء الواجبات المنزلية'
  },
  {
    id: 'attendance',
    label: 'الحضور',
    icon: '📅',
    color: '#FF9800',
    field: 'attendance_score' as keyof EvaluationData,
    max: 10,
    step: 0.5,
    description: 'الانتظام والحضور في الفصل'
  }
];

function QuickEvaluationProfessional({ studentId, studentName, onClose, onSave, sectionStudents = [], onSwitchStudent }: QuickEvaluationProps) {
  const [evaluation, setEvaluation] = useState<EvaluationData>(ZERO_EVALUATION);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastAssessmentDate, setLastAssessmentDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'evaluation' | 'followups' | 'history'>('evaluation');
  const [followups, setFollowups] = useState<any[]>([]);
  const [followupLoading, setFollowupLoading] = useState(false);
  const [_assessmentsHistory, setAssessmentsHistory] = useState<any[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  // Calculate XP and level from scores
  const calculateXPAndLevel = (scores: Partial<EvaluationData>) => {
    const sliderSum = (
      (scores.behavior_score ?? 0) +
      (scores.participation_score ?? 0) +
      (scores.notebook_score ?? 0) +
      (scores.attendance_score ?? 0) +
      (scores.portfolio_score ?? 0)
    );
    const sliderXP = sliderSum * 10;
    const quranXP = (scores.quran_memorization ?? 0) * 10;
    const bonusXP = (scores.bonus_points ?? 0) * 5;
    const totalXP = sliderXP + quranXP + bonusXP;

    let level = 1;
    if (totalXP >= 600) level = 5;
    else if (totalXP >= 450) level = 4;
    else if (totalXP >= 300) level = 3;
    else if (totalXP >= 150) level = 2;

    return { total_xp: totalXP, student_level: level };
  };

  // Update score and recalculate XP/level
  const updateScore = (field: keyof EvaluationData, value: number) => {
    setEvaluation(prev => {
      const updated = { ...prev, [field]: value } as EvaluationData;
      const { total_xp, student_level } = calculateXPAndLevel(updated);
      return { ...updated, total_xp, student_level };
    });
  };

  // Handle slider changes
  const handleSliderChange = (field: keyof EvaluationData, ...args: any[]) => {
    let raw: any = undefined;
    if (args.length === 1) raw = args[0];
    else if (args.length >= 2) raw = args[1];

    if (raw && typeof raw === 'object' && 'target' in raw) raw = (raw.target as any).value;

    const num = parseFloat(String(raw ?? '0'));
    updateScore(field, Number.isNaN(num) ? 0 : num);
  };

  // Get score color based on value
  const getScoreColor = (score: number, max: number = 10) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return '#4CAF50'; // Green
    if (percentage >= 60) return '#FF9800'; // Orange
    if (percentage >= 40) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  // Get behavior description
  const getBehaviorText = (score: number) => {
    if (score >= 8) return "ممتاز - سلوك مثالي";
    if (score >= 6) return "جيد جداً - سلوك مقبول";
    if (score >= 4) return "جيد - بعض التحسينات مطلوبة";
    return "ضعيف - يحتاج متابعة";
  };

  // Calculate progress to next level
  const getProgressToNextLevel = () => {
    const currentLevel = evaluation.student_level;
    if (currentLevel >= 5) return 100;
    
    const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1];
    const nextThreshold = LEVEL_THRESHOLDS[currentLevel];
    const progress = ((evaluation.total_xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    
    return Math.max(0, Math.min(100, progress));
  };

  // Load data on student change
  useEffect(() => {
    setEvaluation(ZERO_EVALUATION);
    setAssessmentsHistory([]);
    setLastAssessmentDate(null);

    // Restore from localStorage if available
    try {
      if (studentId) {
        const key = `qe_last_scores_${studentId}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            const { total_xp, student_level } = calculateXPAndLevel(parsed as Partial<EvaluationData>);
            setEvaluation({
              behavior_score: Number(parsed.behavior_score ?? 0),
              participation_score: Number(parsed.participation_score ?? 0),
              notebook_score: Number(parsed.notebook_score ?? 0),
              attendance_score: Number(parsed.attendance_score ?? 0),
              portfolio_score: Number(parsed.portfolio_score ?? 0),
              quran_memorization: Number(parsed.quran_memorization ?? 0),
              bonus_points: Number(parsed.bonus_points ?? 0),
              notes: parsed.notes ?? '',
              total_xp,
              student_level,
            });
          }
        }
      }
    } catch (e) {
      // ignore localStorage errors
    }

    // Load assessments and followups
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadAssessments(), loadFollowups()]);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      loadData();
    }
  }, [studentId]);

  const loadAssessments = async () => {
    if (!studentId) return;
    try {
      const res = await fetch(`http://localhost:3000/api/students/${studentId}/assessments`);
      if (!res.ok) {
        setAssessmentsHistory([]);
        return;
      }
      const data = await res.json().catch(() => []);
      const entries = (Array.isArray(data) ? data : []).map((a: any) => ({
        id: a.id ?? a._id ?? Date.now(),
        date: a.date ?? a.createdAt ?? a.updatedAt ?? null,
        new_score: a.new_score ?? a.score ?? null,
        notes: a.notes ?? a.note ?? a.description ?? '',
        scores: a.scores ?? null,
      })).sort((x: any, y: any) => {
        const dx = x.date ? new Date(x.date).getTime() : 0;
        const dy = y.date ? new Date(y.date).getTime() : 0;
        return dy - dx;
      });
      setAssessmentsHistory(entries);
      if (entries.length > 0) setLastAssessmentDate(entries[0].date ?? lastAssessmentDate);

      // Load latest scores if available
      const latest = entries[0];
      if (latest && latest.scores) {
        let s = latest.scores;
        if (typeof s === 'string') {
          try { s = JSON.parse(s); } catch (e) { s = null; }
        }
        if (s && typeof s === 'object') {
          const parsed: Partial<EvaluationData> = {
            behavior_score: Number(s.behavior_score ?? 0),
            participation_score: Number(s.participation_score ?? 0),
            notebook_score: Number(s.notebook_score ?? 0),
            attendance_score: Number(s.attendance_score ?? 0),
            portfolio_score: Number(s.portfolio_score ?? 0),
            quran_memorization: Number(s.quran_memorization ?? 0),
            bonus_points: Number(s.bonus_points ?? 0),
            notes: latest.notes ?? '',
          };
          const { total_xp, student_level } = calculateXPAndLevel(parsed);
          setEvaluation({
            behavior_score: parsed.behavior_score ?? 0,
            participation_score: parsed.participation_score ?? 0,
            notebook_score: parsed.notebook_score ?? 0,
            attendance_score: parsed.attendance_score ?? 0,
            portfolio_score: parsed.portfolio_score ?? 0,
            quran_memorization: parsed.quran_memorization ?? 0,
            bonus_points: parsed.bonus_points ?? 0,
            notes: parsed.notes ?? '',
            total_xp,
            student_level,
          });
        }
      }
    } catch (e) {
      console.error('Failed loading assessments history', e);
      setAssessmentsHistory([]);
    }
  };

  const loadFollowups = async () => {
    if (!studentId) return;
    setFollowupLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/students/${studentId}/followups`);
      if (res.ok) {
        const data = await res.json();
        const normalized = (Array.isArray(data) ? data : []).map((f: any) => ({
          id: f.id,
          type: f.type,
          notes: f.notes ?? f.description ?? '',
          isOpen: typeof f.isOpen !== 'undefined' ? Number(f.isOpen) : (f.is_open ? Number(f.is_open) : 1),
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        })).filter((f: any) => f.isOpen === 1);
        setFollowups(normalized);
      }
    } catch (e) {
      console.error('Error fetching followups', e);
    } finally {
      setFollowupLoading(false);
    }
  };

  // Save evaluation
  const handleSave = async () => {
    if (!studentId) {
      enqueueSnackbar('لا يوجد معرف طالب صالح لحفظ التقييم.', { variant: 'error' });
      return;
    }

    const sliderAverage = (
      evaluation.behavior_score +
      evaluation.participation_score +
      evaluation.notebook_score +
      evaluation.attendance_score +
      evaluation.portfolio_score
    ) / 5;
    const new_score = Number((sliderAverage * 2).toFixed(2));

    setSaving(true);
    try {
      const scoresPayload = {
        behavior_score: evaluation.behavior_score,
        participation_score: evaluation.participation_score,
        notebook_score: evaluation.notebook_score,
        attendance_score: evaluation.attendance_score,
        portfolio_score: evaluation.portfolio_score,
        quran_memorization: evaluation.quran_memorization,
        bonus_points: evaluation.bonus_points,
      };

      const response = await fetch(`http://localhost:3000/api/students/${studentId}/assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          new_score, 
          notes: evaluation.notes || '', 
          scores: scoresPayload, 
          total_xp: evaluation.total_xp, 
          student_level: evaluation.student_level 
        }),
      });

      if (response.ok) {
        const saved = await response.json().catch(() => null);
        enqueueSnackbar('تم حفظ التقييم بنجاح', { variant: 'success' });
        
        // Save to localStorage
        try {
          localStorage.setItem(`qe_last_scores_${studentId}`, JSON.stringify(evaluation));
        } catch (e) { /* ignore */ }
        
        // Refresh data
        await loadAssessments();
        onSave?.(saved);
      } else {
        enqueueSnackbar('فشل في حفظ التقييم. تحقق من الاتصال.', { variant: 'error' });
      }
    } catch (error) {
      console.error('❌ خطأ في الشبكة:', error);
      enqueueSnackbar('تعذر الاتصال بالخادم. تأكد من تشغيل السيرفر.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const resetToZero = () => {
    const ok = window.confirm('هل أنت متأكد؟ سيؤدي هذا إلى حذف جميع سجلات التقييم لهذا الطالب وإعادة تعيين نقاط الخبرة.');
    if (!ok) return;

    setEvaluation(ZERO_EVALUATION);
    setLastAssessmentDate(null);
    try {
      localStorage.removeItem(`qe_last_scores_${studentId}`);
    } catch (e) { /* ignore */ }
    enqueueSnackbar('تم إعادة تعيين التقييم', { variant: 'info' });
  };

  if (loading) {
    return (
      <Paper className="w-full max-w-4xl mx-auto" elevation={3}>
        <Box className="text-center p-8">
          <Typography>جاري تحميل التقييم...</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <div dir="rtl" className="w-full max-w-6xl mx-auto">
      <Paper
        elevation={3}
        sx={{
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: 3, 
          background: 'rgba(255,255,255,0.1)', 
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.2)'
        }}>
          <IconButton
            aria-label="إغلاق"
            onClick={onClose}
            size="small"
            sx={{ 
              position: 'absolute', 
              right: 16, 
              top: 16,
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar sx={{ 
                bgcolor: 'white', 
                color: LEVEL_COLORS[evaluation.student_level],
                width: 56,
                height: 56,
                fontSize: 24
              }}>
                <PersonIcon fontSize="large" />
              </Avatar>
              <div>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                  {studentName}
                </Typography>
                <div className="flex items-center gap-2">
                  <Chip
                    icon={<EmojiEventsIcon />}
                    label={LEVEL_NAMES[evaluation.student_level]}
                    sx={{
                      backgroundColor: LEVEL_COLORS[evaluation.student_level],
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                  <Chip
                    icon={<StarIcon />}
                    label={`${evaluation.total_xp} XP`}
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      color: LEVEL_COLORS[evaluation.student_level],
                      fontWeight: 'bold'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Level Progress */}
            <div className="text-right">
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                التقدم للمستوى التالي
              </Typography>
              <Box sx={{ width: 200, mb: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={getProgressToNextLevel()}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'white',
                      borderRadius: 4
                    }
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {evaluation.student_level < 5 && `${LEVEL_THRESHOLDS[evaluation.student_level] - evaluation.total_xp} نقطة متبقية`}
                {evaluation.student_level >= 5 && 'الحد الأقصى'}
              </Typography>
            </div>
          </div>
        </Box>

        {/* Content */}
        <Box sx={{ backgroundColor: 'white', p: 3 }}>
          {/* Student Number Grid */}
          {Array.isArray(sectionStudents) && sectionStudents.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                التنقل السريع بين الطلاب
              </Typography>
              <div className="flex gap-2 flex-wrap">
                {sectionStudents.slice(0, 20).map((s: any) => {
                  const num = s.classOrder ?? s.number ?? s.id;
                  const isCurrent = String(s.id) === String(studentId);
                  return (
                    <Tooltip key={s.id} title={`${s.firstName ?? ''} ${s.lastName ?? ''}`.trim()}>
                      <Button
                        onClick={() => onSwitchStudent && onSwitchStudent(s.id)}
                        variant={isCurrent ? 'contained' : 'outlined'}
                        size="small"
                        sx={{
                          minWidth: 40,
                          height: 40,
                          borderRadius: 2,
                          fontWeight: 'bold',
                          ...(isCurrent && {
                            background: `linear-gradient(45deg, ${LEVEL_COLORS[evaluation.student_level]}, ${LEVEL_COLORS[evaluation.student_level]}dd)`
                          })
                        }}
                      >
                        {num}
                      </Button>
                    </Tooltip>
                  );
                })}
              </div>
            </Box>
          )}

          {/* Main Tabs */}
          <Box sx={{ mb: 3 }}>
            <div className="flex gap-2">
              {[
                { id: 'evaluation', label: 'التقييم', icon: <SchoolIcon /> },
                { id: 'followups', label: 'المتابعات', icon: <BookIcon /> },
                { id: 'history', label: 'السجل', icon: <StarIcon /> }
              ].map(tab => (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  variant={activeTab === tab.id ? 'contained' : 'outlined'}
                  startIcon={tab.icon}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    ...(activeTab === tab.id && {
                      background: `linear-gradient(45deg, ${LEVEL_COLORS[evaluation.student_level]}, ${LEVEL_COLORS[evaluation.student_level]}dd)`
                    })
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </Box>

          {/* Tab Content */}
          {activeTab === 'evaluation' && (
            <div className="space-y-6">
              {/* Evaluation Categories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {EVALUATION_CATEGORIES.map(category => (
                  <Card key={category.id} elevation={2} sx={{ 
                    borderRadius: 3,
                    border: `2px solid ${category.color}20`,
                    '&:hover': {
                      boxShadow: `0 8px 25px ${category.color}30`,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s ease'
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 24 }}>{category.icon}</span>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: category.color }}>
                            {category.label}
                          </Typography>
                        </div>
                        <Chip
                          label={`${(evaluation[category.field] as number).toFixed(1)}/${category.max}`}
                          sx={{
                            backgroundColor: getScoreColor(evaluation[category.field] as number),
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </div>
                      
                      <Slider
                        value={evaluation[category.field] as number}
                        onChange={(e, v) => handleSliderChange(category.field, e, v)}
                        min={0}
                        max={category.max}
                        step={category.step}
                        marks
                        sx={{
                          color: category.color,
                          '& .MuiSlider-thumb': {
                            width: 20,
                            height: 20,
                            boxShadow: `0 0 0 3px ${category.color}30`
                          },
                          '& .MuiSlider-track': {
                            height: 6,
                            background: `linear-gradient(90deg, ${category.color}60, ${category.color})`
                          },
                          '& .MuiSlider-rail': {
                            height: 6,
                            backgroundColor: `${category.color}20`
                          }
                        }}
                      />
                      
                      <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                        {category.description}
                      </Typography>
                      
                      {category.id === 'behavior' && (
                        <Typography variant="body2" sx={{ 
                          mt: 2, 
                          p: 1, 
                          backgroundColor: `${getScoreColor(evaluation.behavior_score)}20`,
                          borderRadius: 1,
                          color: getScoreColor(evaluation.behavior_score),
                          fontWeight: 'bold',
                          textAlign: 'center'
                        }}>
                          {getBehaviorText(evaluation.behavior_score)}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Special Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quran Memorization */}
                <Card elevation={2} sx={{ borderRadius: 3, border: '2px solid #4CAF5020' }}>
                  <CardContent sx={{ p: 3 }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 24 }}>📿</span>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                          حفظ القرآن
                        </Typography>
                      </div>
                      <Chip
                        label={`+${evaluation.quran_memorization * 10} XP`}
                        sx={{
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 0, label: 'لم يحفظ', reward: '0' },
                        { value: 5, label: 'جزئي', reward: '+50' },
                        { value: 10, label: 'كامل', reward: '+100' },
                        { value: 15, label: 'متقن', reward: '+150' }
                      ].map(opt => (
                        <Button
                          key={opt.value}
                          onClick={() => updateScore('quran_memorization', opt.value)}
                          variant={evaluation.quran_memorization === opt.value ? 'contained' : 'outlined'}
                          sx={{
                            flexDirection: 'column',
                            py: 2,
                            ...(evaluation.quran_memorization === opt.value && {
                              backgroundColor: '#4CAF50',
                              color: 'white'
                            })
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {opt.label}
                          </Typography>
                          <Typography variant="caption">
                            {opt.reward} XP
                          </Typography>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Bonus Points */}
                <Card elevation={2} sx={{ borderRadius: 3, border: '2px solid #FF980020' }}>
                  <CardContent sx={{ p: 3 }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 24 }}>⭐</span>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                          أعمال مميزة
                        </Typography>
                      </div>
                      <Chip
                        label={`+${evaluation.bonus_points * 5} XP`}
                        sx={{
                          backgroundColor: '#FF9800',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </div>
                    
                    <TextField
                      type="number"
                      value={evaluation.bonus_points}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : Number(e.target.value);
                        updateScore('bonus_points', isNaN(value) ? 0 : Math.max(0, Math.min(20, value)));
                      }}
                      inputProps={{ min: 0, max: 20 }}
                      fullWidth
                      variant="outlined"
                      placeholder="عدد النقاط الإضافية"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: '#FF9800'
                          }
                        }
                      }}
                    />
                    
                    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                      للأعمال الاستثنائية والمشاريع المتميزة (الحد الأقصى: 20 نقطة)
                    </Typography>
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              <Card elevation={2} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>📝</span>
                    ملاحظات إضافية
                  </Typography>
                  <TextField
                    value={evaluation.notes}
                    onChange={(e) => setEvaluation(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="اكتب أي ملاحظات أو تعليقات حول أداء الطالب..."
                    multiline
                    rows={3}
                    fullWidth
                    variant="outlined"
                  />
                </CardContent>
              </Card>

              {/* Summary & Actions */}
              <Card elevation={3} sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${LEVEL_COLORS[evaluation.student_level]}20, ${LEVEL_COLORS[evaluation.student_level]}10)`
              }}>
                <CardContent sx={{ p: 3 }}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: LEVEL_COLORS[evaluation.student_level] }}>
                        {evaluation.total_xp}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        إجمالي نقاط الخبرة
                      </Typography>
                    </div>
                    <div className="text-center">
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: LEVEL_COLORS[evaluation.student_level] }}>
                        {evaluation.student_level}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        المستوى الحالي
                      </Typography>
                    </div>
                    <div className="text-center">
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                        {((evaluation.behavior_score + evaluation.participation_score + evaluation.notebook_score + evaluation.attendance_score + evaluation.portfolio_score) / 5).toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        المتوسط العام
                      </Typography>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outlined"
                      onClick={onClose}
                      sx={{ px: 4 }}
                    >
                      إغلاق
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={resetToZero}
                      sx={{ px: 4 }}
                    >
                      إعادة تعيين
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      disabled={saving}
                      sx={{
                        px: 4,
                        background: `linear-gradient(45deg, ${LEVEL_COLORS[evaluation.student_level]}, ${LEVEL_COLORS[evaluation.student_level]}dd)`,
                        '&:hover': {
                          background: `linear-gradient(45deg, ${LEVEL_COLORS[evaluation.student_level]}dd, ${LEVEL_COLORS[evaluation.student_level]}bb)`
                        }
                      }}
                    >
                      {saving ? 'جارٍ الحفظ...' : 'حفظ التقييم'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'followups' && (
            <div>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                المتابعات ({followups.length})
              </Typography>
              {/* Followups content would go here */}
              <Typography color="text.secondary">
                لا توجد متابعات مفتوحة حالياً
              </Typography>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                سجل التقييمات ({_assessmentsHistory.length})
              </Typography>
              {/* History content would go here */}
              <Typography color="text.secondary">
                لا توجد سجلات تقييم سابقة
              </Typography>
            </div>
          )}
        </Box>
      </Paper>
    </div>
  );
}

export default QuickEvaluationProfessional;