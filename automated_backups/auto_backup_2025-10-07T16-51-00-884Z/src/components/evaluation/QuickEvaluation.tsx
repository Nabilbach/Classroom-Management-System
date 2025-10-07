import React, { useState, useEffect } from 'react';
import {
  Paper, Box, Typography, Button, Slider, TextField, IconButton, Chip, 
  LinearProgress, Card, CardContent, Tooltip, Avatar, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import SchoolIcon from '@mui/icons-material/School';
import BookIcon from '@mui/icons-material/Book';
import PersonIcon from '@mui/icons-material/Person';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useSnackbar } from 'notistack';
import { formatDateShort } from '../../utils/formatDate';
import AddIcon from '@mui/icons-material/Add';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

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
  const [followupDialogOpenLocal, setFollowupDialogOpenLocal] = useState(false);
  const [followupDialogType, setFollowupDialogType] = useState('متابعة');
  const [followupDialogNotes, setFollowupDialogNotes] = useState('');
  const [studentsFollowupCounts, setStudentsFollowupCounts] = useState({});
  const [_assessmentsHistory, setAssessmentsHistory] = useState<any[]>([]);
  const [_collapsed, _setCollapsed] = useState(true);
  const [displayLevel, setDisplayLevel] = useState<number>(evaluation.student_level);
  const { enqueueSnackbar } = useSnackbar();

  // Sync displayed level when actual level changes
  useEffect(() => {
    setDisplayLevel(evaluation.student_level);
  }, [evaluation.student_level]);

  const prevDisplayLevel = () => {
    setDisplayLevel((l) => (l <= 1 ? 5 : l - 1));
  };

  const nextDisplayLevel = () => {
    setDisplayLevel((l) => (l >= 5 ? 1 : l + 1));
  };

  const LevelBadge = ({ level }: { level: number }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{
        width: 56,
        height: 64,
        borderRadius: '10px',
        background: LEVEL_GRADIENTS[level],
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        boxShadow: '0 6px 18px rgba(0,0,0,0.18)'
      }}>
        <MilitaryTechIcon sx={{ fontSize: 26 }} />
        <Typography variant="caption" sx={{ fontWeight: 'bold', mt: 0.3 }}>{level}</Typography>
      </Box>
    </Box>
  );

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

  // Fetch which students in this section have open followups so we can highlight them
  useEffect(() => {
    const fetchFollowupStudents = async () => {
      try {
        if (!Array.isArray(sectionStudents) || sectionStudents.length === 0) return;
        const sectionId = sectionStudents[0].sectionId ?? sectionStudents[0].section_id ?? null;
        if (!sectionId) return;
        const res = await fetch(`http://localhost:3000/api/sections/${sectionId}/followups-students`);
        if (!res.ok) return;
        const data = await res.json().catch(() => []);
        const map = {};
        (Array.isArray(data) ? data : []).forEach((r: any) => { if (r && r.studentId) map[String(r.studentId)] = Number(r.followupCount) || 0; });
        setStudentsFollowupCounts(map);
      } catch (e) {
        // ignore
      }
    };
    fetchFollowupStudents();
  }, [sectionStudents]);

  // Keyboard navigation for left/right arrows
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!sectionStudents || sectionStudents.length === 0 || !onSwitchStudent) return;
      if (e.key === 'ArrowLeft') {
        // left arrow -> go to NEXT (wrap)
        goNextStudent();
      } else if (e.key === 'ArrowRight') {
        // right arrow -> go to PREV (wrap)
        goPrevStudent();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sectionStudents, studentId, onSwitchStudent]);

  // Close on Escape
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const getCurrentIndex = () => {
    if (!Array.isArray(sectionStudents)) return -1;
    return sectionStudents.findIndex((s: any) => String(s.id) === String(studentId));
  };

  const goPrevStudent = () => {
    const idx = getCurrentIndex();
    if (!Array.isArray(sectionStudents) || sectionStudents.length === 0) return;
    // wrap to last when before first
    const prevIndex = (idx <= 0 ? sectionStudents.length - 1 : idx - 1);
    const prev = sectionStudents[prevIndex];
    if (prev) onSwitchStudent?.(prev.id);
  };

  const goNextStudent = () => {
    const idx = getCurrentIndex();
    if (!Array.isArray(sectionStudents) || sectionStudents.length === 0) return;
    // wrap to first when after last
    const nextIndex = (idx < 0 || idx >= sectionStudents.length - 1) ? 0 : idx + 1;
    const next = sectionStudents[nextIndex];
    if (next) onSwitchStudent?.(next.id);
  };

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

  const resetToZero = async () => {
    const ok = window.confirm('هل أنت متأكد؟ سيؤدي هذا إلى إعادة تعيين جميع النقاط إلى الصفر وسيتم حذف سجل التقييم الخاص بهذا الطالب من الخادم.');
    if (!ok) return;

    if (!studentId) {
      enqueueSnackbar('معرف الطالب غير موجود. لا يمكن إتمام إعادة التعيين.', { variant: 'error' });
      return;
    }

    try {
      // First try the convenience reset endpoint
      const res = await fetch(`http://localhost:3000/api/students/${studentId}/assessments/reset`, { method: 'POST' });
      if (res.ok) {
        const body = await res.json().catch(() => null);
        setEvaluation(ZERO_EVALUATION);
        setAssessmentsHistory([]);
        setLastAssessmentDate(null);
        try { localStorage.removeItem(`qe_last_scores_${studentId}`); } catch (e) { /* ignore */ }
        enqueueSnackbar((body && body.deletedCount >= 0) ? `تمت إعادة التعيين وحذف ${body.deletedCount} سجل` : 'تمت إعادة التعيين وحذف السجل على الخادم', { variant: 'success' });
        return;
      }

      // Fallback: fetch existing assessments, then call delete-bulk for student
      const listRes = await fetch(`http://localhost:3000/api/students/${studentId}/assessments`);
      if (!listRes.ok) {
        enqueueSnackbar('تعذر الوصول إلى سجلات التقييم على الخادم. لم يتم الحذف.', { variant: 'error' });
        return;
      }
      const list = await listRes.json().catch(() => []);
      const ids = (Array.isArray(list) ? list : []).map((a: any) => a.id).filter(Boolean);
      if (ids.length === 0) {
        // Nothing to delete on server, still clear local
        setEvaluation(ZERO_EVALUATION);
        setAssessmentsHistory([]);
        setLastAssessmentDate(null);
        try { localStorage.removeItem(`qe_last_scores_${studentId}`); } catch (e) { /* ignore */ }
        enqueueSnackbar('تمت إعادة التعيين. لا يوجد سجلات على الخادم.', { variant: 'info' });
        return;
      }

      // Try student-scoped bulk delete first
      const deleteRes = await fetch(`http://localhost:3000/api/students/${studentId}/assessments/delete-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });

      if (deleteRes.ok) {
        const body = await deleteRes.json().catch(() => null);
        setEvaluation(ZERO_EVALUATION);
        setAssessmentsHistory([]);
        setLastAssessmentDate(null);
        try { localStorage.removeItem(`qe_last_scores_${studentId}`); } catch (e) { /* ignore */ }
        enqueueSnackbar((body && body.deletedCount >= 0) ? `تمت إعادة التعيين وحذف ${body.deletedCount} سجل` : 'تمت إعادة التعيين وحذف السجلات على الخادم', { variant: 'success' });
        return;
      }

      // As a last resort, try the global bulk-delete endpoint
      const globalRes = await fetch(`http://localhost:3000/api/assessments/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });

      if (globalRes.ok) {
        const body = await globalRes.json().catch(() => null);
        setEvaluation(ZERO_EVALUATION);
        setAssessmentsHistory([]);
        setLastAssessmentDate(null);
        try { localStorage.removeItem(`qe_last_scores_${studentId}`); } catch (e) { /* ignore */ }
        enqueueSnackbar((body && body.deletedCount >= 0) ? `تمت إعادة التعيين وحذف ${body.deletedCount} سجل` : 'تمت إعادة التعيين وحذف السجلات على الخادم', { variant: 'success' });
        return;
      }

      enqueueSnackbar('فشل حذف سجلات التقييم على الخادم. حاول لاحقاً.', { variant: 'error' });
    } catch (error) {
      console.error('Error resetting assessments:', error);
      enqueueSnackbar('حدث خطأ أثناء محاولة إعادة التعيين. تأكد من تشغيل الخادم وحاول مرة أخرى.', { variant: 'error' });
    }
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
  try { setStudentsFollowupCounts(prev => ({ ...(prev||{}), [String(studentId)]: (Number(prev?.[String(studentId)]) || 0) + 1 })); } catch(e) {}
        enqueueSnackbar('تم إضافة متابعة', { variant: 'success' });
      } else {
        enqueueSnackbar('فشل في إضافة متابعة. حاول مرة أخرى.', { variant: 'error' });
      }
    } catch (e) {
      enqueueSnackbar('خطأ في الاتصال. تأكد من تشغيل الخادم.', { variant: 'error' });
    }
  };

  const openAddFollowupDialog = () => {
    setFollowupDialogType('متابعة');
    setFollowupDialogNotes('');
    setFollowupDialogOpenLocal(true);
  };

  const closeAddFollowupDialog = () => {
    setFollowupDialogOpenLocal(false);
  };

  const saveFollowupFromDialog = async () => {
    if (!studentId) {
      enqueueSnackbar('معرف الطالب غير موجود. لا يمكن إضافة متابعة.', { variant: 'error' });
      return;
    }
    try {
      const resp = await fetch(`http://localhost:3000/api/students/${studentId}/followups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: followupDialogType, notes: followupDialogNotes })
      });
      if (resp.ok) {
        const created = await resp.json().catch(() => null);
        const item = created ? {
          id: created.id,
          type: created.type,
          notes: created.notes ?? created.description ?? followupDialogNotes,
          isOpen: typeof created.isOpen !== 'undefined' ? Number(created.isOpen) : (created.is_open ? Number(created.is_open) : 1),
          createdAt: created.createdAt
        } : {
          id: Date.now(), type: followupDialogType, notes: followupDialogNotes, isOpen: 1, createdAt: new Date().toISOString()
        };
  setFollowups(prev => [item, ...prev]);
  try { setStudentsFollowupCounts(prev => ({ ...(prev||{}), [String(studentId)]: (Number(prev?.[String(studentId)]) || 0) + 1 })); } catch(e) {}
        enqueueSnackbar('تم إضافة المتابعة', { variant: 'success' });
        closeAddFollowupDialog();
      } else {
        enqueueSnackbar('فشل في إضافة المتابعة. حاول مرة أخرى.', { variant: 'error' });
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
    <div dir="rtl" className="w-full h-full" style={{ padding: '10px' }}>
      {/* Inject pulse keyframes for followup highlight */}
      <style>{`
        @keyframes qm-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.45); }
          50% { box-shadow: 0 0 0 8px rgba(255, 82, 82, 0.08); }
          100% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0); }
        }
      `}</style>
      <Paper
        elevation={4}
        sx={{
          borderRadius: 12,
          background: LEVEL_GRADIENTS[evaluation.student_level],
          width: 'calc(100vw - 40px)',
          /* slightly taller so sticky action bar stays visible */
          height: 'calc(100vh - 40px)',
          /* ensure inner white boxes are clipped to the rounded corners */
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1300
        }}
      >
        {/* Header with Student Info and Level */}
        <Box sx={{ 
          p: 2, 
          background: 'rgba(255,255,255,0.95)', 
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          /* match top rounded corners */
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          overflow: 'hidden'
        }}>
          <IconButton
            aria-label="إغلاق"
            onClick={() => onClose?.()}
            size="large"
            sx={{ 
              position: 'absolute', 
              right: 16, 
              top: 16,
              width: 40,
              height: 40,
              p: 0.5,
              zIndex: 1501,
              color: '#333',
              backgroundColor: '#f5f5f5',
              borderRadius: '50%',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              pointerEvents: 'auto',
              '&:hover': { backgroundColor: '#e8e8e8' }
            }}
          >
            <CloseIcon />
          </IconButton>

          <div className="flex items-center justify-between" style={{ position: 'relative' }}>
            {/* Center block: arrows immediately flanking the name */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
              <IconButton aria-label="prev" onClick={goNextStudent} size="large" sx={{ color: 'rgba(0,0,0,0.6)' }}>
                <ChevronRightIcon />
              </IconButton>

              <div style={{ textAlign: 'center', minWidth: 220 }}>
                <Avatar sx={{ 
                  bgcolor: LEVEL_COLORS[evaluation.student_level], 
                  width: 56,
                  height: 56,
                  fontSize: 20,
                  border: '2px solid white',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                  margin: '0 auto'
                }}>
                  <PersonIcon fontSize="medium" />
                </Avatar>

                <Typography variant="h5" sx={{ 
                  color: LEVEL_COLORS[evaluation.student_level], 
                  fontWeight: 'bold', 
                  mt: 1,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {studentName}
                </Typography>

                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 0.5 }}>{
                  (() => {
                    const cur = sectionStudents && Array.isArray(sectionStudents) ? sectionStudents.find((s: any) => String(s.id) === String(studentId)) : null;
                    return cur ? (cur.classOrder ?? cur.number ?? cur.id) : '';
                  })()
                }</Typography>
                {lastAssessmentDate && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    آخر تقييم: {formatDateShort(lastAssessmentDate)}
                  </Typography>
                )}
              </div>

              <IconButton aria-label="next" onClick={goPrevStudent} size="large" sx={{ color: 'rgba(0,0,0,0.6)' }}>
                <ChevronLeftIcon />
              </IconButton>
            </div>

            {/* Progress block remains to the far right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ minWidth: 220 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: LEVEL_COLORS[evaluation.student_level] }}>
                  التقدم نحو المستوى التالي
                </Typography>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <IconButton size="small" onClick={prevDisplayLevel} sx={{ bgcolor: 'rgba(0,0,0,0.04)' }}>
                        <ChevronLeftIcon />
                      </IconButton>
                      <LevelBadge level={displayLevel} />
                      <IconButton size="small" onClick={nextDisplayLevel} sx={{ bgcolor: 'rgba(0,0,0,0.04)' }}>
                        <ChevronRightIcon />
                      </IconButton>
                    </div>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{LEVEL_NAMES[displayLevel]}</Typography>
                  </div>

                  <div style={{ flex: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={getProgressToNextLevel()}
                      sx={{
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        flex: 1,
                        '& .MuiLinearProgress-bar': {
                          background: LEVEL_GRADIENTS[evaluation.student_level],
                          borderRadius: 6
                        }
                      }}
                    />
                    <Typography variant="body2" sx={{ color: LEVEL_COLORS[evaluation.student_level], textAlign: 'center', mt: 1, fontWeight: 'bold' }}>
                      {evaluation.total_xp} نقطة
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Box>

  {/* Content */}
  <Box sx={{ backgroundColor: 'white', pt: 2, px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 3, height: 'calc(100% - 120px)', overflowY: 'auto', boxSizing: 'border-box', position: 'relative', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
          {/* Student Number Grid */}
          {Array.isArray(sectionStudents) && sectionStudents.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon fontSize="small" />
                التنقل السريع بين الطلاب
              </Typography>
              <div className="flex gap-2 flex-wrap">
                {sectionStudents.map((s: any) => {
                  const num = s.classOrder ?? s.number ?? s.id;
                  const isCurrent = String(s.id) === String(studentId);
                  const count = Number(studentsFollowupCounts[String(s.id)] || 0);
                  const hasFollowup = count > 0;
                  return (
                    <Tooltip key={s.id} title={`${s.firstName ?? ''} ${s.lastName ?? ''}`.trim()}>
                      <Button
                        onClick={() => onSwitchStudent && onSwitchStudent(s.id)}
                        variant={isCurrent ? 'contained' : 'outlined'}
                        size="small"
                        sx={{
                          minWidth: 35,
                          height: 35,
                          borderRadius: 2,
                          fontWeight: 'bold',
                          fontSize: 13,
                          ...(isCurrent && {
                            background: LEVEL_GRADIENTS[evaluation.student_level],
                            boxShadow: `0 4px 15px ${LEVEL_COLORS[evaluation.student_level]}40`
                          }),
                          ...(hasFollowup && {
                            backgroundColor: '#ffebee',
                            color: '#b71c1c',
                            // faster pulse when count is higher
                            animation: `qm-pulse ${Math.max(0.6, 1.6 - Math.min(1.2, count * 0.2))}s infinite`
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
          <Box sx={{ mb: 1 }}>
            <div className="flex gap-2">
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
                  size="medium"
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
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
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2">
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
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

                {/* Notes card occupies the adjacent empty space */}
                <Card elevation={1} sx={{ borderRadius: 2, border: '1px solid #E0E0E0' }}>
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
                      rows={6}
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: 13, '&.Mui-focused fieldset': { borderColor: LEVEL_COLORS[evaluation.student_level] } }
                      }}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Notes were moved into the Bonus Points card above to use the empty space */}

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

                  {/* action buttons moved to persistent bar below the tabs */}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Persistent action bar: Close / Reset / Save - visible across all tabs */}
          <Box sx={{ position: 'sticky', bottom: 0, display: 'flex', justifyContent: 'flex-end', gap: 1, py: 1.5, px: 1, backgroundColor: 'white', borderTop: '1px solid rgba(0,0,0,0.06)', zIndex: 1400 }}>
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
          </Box>

          {activeTab === 'followups' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: LEVEL_COLORS[evaluation.student_level] }}>
                  المتابعات ({followups.length})
                </Typography>
                <Button size="medium" variant="contained" color="primary" onClick={() => createQuickFollowup('دفتر')} sx={{ borderRadius: 2 }}>
                  إضافة متابعة دفتر
                </Button>
                <Button size="medium" variant="contained" color="primary" onClick={() => createQuickFollowup('كتاب')} sx={{ borderRadius: 2 }}>
                  إضافة متابعة كتاب
                </Button>
                <IconButton aria-label="add-followup" onClick={openAddFollowupDialog} size="large" sx={{ ml: 1, bgcolor: 'rgba(0,0,0,0.04)' }}>
                  <AddIcon />
                </IconButton>
                {followups.length > 0 && (
                  <Button size="medium" color="error" variant="outlined" onClick={deleteAllFollowups} disabled={followupDeletingAll} sx={{ borderRadius: 2 }}>
                    {followupDeletingAll ? 'جارٍ الحذف...' : 'حذف الكل'}
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                <Dialog open={followupDialogOpenLocal} onClose={closeAddFollowupDialog} fullWidth maxWidth="sm">
                  <DialogTitle>إضافة متابعة</DialogTitle>
                  <DialogContent>
                    <TextField label="نوع المتابعة" fullWidth value={followupDialogType} onChange={(e) => setFollowupDialogType(e.target.value)} sx={{ mb: 2 }} />
                    <TextField label="ملاحظات" fullWidth multiline rows={3} value={followupDialogNotes} onChange={(e) => setFollowupDialogNotes(e.target.value)} />
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={closeAddFollowupDialog}>إلغاء</Button>
                    <Button variant="contained" onClick={saveFollowupFromDialog}>حفظ</Button>
                  </DialogActions>
                </Dialog>
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
                          size="medium" 
                          color="error" 
                          variant="outlined" 
                          onClick={() => closeFollowup(f.id)}
                          sx={{ borderRadius: 2 }}
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
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: LEVEL_COLORS[evaluation.student_level] }}>
                سجل التقييمات ({_assessmentsHistory.length})
              </Typography>
              {_assessmentsHistory.length === 0 && (
                <Card elevation={2} sx={{ borderRadius: 2, p: 2, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">لا توجد سجلات تقييم سابقة</Typography>
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