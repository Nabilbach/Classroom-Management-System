import { useState, useEffect } from 'react';
import {
  Paper, Box, Typography, Button, Slider, TextField, IconButton, Chip, 
  LinearProgress, Card, CardContent, Tooltip, Avatar, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SchoolIcon from '@mui/icons-material/School';
import BookIcon from '@mui/icons-material/Book';
import PersonIcon from '@mui/icons-material/Person';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useSnackbar } from 'notistack';
import { formatDateShort } from '../../utils/formatDate';

// Professional evaluation interface with gamification and visual feedback
// v4: Complete redesign with proper colors, XP system, clear visual hierarchy, and gamification
// Features: Level progression, XP calculation, visual feedback, responsive design, professional UI

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
  1: "#78909C", // Blue Grey
  2: "#2196F3", // Blue
  3: "#4CAF50", // Green
  4: "#9C27B0", // Purple
  5: "#FF9800", // Orange
};

const LEVEL_GRADIENTS: Record<number, string> = {
  1: "linear-gradient(135deg, #78909C 0%, #546E7A 100%)",
  2: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
  3: "linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)",
  4: "linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)",
  5: "linear-gradient(135deg, #FF9800 0%, #F57C00 100%)",
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
    color: '#E91E63',
    field: 'behavior_score' as keyof EvaluationData,
    max: 10,
    step: 0.5,
    description: 'تقييم سلوك الطالب وانضباطه في الفصل',
    xpMultiplier: 10
  },
  {
    id: 'participation',
    label: 'المشاركة',
    icon: '🗣️',
    color: '#2196F3',
    field: 'participation_score' as keyof EvaluationData,
    max: 10,
    step: 0.5,
    description: 'مستوى المشاركة والتفاعل في الدرس',
    xpMultiplier: 10
  },
  {
    id: 'notebook',
    label: 'الدفتر',
    icon: '📝',
    color: '#4CAF50',
    field: 'notebook_score' as keyof EvaluationData,
    max: 10,
    step: 0.5,
    description: 'تنظيم وجودة الدفتر والملاحظات',
    xpMultiplier: 10
  },
  {
    id: 'homework',
    label: 'الواجبات',
    icon: '📚',
    color: '#9C27B0',
    field: 'portfolio_score' as keyof EvaluationData,
    max: 10,
    step: 0.5,
    description: 'الالتزام بأداء الواجبات المنزلية',
    xpMultiplier: 10
  },
  {
    id: 'attendance',
    label: 'الحضور',
    icon: '📅',
    color: '#FF9800',
    field: 'attendance_score' as keyof EvaluationData,
    max: 10,
    step: 0.5,
    description: 'الانتظام والحضور في الفصل',
    xpMultiplier: 10
  }
];

