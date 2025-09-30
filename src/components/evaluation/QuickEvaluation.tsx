                                                                                                                                                                      import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { Paper, Box, Typography, Button, TextField, Slider, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
// ...existing code... (StudentQuickList removed in favor of inline grid)

interface QuickEvaluationProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
  onSave?: (evaluation: any) => void;
  // optional: students in the current section so the quick-list can be shown inside the modal
  sectionStudents?: Array<any>;
  // optional callback to switch the modal to another student without closing it
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
  1: "text-gray-600",
  2: "text-blue-600",
  3: "text-green-600",
  4: "text-purple-600",
  5: "text-yellow-600",
};

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

function QuickEvaluation({ studentId, studentName, onClose, onSave, sectionStudents = [], onSwitchStudent }: QuickEvaluationProps) {
  const [evaluation, setEvaluation] = useState<EvaluationData>(ZERO_EVALUATION);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastAssessmentDate, setLastAssessmentDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'evaluation' | 'followups' | 'history'>('evaluation');
  const [followups, setFollowups] = useState<any[]>([]);
  const [followupLoading, setFollowupLoading] = useState(false);
  const [followupDeletingAll, setFollowupDeletingAll] = useState(false);
  // map of studentId -> hasOpenFollowup
  const [_studentsWithFollowups, setStudentsWithFollowups] = useState<Record<string, boolean>>({});
  const { enqueueSnackbar } = useSnackbar();
  const [collapsed, setCollapsed] = useState(false);
  const [_assessmentsHistory, setAssessmentsHistory] = useState<any[]>([]);

  // جلب التقييم الحالي
  useEffect(() => {
    // When the selected student changes, reset local UI state immediately
    // to avoid showing the previous student's sliders while we load data.
      setEvaluation(ZERO_EVALUATION);
      // Try to restore any locally-saved slider values for this student so that
      // if the backend only stores aggregate `new_score` we still show the
      // last detailed sliders the teacher set.
      try {
        if (studentId) {
          const key = `qe_last_scores_${studentId}`;
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              // compute xp/level based on restored sliders
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
        // ignore localStorage errors (e.g., private mode) and continue
      }
    setAssessmentsHistory([]);
    setLastAssessmentDate(null);

    // load assessments and followups when studentId changes
    const loadAll = async () => {
      setLoading(true);
      try {
        await loadAssessments();
      } finally {
        setLoading(false);
      }
    };
    void loadAll();
    // also fetch followups when opening for this student
    const fetchFollowups = async () => {
      setFollowupLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/api/students/${studentId}/followups`);
        if (res.ok) {
          const data = await res.json();
          // Normalize shape and only keep open followups for the quick list
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

  fetchFollowups();
    // Also check followups for visible section students (so the right-hand grid can highlight numbers)
    const fetchSectionStudentsFollowups = async () => {
      try {
        if (!Array.isArray(sectionStudents) || sectionStudents.length === 0) return;
        // Only check up to 40 slots shown in the grid
        const toCheck = sectionStudents.slice(0, 40);
        const results = await Promise.all(toCheck.map(async (s: any) => {
          try {
            const r = await fetch(`http://localhost:3000/api/students/${s.id}/followups`);
            if (!r.ok) return { id: s.id, has: false };
            const data = await r.json().catch(() => []);
            // consider there's an open followup if any followup in the list is open (isOpen/is_open !== 0)
            const anyOpen = (Array.isArray(data) ? data : []).some((f: any) => {
              if (typeof f.isOpen !== 'undefined') return Number(f.isOpen) === 1;
              if (typeof f.is_open !== 'undefined') return Number(f.is_open) === 1;
              // fallback: absence of an explicit closed flag => treat as open
              return true;
            });
            return { id: s.id, has: anyOpen };
          } catch (e) {
            return { id: s.id, has: false };
          }
        }));
  const map: Record<string, boolean> = {};
  results.forEach((r) => { map[String(r.id)] = Boolean(r.has); });
  setStudentsWithFollowups(map);
      } catch (e) {
        console.error('Failed fetching section students followups', e);
      }
    };

    // run fetch but don't block initial render
    fetchSectionStudentsFollowups();
  }, [studentId]);

  // حساب XP والمستوى عند التغيير
  const calculateXPAndLevel = (scores: Partial<EvaluationData>) => {
    // Use nullish coalescing so that explicit 0 values are preserved (0 ?? 0 === 0)
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

  // تحديث قيمة Slider
  // Use functional setState to avoid stale-closure updates when many rapid changes occur (e.g. dragging a slider)
  const updateScore = (field: keyof EvaluationData, value: number) => {
    setEvaluation(prev => {
      const updated = { ...prev, [field]: value } as EvaluationData;
      const { total_xp, student_level } = calculateXPAndLevel(updated);
      return { ...updated, total_xp, student_level };
    });
  };

  // Helper to normalize slider onChange callbacks from different component implementations.
  // Some sliders call onChange(value), others call onChange(event, value).
  const handleSliderChange = (field: keyof EvaluationData, ...args: any[]) => {
    let raw: any = undefined;
    if (args.length === 1) raw = args[0];
    else if (args.length >= 2) raw = args[1];

    // If first arg was the event, try to pull value from event.target
    if (raw && typeof raw === 'object' && 'target' in raw) raw = (raw.target as any).value;

    const num = parseFloat(String(raw ?? '0'));
    updateScore(field, Number.isNaN(num) ? 0 : num);
  };

  // (no visual flip mapping; sliders use natural LTR behavior so dragging right increases value)

  // Load assessments history for the student (used by the new 'سجل التقييم' tab)
  const loadAssessments = async () => {
    if (!studentId) return;
    try {
      const res = await fetch(`http://localhost:3000/api/students/${studentId}/assessments`);
      if (!res.ok) {
        setAssessmentsHistory([]);
        return;
      }
      const data = await res.json().catch(() => []);
      // Normalize entries and sort by date descending
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

      // If the most recent entry contains detailed scores, populate the sliders
      // so the UI shows the saved breakdown for the newly-selected student.
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
          const { total_xp, student_level } = calculateXPAndLevel(parsed as Partial<EvaluationData>);
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
      } else if (latest && typeof latest.new_score === 'number') {
        // Backend returned only an aggregate new_score (no detailed `scores`).
        // Do NOT overwrite the user's slider inputs — keep current slider values.
        // Only update lightweight metadata (notes) if present. Avoid reading
        // non-guaranteed properties to keep TypeScript happy.
        setEvaluation(prev => ({
          ...prev,
          notes: latest.notes ?? prev.notes,
        } as EvaluationData));
      }
    } catch (e) {
      console.error('Failed loading assessments history', e);
      setAssessmentsHistory([]);
    }
  };

  // (removed noisy debug logging for evaluation state)

  // حفظ التقييم
  const handleSave = async () => {
    console.log('QuickEvaluation.handleSave invoked', { studentId, evaluation });

    if (!studentId) {
      enqueueSnackbar('لا يوجد معرف طالب صالح لحفظ التقييم.', { variant: 'error' });
      return;
    }

    // Map the current evaluation sliders to a numeric score expected by backend
    const sliderAverage = (
      evaluation.behavior_score +
      evaluation.participation_score +
      evaluation.notebook_score +
      evaluation.attendance_score +
      evaluation.portfolio_score
    ) / 5; // 0..10
    const new_score = Number((sliderAverage * 2).toFixed(2)); // normalize to 0..20

    setSaving(true);
    try {
      // Prepare detailed scores payload so backend can persist individual slider values, quran and bonus
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_score, notes: evaluation.notes || '', scores: scoresPayload, total_xp: evaluation.total_xp, student_level: evaluation.student_level }),
      });

      if (response.ok) {
        let saved = null;
        try { saved = await response.json(); } catch (e) { /* ignore parse errors */ }
  console.log('✅ تم حفظ التقييم بنجاح', saved);
  enqueueSnackbar('تم حفظ التقييم بنجاح', { variant: 'success' });
        // set last assessment date to now or returned date
        const returnedDate = (saved && (saved.date || saved.createdAt || saved.updatedAt)) || new Date().toISOString();
        setLastAssessmentDate(String(returnedDate));
        // If backend returned the saved scores, update local evaluation state so sliders show saved values
        if (saved && saved.scores) {
          let s = saved.scores;
          if (typeof s === 'string') {
            try { s = JSON.parse(s); } catch (e) { s = null; }
          }
          if (s && typeof s === 'object') {
            const merged = {
              ...evaluation,
              behavior_score: Number(s.behavior_score ?? evaluation.behavior_score ?? 0),
              participation_score: Number(s.participation_score ?? evaluation.participation_score ?? 0),
              notebook_score: Number(s.notebook_score ?? evaluation.notebook_score ?? 0),
              attendance_score: Number(s.attendance_score ?? evaluation.attendance_score ?? 0),
              portfolio_score: Number(s.portfolio_score ?? evaluation.portfolio_score ?? 0),
              quran_memorization: Number(s.quran_memorization ?? evaluation.quran_memorization ?? 0),
              bonus_points: Number(s.bonus_points ?? evaluation.bonus_points ?? 0),
              notes: saved.notes ?? evaluation.notes,
              total_xp: typeof saved.total_xp === 'number' ? saved.total_xp : evaluation.total_xp,
              student_level: typeof saved.student_level === 'number' ? saved.student_level : evaluation.student_level,
            } as EvaluationData;
            setEvaluation(merged);
            // persist detailed saved breakdown locally so returning to this student
            // restores the sliders immediately even if server later only returns new_score
            try { localStorage.setItem(`qe_last_scores_${studentId}`, JSON.stringify(merged)); } catch (e) { /* ignore */ }
          }
        } else if (saved && typeof saved.new_score === 'number') {
          // Backend returned only new_score (0..20). Don't overwrite per-slider inputs --
          // keep the user's slider values and only update metadata (XP/level/notes) if provided.
          setEvaluation(prev => ({
            ...prev,
            notes: saved.notes ?? prev.notes,
            total_xp: typeof saved.total_xp === 'number' ? saved.total_xp : prev.total_xp,
            student_level: typeof saved.student_level === 'number' ? saved.student_level : prev.student_level,
          } as EvaluationData));
          // Save the current slider state locally so it will be restored next time
          try {
            const toSave = {
              behavior_score: evaluation.behavior_score ?? 0,
              participation_score: evaluation.participation_score ?? 0,
              notebook_score: evaluation.notebook_score ?? 0,
              attendance_score: evaluation.attendance_score ?? 0,
              portfolio_score: evaluation.portfolio_score ?? 0,
              quran_memorization: evaluation.quran_memorization ?? 0,
              bonus_points: evaluation.bonus_points ?? 0,
              notes: saved.notes ?? evaluation.notes ?? '',
              total_xp: typeof saved.total_xp === 'number' ? saved.total_xp : evaluation.total_xp,
              student_level: typeof saved.student_level === 'number' ? saved.student_level : evaluation.student_level,
            };
            localStorage.setItem(`qe_last_scores_${studentId}`, JSON.stringify(toSave));
          } catch (e) { /* ignore localStorage errors */ }
        } else {
          // No detailed data returned: keep current UI values (do not reset to zero)
          try { onSave?.(saved); } catch (e) { console.error('Error in onSave callback', e); }
        }
        // Refresh history after successful save
        try { await loadAssessments(); } catch (e) { /* ignore */ }
      } else {
        const text = await response.text().catch(() => '');
        console.error('❌ خطأ في حفظ التقييم - server responded with', response.status, text);
        try { window.alert('فشل في حفظ التقييم. تحقق من الاتصال أو أعد المحاولة.'); } catch (e) {}
      }
    } catch (error) {
      console.error('❌ خطأ في الشبكة:', error);
      try { window.alert('تعذر الاتصال بالخادم. تأكد أن السيرفر يعمل على http://localhost:3000'); } catch (e) {}
    } finally {
      setSaving(false);
    }
  };

  const resetToZero = () => {
    // Ask for confirmation because this will clear persisted assessments (ONLY assessments)
  const ok = window.confirm('هل أنت متأكد؟ سيؤدي هذا إلى حذف جميع سجلات التقييم لهذا الطالب (سجلات التقييم فقط) وإعادة تعيين نقاط الخبرة والتاريخ. لن يتم حذف المتابعات. هذا الإجراء لا يمكن التراجع عنه.');
  if (!ok) return;

    (async () => {
      try {
  const url = `http://localhost:3000/api/students/${studentId}/assessments/reset`;
  console.log('[QuickEvaluation] Resetting assessments via POST at', url);
  const resp = await fetch(url, { method: 'POST' });
  const text = await resp.text().catch(() => '');
  let body: any = {};
  try { body = text ? JSON.parse(text) : {}; } catch (e) { body = { rawText: text }; }
        if (!resp.ok) {
          console.error('[QuickEvaluation] delete response not ok', resp.status, resp.statusText, body);
          // If the reset endpoint is not available, try a safe fallback: fetch assessments and attempt to delete them individually.
          if (resp.status === 404) {
            // The primary reset endpoint is not present on this backend.
            // To avoid spamming the server with many per-assessment requests (which triggers many 404s),
            // attempt a small set of reasonable "bulk delete" endpoints once with an array of IDs.
            enqueueSnackbar('نقطة نهاية إعادة التعيين غير متوفرة على الخادم. سيتم محاولة حذف السجلات بطريقة مجمعة إن أمكن (لن يتم لمس المتابعات).', { variant: 'warning' });
            try {
              const listRes = await fetch(`http://localhost:3000/api/students/${studentId}/assessments`);
              if (!listRes.ok) {
                enqueueSnackbar('فشل في جلب سجلات التقييم للمحاولة البديلة. تأكد من أن الخادم يدعم استعلام التقييمات.', { variant: 'error' });
                return;
              }
              const assessments = await listRes.json().catch(() => []);
              if (!Array.isArray(assessments) || assessments.length === 0) {
                enqueueSnackbar('لم يتم العثور على سجلات تقييم للحذف.', { variant: 'info' });
                return;
              }

              const ids = assessments.map((a: any) => a.id ?? a._id ?? a.assessmentId).filter((id: any) => !!id);
              if (ids.length === 0) {
                enqueueSnackbar('لم يتم العثور على معرفات سجلات قابلة للحذف.', { variant: 'error' });
                return;
              }

              // Try a small list of plausible bulk-delete endpoints (one-shot). Stop after the first success.
              const bulkCandidates = [
                { method: 'POST', url: `http://localhost:3000/api/students/${studentId}/assessments/delete-bulk`, body: { ids } },
                { method: 'POST', url: `http://localhost:3000/api/assessments/bulk-delete`, body: { ids } },
                { method: 'DELETE', url: `http://localhost:3000/api/students/${studentId}/assessments`, body: { ids } },
              ];

              let succeededCount = 0;
              let usedEndpoint: string | null = null;

              for (const candidate of bulkCandidates) {
                try {
                  const opt: any = { method: candidate.method, headers: { 'Content-Type': 'application/json' } };
                  if (candidate.body) opt.body = JSON.stringify(candidate.body);
                  const r = await fetch(candidate.url, opt);
                  if (r.ok || r.status === 204) {
                    usedEndpoint = candidate.url;
                    // Try to parse how many were deleted (best-effort)
                    const body = await r.text().catch(() => '');
                    try {
                      const parsed = body ? JSON.parse(body) : {};
                      if (Array.isArray(parsed.deletedIds)) succeededCount = parsed.deletedIds.length;
                      else if (typeof parsed.deletedCount === 'number') succeededCount = parsed.deletedCount;
                    } catch (e) {
                      // ignore parse errors
                    }
                    // If server didn't tell us, assume all requested were deleted
                    if (!succeededCount) succeededCount = ids.length;
                    break;
                  } else if (r.status === 404) {
                    // endpoint not present - try next candidate without noisy logging
                    continue;
                  }
                } catch (e) {
                  // network error, try next candidate
                  continue;
                }
              }

              if (usedEndpoint) {
                enqueueSnackbar(`تم حذف ${succeededCount} من سجلات التقييم عبر ${usedEndpoint}`, { variant: succeededCount > 0 ? 'success' : 'info' });
                // Clear local UI state
                const zeroEval: EvaluationData = {
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
                setEvaluation(zeroEval);
                setLastAssessmentDate(null);
                try { onSave?.({ deletedAssessments: true, deletedCount: succeededCount }); } catch (e) { console.error('onSave threw', e); }
                return;
              }

              // If we reach here, none of the bulk candidates existed. Don't attempt noisy per-item deletes.
              enqueueSnackbar('لم يتم العثور على واجهة لحذف السجلات تلقائيًا على الخادم. لإكمال الحذف، أضِف نقطة نهاية مجمعة أو احذف السجلات يدوياً على الخادم. (جرب إضافة /api/students/:id/assessments/delete-bulk أو /api/assessments/bulk-delete).', { variant: 'error' });
              console.warn('[QuickEvaluation] bulk-delete endpoints not found; aborting to avoid many 404s. Available assessment ids:', ids.slice(0, 20));
            } catch (fallbackErr) {
              console.error('[QuickEvaluation] fallback delete failed', fallbackErr);
              enqueueSnackbar('فشل الأسلوب البديل لحذف السجلات. تحقق من إعدادات الخادم.', { variant: 'error' });
            }
          } else {
            enqueueSnackbar(`فشل في حذف سجلات التقييم: ${resp.status} ${resp.statusText}`, { variant: 'error' });
          }
          return;
        }

        console.log('[QuickEvaluation] delete response', body);
        enqueueSnackbar('تم حذف سجلات التقييم وإعادة التعيين.', { variant: 'info' });
        // Clear local UI state
        const zeroEval: EvaluationData = {
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
        setEvaluation(zeroEval);
        setLastAssessmentDate(null);
        // notify parent to refresh lists (explicit about assessments only)
        try { onSave?.({ deletedAssessments: true, deletedCount: body.deletedCount ?? 0 }); } catch (e) { console.error('onSave threw', e); }
      } catch (error) {
        // Provide richer error info for debugging
  console.error('Error resetting assessments:', (error as any) && ((error as any).message || error));
        try { window.alert('فشل في حذف سجلات التقييم بسبب خطأ في الشبكة. تحقق من اتصال السيرفر وحاول مجددًا.'); } catch (e) {}
      }
    })();
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
        // prepend to local list (normalize shape)
        const item = created ? { id: created.id, type: created.type, notes: created.notes ?? created.description ?? '', isOpen: typeof created.isOpen !== 'undefined' ? Number(created.isOpen) : (created.is_open ? Number(created.is_open) : 1), createdAt: created.createdAt } : { id: Date.now(), type, notes: '', isOpen: 1, createdAt: new Date().toISOString() };
        setFollowups(prev => [item, ...prev]);
  enqueueSnackbar('تم إضافة متابعة', { variant: 'success' });
      } else {
        const txt = await resp.text().catch(() => '');
        console.error('Failed creating followup', resp.status, txt);
  enqueueSnackbar('فشل في إضافة متابعة. حاول مرة أخرى.', { variant: 'error' });
      }
    } catch (e) {
      console.error('Network error creating followup', e);
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
        // remove/refresh local list
        setFollowups(prev => prev.filter(f => String(f.id) !== String(id)));
  enqueueSnackbar('تم إغلاق المتابعة', { variant: 'success' });
        try { onSave?.({ closedFollowup: id }); } catch (e) { console.error('onSave threw', e); }
      } else {
        const txt = await resp.text().catch(() => '');
        console.error('Failed closing followup', resp.status, txt);
  enqueueSnackbar('فشل في إغلاق المتابعة. حاول مرة أخرى.', { variant: 'error' });
      }
    } catch (e) {
      console.error('Network error closing followup', e);
  enqueueSnackbar('خطأ في الاتصال. تأكد من تشغيل الخادم.', { variant: 'error' });
    }
  };

  // حذف جميع المتابعات الخاصة بالتلميذ
  const deleteAllFollowups = async () => {
    if (!studentId) return;
    const ok = window.confirm('هل أنت متأكد؟ سيؤدي هذا إلى حذف جميع المتابعات لهذا التلميذ ولن يمكن التراجع عن هذا الإجراء.');
    if (!ok) return;

    setFollowupDeletingAll(true);
    try {
      // The backend does not implement a bulk DELETE for followups. Close each followup individually.
      if (!followups || followups.length === 0) {
        enqueueSnackbar('لا توجد متابعات مفتوحة للحذف.', { variant: 'info' });
        return;
      }

      const results = await Promise.all(followups.map(async (f) => {
        try {
          // Prefer the student-scoped close endpoint
          const r = await fetch(`http://localhost:3000/api/students/${studentId}/followups/${f.id}/close`, { method: 'PATCH' });
          if (r.ok) return { id: f.id, ok: true };
          // fallback to generic patch
          const r2 = await fetch(`http://localhost:3000/api/followups/${f.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_open: 0 }) });
          return { id: f.id, ok: r2.ok };
        } catch (e) {
          return { id: f.id, ok: false, error: e };
        }
      }));

      const successCount = results.filter(r => r.ok).length;
      if (successCount > 0) {
        enqueueSnackbar(`تم إغلاق ${successCount} من ${followups.length} متابعات.`, { variant: 'success' });
      } else {
        enqueueSnackbar('فشل في إغلاق المتابعات. تأكد من إعدادات الخادم.', { variant: 'error' });
      }

      // Refresh followups from server to reflect closed ones
      try {
        const ref = await fetch(`http://localhost:3000/api/students/${studentId}/followups`);
        if (ref.ok) {
          const data = await ref.json();
          const normalized = (Array.isArray(data) ? data : []).map((f: any) => ({
            id: f.id,
            type: f.type,
            notes: f.notes ?? f.description ?? '',
            isOpen: typeof f.isOpen !== 'undefined' ? Number(f.isOpen) : (f.is_open ? Number(f.is_open) : 1),
            createdAt: f.createdAt,
            updatedAt: f.updatedAt,
          })).filter((f: any) => f.isOpen === 1);
          setFollowups(normalized);
        } else {
          setFollowups([]);
        }
      } catch (e) {
        console.error('Failed to refresh followups after close-all', e);
      }
      try { onSave?.({ deletedAllFollowups: true, deletedCount: successCount }); } catch (e) { console.error('onSave threw', e); }
    } catch (e) {
      console.error('Network error deleting all followups', e);
      enqueueSnackbar('خطأ في الاتصال. تأكد من تشغيل الخادم.', { variant: 'error' });
    } finally {
      setFollowupDeletingAll(false);
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
      <Paper className="w-full max-w-2xl mx-auto" elevation={1}>
        <Box className="text-center p-8">
          <Typography>جاري تحميل التقييم...</Typography>
        </Box>
      </Paper>
    );
  }

  // determine current student object from sectionStudents if available
  const currentStudent = Array.isArray(sectionStudents) ? sectionStudents.find(s => String(s.id) === String(studentId)) : undefined;

  return (
  // Make the modal much wider and allow layout to place items in two columns
  // Use full available width and add horizontal padding so contents don't wrap; parent dialog must allow larger width
  <div dir="rtl" className="flex gap-4 w-full max-w-full mx-auto px-6" style={{ alignItems: 'flex-start' }}>
      <div className="flex-1">
        <Paper
          data-testid="quick-eval-paper"
          elevation={3}
          sx={{
            width: '70vw',
            maxWidth: '95vw',
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.08)',
            margin: '0 auto',
            position: 'relative',
            backgroundColor: (theme) => theme.palette.background.paper,
          }}
        >
          <Box sx={{ p: 3 }}>
            {/* close button top-left as an X */}
            <IconButton
              aria-label="إغلاق"
              onClick={onClose}
              data-testid="quick-eval-close"
              size="small"
              sx={{ position: 'absolute', left: 8, top: 8 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            {/* Header: small title (left), centered student name between arrows, right = level/xp + toggle */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>تقييم سريع</Typography>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <IconButton
                  aria-label="السابق"
                  size="small"
                  onClick={() => {
                    if (!sectionStudents || !sectionStudents.length) return;
                    const idx = sectionStudents.findIndex(s => String(s.id) === String(studentId));
                    const prev = sectionStudents[(idx > 0 ? idx - 1 : sectionStudents.length - 1)];
                    if (prev && onSwitchStudent) onSwitchStudent(prev.id);
                  }}
                  data-testid="quick-eval-prev"
                >
                  <ChevronRightIcon />
                </IconButton>

                <div style={{ textAlign: 'center', minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{studentName}</Typography>
                  </div>
                  <div style={{ marginTop: 2 }} className="text-sm text-gray-500">
                    {currentStudent ? `رقم: ${currentStudent.classOrder ?? currentStudent.number ?? currentStudent.id}` : ''}
                    {currentStudent && (currentStudent.sectionName || currentStudent.section_name) ? ` • ${currentStudent.sectionName ?? currentStudent.section_name}` : ''}
                  </div>
                </div>

                <IconButton
                  aria-label="التالي"
                  size="small"
                  onClick={() => {
                    if (!sectionStudents || !sectionStudents.length) return;
                    const idx = sectionStudents.findIndex(s => String(s.id) === String(studentId));
                    const next = sectionStudents[(idx === -1 ? 0 : (idx + 1) % sectionStudents.length)];
                    if (next && onSwitchStudent) onSwitchStudent(next.id);
                  }}
                  data-testid="quick-eval-next"
                >
                  <ChevronLeftIcon />
                </IconButton>
              </div>

              <div style={{ textAlign: 'right' }}>
                <Box sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 1, px: 1.25, py: 0.5, display: 'inline-block', backgroundColor: (theme) => theme.palette.background.paper }}>
                  <Typography sx={{ fontWeight: 700 }} className={LEVEL_COLORS[evaluation.student_level]}>{LEVEL_NAMES[evaluation.student_level]}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>المستوى {evaluation.student_level} • 💎 {evaluation.total_xp} XP</Typography>
                </Box>
                <div>
                  <IconButton
                    aria-label={collapsed ? 'إظهار الأرقام' : 'إخفاء الأرقام'}
                    onClick={() => setCollapsed(c => !c)}
                    data-testid="quick-eval-toggle-numbers-rt"
                    size="small"
                  >
                {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
                  </IconButton>
                </div>
              </div>
            </div>

        {/* Tabs */}
        <div className="mb-4">
          <div className="flex gap-2">
            <button className={`px-3 py-1 rounded ${activeTab === 'evaluation' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`} onClick={() => setActiveTab('evaluation')}>تقييم</button>
            <button className={`px-3 py-1 rounded ${activeTab === 'followups' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`} onClick={() => setActiveTab('followups')}>متابعة</button>
            <button className={`px-3 py-1 rounded ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`} onClick={() => { setActiveTab('history'); loadAssessments(); }}>سجل التقييم</button>
          </div>
        </div>

        {/* Tab content */}
  {activeTab === 'evaluation' && (
          // Use a 2-column grid to reduce vertical height so scrolling isn't needed
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-0">
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <Typography>😊 السلوك</Typography>
                  <div className="text-sm text-gray-700">{evaluation.behavior_score.toFixed(1)}/10</div>
                </div>
                <Slider
                  min={0}
                  max={10}
                  step={0.1}
                  value={Number(evaluation.behavior_score ?? 0)}
                  onChange={(e, v) => handleSliderChange('behavior_score', e, v)}
                  aria-labelledby="behavior-slider"
                />
                <div className="text-sm text-gray-600">{getBehaviorText(evaluation.behavior_score)}</div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <Typography>🗣️ المشاركة</Typography>
                  <div className="text-sm text-gray-700">{evaluation.participation_score.toFixed(1)}/10</div>
                </div>
                <Slider
                  min={0}
                  max={10}
                  step={0.1}
                  value={Number(evaluation.participation_score ?? 0)}
                  onChange={(e, v) => handleSliderChange('participation_score', e, v)}
                />
              </div>

              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <Typography>📝 الدفتر</Typography>
                  <div className="text-sm text-gray-700">{evaluation.notebook_score.toFixed(1)}/10</div>
                </div>
                <Slider
                  min={0}
                  max={10}
                  step={0.1}
                  value={Number(evaluation.notebook_score ?? 0)}
                  onChange={(e, v) => handleSliderChange('notebook_score', e, v)}
                />
              </div>

              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <Typography>🎯 البورتفوليو</Typography>
                  <div className="text-sm text-gray-700">{evaluation.portfolio_score.toFixed(1)}/10</div>
                </div>
                <Slider
                  min={0}
                  max={10}
                  step={0.1}
                  value={Number(evaluation.portfolio_score ?? 0)}
                  onChange={(e, v) => handleSliderChange('portfolio_score', e, v)}
                />
              </div>

              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <Typography>📅 الحضور</Typography>
                  <div className="text-sm text-gray-700">{evaluation.attendance_score.toFixed(1)}/10</div>
                </div>
                <Slider
                  min={0}
                  max={10}
                  step={0.1}
                  value={Number(evaluation.attendance_score ?? 0)}
                  onChange={(e, v) => handleSliderChange('attendance_score', e, v)}
                />
              </div>
            </div>

            <div>
              <div className="mb-3 col-span-2">
                <div className="mb-2 font-medium text-gray-800">📿 حفظ القرآن</div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[{ value: 0, label: "لم يحفظ", reward: "0 XP" }, { value: 5, label: "جزئي", reward: "+50 XP" }, { value: 10, label: "كامل", reward: "+100 XP" }, { value: 15, label: "متقن", reward: "+150 XP" }].map((option) => (
                    <Button key={option.value} size="small" variant={evaluation.quran_memorization === option.value ? "contained" : "outlined"} color={evaluation.quran_memorization === option.value ? "success" : "inherit"} onClick={() => updateScore('quran_memorization', option.value)} sx={{ fontSize: 12, p: 1 }}>
                      <div className="text-center"><div>{option.label}</div><div className="text-xs">{option.reward}</div></div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <div className="mb-2 font-medium text-gray-800">⭐ أعمال مميزة (+{evaluation.bonus_points * 5} XP)</div>
                <input type="number" className="border rounded p-2 w-full" value={Number(evaluation.bonus_points)} onChange={(e) => { const v = (e.target as HTMLInputElement).value; const num = v === '' ? 0 : Number(v); updateScore('bonus_points', Number.isNaN(num) ? 0 : num); }} min={0} max={20} />
              </div>

              <div>
                <div className="mb-2 font-medium text-gray-800">📝 ملاحظات</div>
                <TextField value={evaluation.notes} onChange={(e) => setEvaluation({ ...evaluation, notes: e.target.value })} placeholder="أضف ملاحظات حول أداء الطالب..." rows={6} multiline fullWidth />
              </div>
            </div>
          </div>
        )}

    {activeTab === 'history' && (
      <div>
        <div className="mb-3 font-medium">سجل التقييمات ({_assessmentsHistory.length})</div>
        {_assessmentsHistory.length === 0 && <div className="text-sm text-gray-500">لا توجد سجلات تقييم.</div>}
        <div className="space-y-2">
          {_assessmentsHistory.map((a, idx) => (
            <div key={a.id || idx} className="p-2 border rounded bg-white">
              <div className="flex justify-between items-center">
                <div className="font-semibold">{a.new_score !== null && a.new_score !== undefined ? `الدرجة: ${a.new_score}` : 'درجة غير متوفرة'}</div>
                <div className="text-xs text-gray-500">{a.date ? new Date(a.date).toLocaleString('ar-EG') : 'تاريخ غير معروف'}</div>
              </div>
              {a.notes && <div className="text-sm text-gray-700 mt-1">{a.notes}</div>}
              {a.scores && <div className="text-xs text-gray-500 mt-1">تفاصيل: {JSON.stringify(a.scores)}</div>}
            </div>
          ))}
        </div>
      </div>
    )}

    {activeTab === 'followups' && (
          <div>
              <div className="flex items-center gap-2 mb-3">
              <Button size="small" variant="contained" color="primary" onClick={() => createQuickFollowup('دفتر')}>دفتر</Button>
              <Button size="small" variant="contained" color="primary" onClick={() => createQuickFollowup('كتاب')}>كتاب</Button>
              <div className="text-sm text-gray-500">{followups.length} متابعات</div>
              <div style={{ marginLeft: 8 }}>
                <Button size="small" color="error" variant="outlined" onClick={deleteAllFollowups} disabled={followupDeletingAll}>
                  {followupDeletingAll ? 'جارٍ الحذف...' : 'حذف الكل'}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {followupLoading && <div className="text-sm text-gray-500">جاري جلب المتابعات...</div>}
              {!followupLoading && followups.length === 0 && <div className="text-sm text-gray-500">لا توجد متابعات</div>}
              {!followupLoading && followups.map((f, idx) => (
                <div key={f.id || idx} className="p-2 border rounded bg-white">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold">{f.type}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500">{f.status}</div>
                      {f.status === 'open' && (
                        <Button size="small" color="error" variant="outlined" onClick={() => closeFollowup(f.id)}>إغلاق</Button>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">{f.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        {/* Debug: show computed payload so user can verify before saving (temporary) */}
  <div className="hidden mt-4 p-2 bg-gray-50 rounded text-sm">
          <div className="mb-1 font-semibold">تصحيح سريع (عرض ما سيُرسل):</div>
          <div>مجموع شرائح (avg/10): {Number(((evaluation.behavior_score + evaluation.participation_score + evaluation.notebook_score + evaluation.attendance_score + evaluation.portfolio_score) / 5).toFixed(2))} / 10</div>
          <div>new_score (0..20): {Number(((((evaluation.behavior_score + evaluation.participation_score + evaluation.notebook_score + evaluation.attendance_score + evaluation.portfolio_score) / 5) * 2)).toFixed(2))}</div>
          <div className="truncate">payload: {JSON.stringify({ new_score: Number(((((evaluation.behavior_score + evaluation.participation_score + evaluation.notebook_score + evaluation.attendance_score + evaluation.portfolio_score) / 5) * 2)).toFixed(2)), scores: {
            behavior_score: evaluation.behavior_score,
            participation_score: evaluation.participation_score,
            notebook_score: evaluation.notebook_score,
            attendance_score: evaluation.attendance_score,
            portfolio_score: evaluation.portfolio_score,
            quran_memorization: evaluation.quran_memorization,
            bonus_points: evaluation.bonus_points
          }, total_xp: evaluation.total_xp, student_level: evaluation.student_level })}</div>
        </div>
            <Box className="flex justify-end gap-3 mt-6">
              <Button variant="outlined" onClick={onClose}>
                إلغاء
              </Button>
              <Button color="error" onClick={resetToZero} variant="outlined">
                إعادة التعيين إلى 0
              </Button>
              <Button 
                color="success" 
                onClick={handleSave}
                disabled={saving}
                variant="contained"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ التقييم'}
              </Button>
            </Box>
            {lastAssessmentDate && (
              <div className="mt-2 text-xs text-gray-500">يسمح حتى تاريخ آخر تقييم: {new Date(lastAssessmentDate).toLocaleString('ar-EG')}</div>
            )}
          </Box>
        </Paper>
      </div>

      {/* Fixed 5x8 student grid on the right to avoid scrolling; shows up to 40 slots (5 columns x 8 rows) */}
      <div
        style={{
          width: collapsed ? 0 : 380,
          transition: 'width 260ms ease',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-start',
        }}
        aria-hidden={collapsed}
      >
        <div style={{ width: '100%', paddingLeft: collapsed ? 0 : 12 }}>
          <div style={{ paddingBottom: 8, paddingTop: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textAlign: 'right', paddingRight: 6 }}>أرقام التلاميذ في القسم</Typography>
          </div>
          <div
            className="grid grid-cols-5 gap-3"
            style={{
              width: '100%',
              opacity: collapsed ? 0 : 1,
              transition: 'opacity 200ms ease 80ms',
              pointerEvents: collapsed ? 'none' : 'auto',
            }}
          >
            {(() => {
              // build an array of 40 slots
              const slots = new Array(40).fill(null).map((_, idx) => {
                const student = Array.isArray(sectionStudents) ? sectionStudents[idx] : undefined;
                // Prefer the classOrder (رقم الطالب في القسم) which is what teachers expect to see
                const display = student ? (student.classOrder ?? student.number ?? student.id ?? (idx + 1)) : '';
                const isEmpty = !student;
                const isCurrent = Boolean(student && String(studentId) === String(student.id));
                const baseClasses = 'p-2 rounded border text-sm flex items-center justify-center';
                const hasFollowup = Boolean(student && _studentsWithFollowups[String(student.id)]);
                // priority: current selection > hasFollowup > empty > normal
                const stateClasses = isCurrent ? 'bg-blue-600 text-white font-semibold' : (hasFollowup ? 'bg-yellow-100 text-yellow-800 border-yellow-300 font-semibold' : (isEmpty ? 'bg-gray-50 text-gray-400 border-dashed' : 'bg-white text-gray-900 font-medium'));
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { if (student && onSwitchStudent) onSwitchStudent(student.id); }}
                    className={`${baseClasses} ${stateClasses}`}
                    title={student ? `${student.classOrder ?? ''} ${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() : ''}
                    aria-label={student ? `Student ${display}` : `Empty slot ${idx + 1}`}
                    disabled={isEmpty}
                    style={{ height: 44, fontSize: 14, minWidth: 0 }}
                  >
                    {display}
                  </button>
                );
              });
              return slots;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickEvaluation;