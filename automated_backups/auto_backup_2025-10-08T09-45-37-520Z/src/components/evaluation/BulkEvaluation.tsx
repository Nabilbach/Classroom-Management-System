import React, { useState, useMemo, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, IconButton, TextField, LinearProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useStudents } from '../../contexts/StudentsContext';

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

const ZERO: EvaluationData = {
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

const CATEGORIES = [
  { key: 'behavior_score', label: 'السلوك', xpMultiplier: 6 }, // 10 -> 60
  { key: 'participation_score', label: 'المشاركة', xpMultiplier: 10 },
  { key: 'notebook_score', label: 'الدفتر', xpMultiplier: 10 },
  { key: 'portfolio_score', label: 'الواجبات', xpMultiplier: 10 },
  { key: 'attendance_score', label: 'الحضور', xpMultiplier: 4 }, // 10 -> 40
];

const LEVEL_THRESHOLDS = [0, 150, 300, 450, 600];

function calculateXPAndLevel(scores: Partial<EvaluationData>) {
  const sliderFields: Array<keyof EvaluationData> = [
    'behavior_score','participation_score','notebook_score','attendance_score','portfolio_score'
  ];
  let sliderXP = 0;
  for (const f of sliderFields) {
    const v = (scores as any)[f] ?? 0;
    const cat = CATEGORIES.find(c => c.key === f);
    const mult = cat ? cat.xpMultiplier : 10;
    sliderXP += v * mult;
  }
  const quranXP = ((scores.quran_memorization ?? 0) as number) * 10;
  const bonusXP = ((scores.bonus_points ?? 0) as number) * 5;
  const total = Math.round(sliderXP + quranXP + bonusXP);

  let level = 1;
  if (total >= 600) level = 5;
  else if (total >= 450) level = 4;
  else if (total >= 300) level = 3;
  else if (total >= 150) level = 2;

  return { total_xp: total, student_level: level };
}

interface BulkEvaluationProps {
  open: boolean;
  onClose: () => void;
  sectionStudents: Array<{ id: number, name?: string }>; 
  sectionName?: string;
  onDone?: (result: { success: number; failed: number; errors: any[] }) => void;
}

const BulkEvaluation: React.FC<BulkEvaluationProps> = ({ open, onClose, sectionStudents, sectionName, onDone }) => {
  const [evalState, setEvalState] = useState<EvaluationData>({ ...ZERO, behavior_score: 10, attendance_score: 10 });
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ total: 0, done: 0, success: 0, failed: 0 });
  const abortRef = useRef<AbortController | null>(null);

  const derived = useMemo(() => calculateXPAndLevel(evalState), [evalState]);

  const changeField = (field: keyof EvaluationData, delta: number) => {
    setEvalState(prev => {
      const next = Math.max(0, Math.min(10, (prev as any)[field] + delta));
      const updated = { ...prev, [field]: next } as EvaluationData;
      const d = calculateXPAndLevel(updated);
      return { ...updated, total_xp: d.total_xp, student_level: d.student_level };
    });
  };

  const setField = (field: keyof EvaluationData, value: number) => {
    setEvalState(prev => {
      const v = Math.max(0, Math.min(10, value));
      const updated = { ...prev, [field]: v } as EvaluationData;
      const d = calculateXPAndLevel(updated);
      return { ...updated, total_xp: d.total_xp, student_level: d.student_level };
    });
  };

  const { updateStudentLocal } = useStudents();

  const handleSaveAll = async () => {
    if (!sectionStudents || sectionStudents.length === 0) {
      alert('لا يوجد طلاب في هذا القسم.');
      return;
    }
    if (!confirm(`هل أنت متأكد أنك تريد تطبيق هذا التقييم على ${sectionStudents.length} طالب في القسم ${sectionName || ''}؟`)) return;

    setRunning(true);
    setProgress({ total: sectionStudents.length, done: 0, success: 0, failed: 0 });
    abortRef.current = new AbortController();
  const errors: any[] = [];
  let successCount = 0;
  let failedCount = 0;

  for (const s of sectionStudents) {
      if (abortRef.current?.signal.aborted) break;
      const payload: any = {};
      payload.scores = {
        behavior_score: evalState.behavior_score,
        participation_score: evalState.participation_score,
        notebook_score: evalState.notebook_score,
        attendance_score: evalState.attendance_score,
        portfolio_score: evalState.portfolio_score,
        quran_memorization: evalState.quran_memorization,
        bonus_points: evalState.bonus_points,
      };
      // new_score: use sum of fields (compat with QuickEvaluation)
      const sumScore = Object.values(payload.scores).reduce((a: any, b: any) => Number(a) + Number(b), 0);
      payload.new_score = sumScore;
      payload.total_xp = evalState.total_xp;
      payload.student_level = evalState.student_level;
      payload.notes = evalState.notes || '';

      try {
        const res = await fetch(`http://localhost:3000/api/students/${s.id}/assessment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          errors.push({ studentId: s.id, status: res.status, body: txt });
          failedCount += 1;
          setProgress(p => ({ ...p, done: p.done + 1, failed: p.failed + 1 }));
        } else {
          // optimistic update to local cache so UI shows XP immediately
          try {
            if (typeof updateStudentLocal === 'function') {
              updateStudentLocal(Number(s.id), { total_xp: payload.total_xp, score: payload.new_score });
            }
          } catch (e) { console.warn('BulkEvaluation optimistic update failed', e); }
          successCount += 1;
          setProgress(p => ({ ...p, done: p.done + 1, success: p.success + 1 }));
        }
      } catch (e) {
        errors.push({ studentId: s.id, error: String(e) });
        setProgress(p => ({ ...p, done: p.done + 1, failed: p.failed + 1 }));
      }
    }

  setRunning(false);
  abortRef.current = null;
  onDone && onDone({ success: successCount, failed: failedCount, errors });
  // refresh count: we leave parent to call fetchStudents via onDone handler
  alert(`انتهت العملية. نجاح: ${successCount} فشل: ${failedCount}`);
  };

  const handleCancel = () => {
    if (running && abortRef.current) {
      abortRef.current.abort();
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth dir="rtl">
      <DialogTitle>تقييم جميع طلاب القسم {sectionName ? ` - ${sectionName}` : ''}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2 }}>اضبط قيم التقييم أدناه ثم اضغط "تطبيق على كل الطلاب". سيتم إرسال تقييم مستقل لكل طالب بنفس القيم.</Typography>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {CATEGORIES.map(cat => (
            <Box key={cat.key} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography sx={{ minWidth: 110 }}>{cat.label}</Typography>
              <IconButton size="small" onClick={() => changeField(cat.key as any, -0.5)}><RemoveIcon fontSize="small" /></IconButton>
              <TextField size="small" value={(evalState as any)[cat.key]} onChange={(e) => setField(cat.key as any, Number(e.target.value || 0))} inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} sx={{ width: 90 }} />
              <IconButton size="small" onClick={() => changeField(cat.key as any, 0.5)}><AddIcon fontSize="small" /></IconButton>
              <Typography sx={{ marginLeft: 2, color: '#666' }}>{`+${Math.round((evalState as any)[cat.key] * cat.xpMultiplier)} XP`}</Typography>
            </Box>
          ))}

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
            <Typography sx={{ fontWeight: 'bold' }}>المجموع المتوقع:</Typography>
            <Typography>{derived.total_xp} XP</Typography>
            <Typography sx={{ color: '#666' }}>المستوى: {derived.student_level}</Typography>
          </Box>

          {running && (
            <Box sx={{ width: '100%', mt: 1 }}>
              <LinearProgress variant="determinate" value={(progress.done / Math.max(1, progress.total)) * 100} />
              <Typography variant="caption">تم: {progress.done} من {progress.total} · نجاح: {progress.success} · فشل: {progress.failed}</Typography>
            </Box>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="inherit">إغلاق</Button>
        <Button onClick={handleSaveAll} variant="contained" color="primary" disabled={running || !(sectionStudents && sectionStudents.length)}>
          {running ? 'جارٍ التطبيق...' : `تطبيق على ${sectionStudents ? sectionStudents.length : 0} طالب`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkEvaluation;