function QuickEvaluation({ studentId, studentName, onClose, onSave, sectionStudents = [], onSwitchStudent }: QuickEvaluationProps) {
  const [evaluation, setEvaluation] = useState<EvaluationData>(ZERO_EVALUATION);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastAssessmentDate, setLastAssessmentDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'evaluation' | 'followups' | 'history'>('evaluation');
  const [followups, setFollowups] = useState<any[]>([]);
  const [followupLoading, setFollowupLoading] = useState(false);
  const [followupDeletingAll, setFollowupDeletingAll] = useState(false);
  const [_studentsWithFollowups, _setStudentsWithFollowups] = useState<Record<string, boolean>>({});
  const [_assessmentsHistory, setAssessmentsHistory] = useState<any[]>([]);
  const [_collapsed, _setCollapsed] = useState(true);
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
    if (percentage >= 80) return '#4CAF50'; // Excellent - Green
    if (percentage >= 60) return '#FF9800'; // Good - Orange
    if (percentage >= 40) return '#FFC107'; // Fair - Yellow
    return '#F44336'; // Needs improvement - Red
  };

  // Get behavior description
  const getBehaviorText = (score: number) => {
    if (score >= 8) return "ممتاز - سلوك مثالي ومشجع";
    if (score >= 6) return "جيد جداً - سلوك إيجابي";
    if (score >= 4) return "جيد - بعض التحسينات مطلوبة";
    if (score >= 2) return "مقبول - يحتاج متابعة";
    return "ضعيف - يحتاج تدخل عاجل";
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
    const ok = window.confirm('هل أنت متأكد؟ سيؤدي هذا إلى إعادة تعيين جميع النقاط إلى الصفر.');
    if (!ok) return;

    setEvaluation(ZERO_EVALUATION);
    try {
      localStorage.removeItem(`qe_last_scores_${studentId}`);
    } catch (e) { /* ignore */ }
    enqueueSnackbar('تم إعادة تعيين التقييم', { variant: 'info' });
  };

  const createQuickFollowup = async (type: string) => {
    try {
      const resp = await fetch(`http://localhost:3000/api/students/${studentId}/followups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, description: `${type} - created from QuickEvaluation` })
      });
      if (resp.ok) {
        const created = await resp.json().catch(() => null);
        const item = created ? { 
          id: created.id, 
          type: created.type, 
          notes: created.notes ?? created.description ?? '', 
          isOpen: typeof created.isOpen !== 'undefined' ? Number(created.isOpen) : (created.is_open ? Number(created.is_open) : 1), 
          createdAt: created.createdAt 
        } : { 
          id: Date.now(), 
          type, 
          notes: '', 
          isOpen: 1, 
          createdAt: new Date().toISOString() 
        };
        setFollowups(prev => [item, ...prev]);
        enqueueSnackbar('تم إضافة متابعة', { variant: 'success' });
      } else {
        enqueueSnackbar('فشل في إضافة متابعة. حاول مرة أخرى.', { variant: 'error' });
      }
    } catch (e) {
      enqueueSnackbar('خطأ في الاتصال. تأكد من تشغيل الخادم.', { variant: 'error' });
    }
  };

  const closeFollowup = async (id: number) => {
    try {
      const resp = await fetch(`http://localhost:3000/api/followups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' })
      });
      if (resp.ok) {
        setFollowups(prev => prev.filter(f => String(f.id) !== String(id)));
        enqueueSnackbar('تم إغلاق المتابعة', { variant: 'success' });
        try { onSave?.({ closedFollowup: id }); } catch (e) { console.error('onSave threw', e); }
      } else {
        enqueueSnackbar('فشل في إغلاق المتابعة. حاول مرة أخرى.', { variant: 'error' });
      }
    } catch (e) {
      enqueueSnackbar('خطأ في الاتصال. تأكد من تشغيل الخادم.', { variant: 'error' });
    }
  };

  const deleteAllFollowups = async () => {
    if (!studentId) return;
    const ok = window.confirm('هل أنت متأكد؟ سيؤدي هذا إلى حذف جميع المتابعات لهذا التلميذ ولن يمكن التراجع عن هذا الإجراء.');
    if (!ok) return;

    setFollowupDeletingAll(true);
    try {
      if (!followups || followups.length === 0) {
        enqueueSnackbar('لا توجد متابعات مفتوحة للحذف.', { variant: 'info' });
        return;
      }

      const results = await Promise.all(followups.map(async (f) => {
        try {
          const r = await fetch(`http://localhost:3000/api/students/${studentId}/followups/${f.id}/close`, { method: 'PATCH' });
          if (r.ok) return { id: f.id, ok: true };
          const r2 = await fetch(`http://localhost:3000/api/followups/${f.id}`, { 
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ is_open: 0 }) 
          });
          return { id: f.id, ok: r2.ok };
        } catch (e) {
          return { id: f.id, ok: false, error: e };
        }
      }));

      const successCount = results.filter(r => r.ok).length;
      if (successCount > 0) {
        enqueueSnackbar(`تم إغلاق ${successCount} من ${followups.length} متابعات.`, { variant: 'success' });
        setFollowups([]);
      } else {
        enqueueSnackbar('فشل في إغلاق المتابعات. تأكد من إعدادات الخادم.', { variant: 'error' });
      }
    } catch (e) {
      enqueueSnackbar('خطأ في الاتصال. تأكد من تشغيل الخادم.', { variant: 'error' });
    } finally {
      setFollowupDeletingAll(false);
    }
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
    <div dir="rtl" className="w-full max-w-7xl mx-auto">
      <Paper
        elevation={4}
        sx={{
          borderRadius: 6,
          background: LEVEL_GRADIENTS[evaluation.student_level],
          position: 'fixed',
          top: 12,
          left: 12,
          right: 12,
          bottom: 12,
          width: 'calc(100% - 24px)',
          height: 'calc(100% - 24px)',
          overflow: 'hidden',
          boxShadow: '0 28px 60px rgba(0,0,0,0.25)'
        }}
      >
        {/* Header with Student Info and Level */}
        <Box sx={{ 
          p: 4, 
          background: 'rgba(255,255,255,0.95)', 
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.2)'
        }}>
          <IconButton
            aria-label="إغلاق"
            onClick={onClose}
            size="large"
            sx={{ 
              position: 'absolute', 
              right: 16, 
              top: 16,
              color: LEVEL_COLORS[evaluation.student_level],
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <CloseIcon />
          </IconButton>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Avatar sx={{ 
                bgcolor: LEVEL_COLORS[evaluation.student_level], 
                width: 80,
                height: 80,
                fontSize: 32,
                border: '4px solid white',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
              }}>
                <PersonIcon fontSize="large" />
              </Avatar>
              <div>
                <Typography variant="h4" sx={{ 
                  color: LEVEL_COLORS[evaluation.student_level], 
                  fontWeight: 'bold', 
                  mb: 1,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {studentName}
                </Typography>
                <div className="flex items-center gap-3 mb-2">
                  <Chip
                    icon={<EmojiEventsIcon />}
                    label={LEVEL_NAMES[evaluation.student_level]}
                    sx={{
                      background: LEVEL_GRADIENTS[evaluation.student_level],
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: 16,
                      px: 2,
                      py: 1,
                      height: 'auto'
                    }}
                  />
                  <Chip
                    icon={<StarIcon />}
                    label={`${evaluation.total_xp} نقطة`}
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      color: LEVEL_COLORS[evaluation.student_level],
                      fontWeight: 'bold',
                      fontSize: 16,
                      px: 2,
                      py: 1,
                      height: 'auto'
                    }}
                  />
                </div>
                {lastAssessmentDate && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    آخر تقييم: {formatDateShort(lastAssessmentDate)}
                  </Typography>
                )}
              </div>
            </div>

            {/* Level Progress */}
            <div className="text-left" style={{ minWidth: 250 }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: LEVEL_COLORS[evaluation.student_level] }}>
                التقدم نحو المستوى التالي
              </Typography>
              <LinearProgress
                variant="determinate"
                value={getProgressToNextLevel()}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  mb: 1,
                  '& .MuiLinearProgress-bar': {
                    background: LEVEL_GRADIENTS[evaluation.student_level],
                    borderRadius: 6
                  }
                }}
              />
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                {evaluation.student_level < 5 && 
                  `${LEVEL_THRESHOLDS[evaluation.student_level] - evaluation.total_xp} نقطة متبقية للمستوى ${evaluation.student_level + 1}`
                }
                {evaluation.student_level >= 5 && 'وصل للمستوى الأقصى! 🎉'}
              </Typography>
            </div>
          </div>
        </Box>

  {/* Content */}
  <Box sx={{ backgroundColor: 'white', p: 3, display: 'flex', flexDirection: 'column', gap: 12, height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
          {/* Student Number Grid */}
          {Array.isArray(sectionStudents) && sectionStudents.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon />
                التنقل السريع بين الطلاب
              </Typography>
              <div className="flex gap-2 flex-wrap">
                {
                  // Render up to 40 slots (preserve existing students, show placeholders for empty slots)
                  (() => {
                    const slots = new Array(40).fill(null).map((_, idx) => {
                      const student = Array.isArray(sectionStudents) ? sectionStudents[idx] : undefined;
                      const display = student ? (student.classOrder ?? student.number ?? student.id) : (idx + 1);
                      const isEmpty = !student;
                      const isCurrent = student ? String(student.id) === String(studentId) : false;
                      return (
                        <Tooltip key={idx} title={student ? `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() : ''}>
                          <span>
                            <Button
                              onClick={() => { if (!isEmpty && onSwitchStudent) onSwitchStudent(student.id); }}
                              variant={isCurrent ? 'contained' : 'outlined'}
                              size="large"
                              disabled={isEmpty}
                              sx={{
                                minWidth: 50,
                                height: 50,
                                borderRadius: 3,
                                fontWeight: 'bold',
                                fontSize: 16,
                                ...(isCurrent ? {
                                  background: LEVEL_GRADIENTS[evaluation.student_level],
                                  boxShadow: `0 4px 15px ${LEVEL_COLORS[evaluation.student_level]}40`
                                } : {}),
                                ...(isEmpty ? { opacity: 0.45, borderStyle: 'dashed' } : {})
                              }}
                            >
                              {display}
                            </Button>
                          </span>
                        </Tooltip>
                      );
                    });
                    return slots;
                  })()
                }
              </div>
            </Box>
          )}

          {/* Main Tabs */}
          <Box sx={{ mb: 3 }}>
            <div className="flex gap-3">
              {[
                { id: 'evaluation', label: 'التقييم', icon: <SchoolIcon /> },
                { id: 'followups', label: `المتابعات (${followups.length})`, icon: <BookIcon /> },
                { id: 'history', label: `السجل (${_assessmentsHistory.length})`, icon: <StarIcon /> }
              ].map(tab => (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  variant={activeTab === tab.id ? 'contained' : 'outlined'}
                  startIcon={tab.icon}
                  size="large"
                  sx={{
                    px: 4,
                    py: 2,
                    borderRadius: 3,
                    fontWeight: 'bold',
                    fontSize: 16,
                    ...(activeTab === tab.id && {
                      background: LEVEL_GRADIENTS[evaluation.student_level],
                      boxShadow: `0 4px 15px ${LEVEL_COLORS[evaluation.student_level]}40`
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
            <div className="space-y-1">
              {/* Evaluation Categories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {EVALUATION_CATEGORIES.map(category => (
                  <Card key={category.id} elevation={1} sx={{ borderRadius: 2, border: `1px solid ${category.color}18` }}>
                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 20 }}>{category.icon}</span>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: category.color }}>
                            {category.label}
                          </Typography>
                        </div>
                        <Chip
                          label={`${(evaluation[category.field] as number).toFixed(1)}/${category.max}`}
                          size="small"
                          sx={{
                            backgroundColor: getScoreColor(evaluation[category.field] as number),
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: 12,
                            height: 'auto'
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
                        size="small"
                        sx={{
                          color: category.color,
                          '& .MuiSlider-thumb': {
                            width: 16,
                            height: 16,
                          },
                        }}
                      />
                      
                      <div className="flex justify-between items-center">
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {category.description}
                        </Typography>
                        <Chip
                          icon={<StarIcon />}
                          label={`+${((evaluation[category.field] as number) * category.xpMultiplier).toFixed(0)} XP`}
                          size="small"
                          sx={{
                            backgroundColor: `${category.color}20`,
                            color: category.color,
                            fontWeight: 'bold',
                            fontSize: 11
                          }}
                        />
                      </div>
                      {category.id === 'behavior' && (
                        <Typography variant="caption" sx={{ 
                          mt: 1, p: 0.5, backgroundColor: `${getScoreColor(evaluation.behavior_score)}18`,
                          borderRadius: 1, color: getScoreColor(evaluation.behavior_score),
                          fontWeight: 'bold', textAlign: 'center', display: 'block',
                          border: `1px solid ${getScoreColor(evaluation.behavior_score)}30`
                        }}>
                          {getBehaviorText(evaluation.behavior_score)}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Special Categories & Notes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                {/* Quran Memorization */}
                <Card elevation={1} sx={{ borderRadius: 2, border: '1px solid #4CAF5020' }}>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 20 }}>📿</span>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                          حفظ القرآن
                        </Typography>
                      </div>
                      <Chip
                        icon={<StarIcon />}
                        label={`+${evaluation.quran_memorization * 10} XP`}
                        size="small"
                        sx={{ backgroundColor: '#4CAF50', color: 'white', fontWeight: 'bold', fontSize: 12, height: 'auto' }}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { value: 0, label: 'لا شيء', reward: '0', color: '#9E9E9E' },
                        { value: 5, label: 'جزئي', reward: '+50', color: '#FF9800' },
                        { value: 10, label: 'كامل', reward: '+100', color: '#4CAF50' },
                        { value: 15, label: 'متقن', reward: '+150', color: '#2196F3' }
                      ].map(opt => (
                        <Button
                          key={opt.value}
                          onClick={() => updateScore('quran_memorization', opt.value)}
                          variant={evaluation.quran_memorization === opt.value ? 'contained' : 'outlined'}
                          size="small"
                          sx={{
                            flexDirection: 'column', py: 0.5, px: 0, borderRadius: 1.5, minWidth: 0,
                            borderWidth: evaluation.quran_memorization === opt.value ? 0 : 1,
                            borderColor: `${opt.color}40`,
                            ...(evaluation.quran_memorization === opt.value && {
                              backgroundColor: opt.color, color: 'white', boxShadow: `0 2px 8px ${opt.color}40`
                            })
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: 12 }}>{opt.label}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: 10, opacity: 0.8 }}>{opt.reward}</Typography>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Bonus Points */}
                <Card elevation={1} sx={{ borderRadius: 2, border: '1px solid #FF980020' }}>
                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 20 }}>⭐</span>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                          أعمال مميزة
                        </Typography>
                      </div>
                      <Chip
                        icon={<StarIcon />}
                        label={`+${evaluation.bonus_points * 5} XP`}
                        size="small"
                        sx={{ backgroundColor: '#FF9800', color: 'white', fontWeight: 'bold', fontSize: 12, height: 'auto' }}
                      />
                    </div>
                    <TextField
                      type="number"
                      value={evaluation.bonus_points}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : Number(e.target.value);
                        updateScore('bonus_points', isNaN(value) ? 0 : Math.max(0, Math.min(20, value)));
                      }}
                      inputProps={{ min: 0, max: 20, style: { textAlign: 'center' } }}
                      fullWidth
                      variant="outlined"
                      placeholder="نقاط إضافية"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: 14, '&.Mui-focused fieldset': { borderColor: '#FF9800' } }
                      }}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              <Card elevation={1} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ fontSize: 16 }}>📝</span>
                    ملاحظات وتعليقات
                  </Typography>
                  <TextField
                    value={evaluation.notes}
                    onChange={(e) => setEvaluation(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="اكتب أي ملاحظات أو توصيات..."
                    multiline
                    rows={2}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: 13, '&.Mui-focused fieldset': { borderColor: LEVEL_COLORS[evaluation.student_level] } }
                    }}
                  />
                </CardContent>
              </Card>

              {/* Summary & Actions */}
              <Card elevation={2} sx={{ borderRadius: 2, background: `linear-gradient(135deg, ${LEVEL_COLORS[evaluation.student_level]}10, ${LEVEL_COLORS[evaluation.student_level]}05)`, border: `1px solid ${LEVEL_COLORS[evaluation.student_level]}28` }}>
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-1 mb-2">
                    <div className="text-center">
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: LEVEL_COLORS[evaluation.student_level] }}>{evaluation.total_xp}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>إجمالي XP</Typography>
                    </div>
                    <div className="text-center">
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: LEVEL_COLORS[evaluation.student_level] }}>{evaluation.student_level}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>المستوى</Typography>
                    </div>
                    <div className="text-center">
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>{((evaluation.behavior_score + evaluation.participation_score + evaluation.notebook_score + evaluation.attendance_score + evaluation.portfolio_score) / 5).toFixed(1)}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>المتوسط</Typography>
                    </div>
                    <div className="text-center">
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FF9800' }}>{getProgressToNextLevel().toFixed(0)}%</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>للترقية</Typography>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1">
                    <Button variant="outlined" onClick={onClose} size="small" sx={{ px: 2, borderRadius: 2, fontWeight: 'bold' }}>إغلاق</Button>
                    <Button variant="outlined" color="error" onClick={resetToZero} size="small" sx={{ px: 2, borderRadius: 2, fontWeight: 'bold' }}>إعادة تعيين</Button>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      disabled={saving}
                      size="small"
                      sx={{
                        px: 4, borderRadius: 2, fontWeight: 'bold', fontSize: 14,
                        background: LEVEL_GRADIENTS[evaluation.student_level],
                        boxShadow: `0 4px 12px ${LEVEL_COLORS[evaluation.student_level]}30`,
                        '&:hover': { transform: 'translateY(-1px)' },
                        '&:disabled': { background: '#9E9E9E', color: 'white' }
                      }}
                    >
                      {saving ? 'جارٍ الحفظ...' : 'حفظ'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'followups' && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: LEVEL_COLORS[evaluation.student_level] }}>
                  المتابعات ({followups.length})
                </Typography>
                <Button size="large" variant="contained" color="primary" onClick={() => createQuickFollowup('دفتر')} sx={{ borderRadius: 3 }}>
                  إضافة متابعة دفتر
                </Button>
                <Button size="large" variant="contained" color="primary" onClick={() => createQuickFollowup('كتاب')} sx={{ borderRadius: 3 }}>
                  إضافة متابعة كتاب
                </Button>
                {followups.length > 0 && (
                  <Button size="large" color="error" variant="outlined" onClick={deleteAllFollowups} disabled={followupDeletingAll} sx={{ borderRadius: 3 }}>
                    {followupDeletingAll ? 'جارٍ الحذف...' : 'حذف الكل'}
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                {followupLoading && (
                  <Typography variant="body1" color="text.secondary">جاري جلب المتابعات...</Typography>
                )}
                {!followupLoading && followups.length === 0 && (
                  <Card elevation={2} sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">لا توجد متابعات مفتوحة حالياً</Typography>
                    <Typography variant="body2" color="text.secondary">يمكنك إضافة متابعة جديدة باستخدام الأزرار أعلاه</Typography>
                  </Card>
                )}
                {!followupLoading && followups.map((f, idx) => (
                  <Card key={f.id || idx} elevation={2} sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <div className="flex justify-between items-center">
                        <div>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>{f.type}</Typography>
                          <Typography variant="body2" color="text.secondary">{f.notes}</Typography>
                          {f.createdAt && (
                            <Typography variant="caption" color="text.secondary">
                              تاريخ الإنشاء: {formatDateShort(f.createdAt)}
                            </Typography>
                          )}
                        </div>
                        <Button 
                          size="large" 
                          color="error" 
                          variant="outlined" 
                          onClick={() => closeFollowup(f.id)}
                          sx={{ borderRadius: 3 }}
                        >
                          إغلاق
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <Typography variant="h5" sx={{ mb: 4, fontWeight: 'bold', color: LEVEL_COLORS[evaluation.student_level] }}>
                سجل التقييمات ({_assessmentsHistory.length})
              </Typography>
              {_assessmentsHistory.length === 0 && (
                <Card elevation={2} sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">لا توجد سجلات تقييم سابقة</Typography>
                  <Typography variant="body2" color="text.secondary">ستظهر هنا جميع التقييمات المحفوظة للطالب</Typography>
                </Card>
              )}
              <div className="space-y-4">
                {_assessmentsHistory.map((a, idx) => (
                  <Card key={a.id || idx} elevation={2} sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <div className="flex justify-between items-center mb-2">
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {a.new_score !== null && a.new_score !== undefined ? `الدرجة: ${a.new_score}/20` : 'درجة غير متوفرة'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {a.date ? formatDateShort(a.date) : 'تاريخ غير معروف'}
                        </Typography>
                      </div>
                      {a.notes && (
                        <Typography variant="body1" sx={{ mb: 2 }}>{a.notes}</Typography>
                      )}
                      {a.scores && (
                        <Typography variant="caption" color="text.secondary">
                          تفاصيل النقاط: {JSON.stringify(a.scores)}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </Box>
      </Paper>
    </div>
  );
}

export default QuickEvaluation;