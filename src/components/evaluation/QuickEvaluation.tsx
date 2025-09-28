import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { Card, CardBody, Typography, Button, Textarea } from "@material-tailwind/react";
import StudentQuickList from '../students/StudentQuickList';

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

function QuickEvaluation({ studentId, studentName, onClose, onSave, sectionStudents = [], onSwitchStudent }: QuickEvaluationProps) {
  const [evaluation, setEvaluation] = useState<EvaluationData>({
    // Default all editable evaluation elements to 0. Attendance is shown as automatic.
    behavior_score: 0,
    participation_score: 0,
    notebook_score: 0,
    attendance_score: 0, // attendance is automatic in the system; start at 0
    portfolio_score: 0,
    quran_memorization: 0,
    bonus_points: 0,
    notes: '',
    total_xp: 0,
    student_level: 1
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastAssessmentDate, setLastAssessmentDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'evaluation' | 'followups'>('evaluation');
  const [followups, setFollowups] = useState<any[]>([]);
  const [followupLoading, setFollowupLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [collapsed, setCollapsed] = useState(false);

  // جلب التقييم الحالي
  useEffect(() => {
    const fetchEvaluation = async () => {
      setLoading(true);
      try {
        // backend exposes assessments under /api/students/:studentId/assessments
        const response = await fetch(`http://localhost:3000/api/students/${studentId}/assessments`);
        if (response.ok) {
          const data = await response.json();
          // data is an array of assessment entries; use the latest if present
          if (Array.isArray(data) && data.length > 0) {
            const latest = data[0];
            setLastAssessmentDate(latest.date ?? null);
            // Try to populate evaluation fields from the saved assessment.
            // Backend may return different shapes; support common names.
            const savedNotes = latest.notes ?? latest.note ?? '';
            const savedScore = latest.new_score ?? latest.score ?? latest.value ?? null;

            // If backend returned a detailed `scores` object, use it.
            let populated: Partial<EvaluationData> = { notes: savedNotes || evaluation.notes };
            let scoresObj: any = null;
            if (latest.scores) {
              if (typeof latest.scores === 'string') {
                try { scoresObj = JSON.parse(latest.scores); } catch (e) { scoresObj = null; }
              } else if (typeof latest.scores === 'object') {
                scoresObj = latest.scores;
              }
            }

            if (scoresObj && typeof scoresObj === 'object') {
              populated = {
                ...populated,
                // use 0 as the fallback so sliders default to 0 (preserve explicit 0 values)
                behavior_score: Number(scoresObj.behavior_score ?? populated.behavior_score ?? 0),
                participation_score: Number(scoresObj.participation_score ?? populated.participation_score ?? 0),
                notebook_score: Number(scoresObj.notebook_score ?? populated.notebook_score ?? 0),
                attendance_score: Number(scoresObj.attendance_score ?? populated.attendance_score ?? 0),
                portfolio_score: Number(scoresObj.portfolio_score ?? populated.portfolio_score ?? 0),
                quran_memorization: Number(scoresObj.quran_memorization ?? populated.quran_memorization ?? 0),
                bonus_points: Number(scoresObj.bonus_points ?? populated.bonus_points ?? 0),
              };
            } else if (typeof savedScore === 'number') {
              // savedScore is 0..20 (we send new_score as 0..20). Convert back to per-element sliders by
              // computing the slider average (0..10) and distributing it equally to the five sliders.
              const sliderAverage = Number((savedScore / 2).toFixed(2));
              populated = {
                ...populated,
                behavior_score: sliderAverage,
                participation_score: sliderAverage,
                notebook_score: sliderAverage,
                attendance_score: sliderAverage,
                portfolio_score: sliderAverage,
                // If backend returned xp/level, use them; otherwise recalc below
                total_xp: typeof latest.total_xp === 'number' ? latest.total_xp : undefined,
                student_level: typeof latest.student_level === 'number' ? latest.student_level : undefined,
              } as Partial<EvaluationData>;
            }

            // Recalculate XP/level based on populated values if not provided by backend
            const merged = { ...evaluation, ...populated } as EvaluationData;
            const { total_xp, student_level } = calculateXPAndLevel(merged);

            setEvaluation(prev => ({ ...prev, ...populated, total_xp, student_level } as EvaluationData));
            // end populate
          }
        }
      } catch (error) {
        console.error('خطأ في جلب التقييم:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
    // also fetch followups when opening for this student
    const fetchFollowups = async () => {
      setFollowupLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/api/students/${studentId}/followups`);
        if (res.ok) {
          const data = await res.json();
          setFollowups(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error('Error fetching followups', e);
      } finally {
        setFollowupLoading(false);
      }
    };

    fetchFollowups();
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
  const updateScore = (field: keyof EvaluationData, value: number) => {
    const newEvaluation = { ...evaluation, [field]: value };
    const { total_xp, student_level } = calculateXPAndLevel(newEvaluation);
    
    setEvaluation({
      ...newEvaluation,
      total_xp,
      student_level
    });
  };

  // Helper to normalize slider onChange callbacks from different component implementations.
  // Some sliders call onChange(value), others call onChange(event, value).
  const handleSliderChange = (field: keyof EvaluationData, ...args: any[]) => {
    let raw: any = undefined;
    if (args.length === 1) raw = args[0];
    else if (args.length >= 2) raw = args[1];

    // If first arg was the event, try to pull value from event.target
    if (raw && typeof raw === 'object' && 'target' in raw) raw = raw.target.value;

    const num = Number(raw ?? 0);
    // Debug log to diagnose slider thumb positioning issues (use console.log so it's visible by default)
    try { console.log('[QuickEvaluation] handleSliderChange', { field, raw, num }); } catch (e) {}
    updateScore(field, Number.isNaN(num) ? 0 : num);
  };

  // Debug: log evaluation state whenever it changes to verify values (open browser DevTools Console)
  // Remove or disable this in production if noisy.
  useEffect(() => {
    try { console.log('[QuickEvaluation] evaluation state', evaluation); } catch (e) {}
  }, [evaluation]);

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
        // If backend returned the saved scores, update local evaluation state so reopening shows exact values
        if (saved && saved.scores) {
          let s = saved.scores;
          if (typeof s === 'string') {
            try { s = JSON.parse(s); } catch (e) { s = null; }
          }
          if (s && typeof s === 'object') {
          const merged = {
            ...evaluation,
            behavior_score: Number(s.behavior_score ?? evaluation.behavior_score),
            participation_score: Number(s.participation_score ?? evaluation.participation_score),
            notebook_score: Number(s.notebook_score ?? evaluation.notebook_score),
            attendance_score: Number(s.attendance_score ?? evaluation.attendance_score),
            portfolio_score: Number(s.portfolio_score ?? evaluation.portfolio_score),
            quran_memorization: Number(s.quran_memorization ?? evaluation.quran_memorization),
            bonus_points: Number(s.bonus_points ?? evaluation.bonus_points),
            notes: saved.notes ?? evaluation.notes,
            total_xp: typeof saved.total_xp === 'number' ? saved.total_xp : evaluation.total_xp,
            student_level: typeof saved.student_level === 'number' ? saved.student_level : evaluation.student_level,
          } as EvaluationData;
          setEvaluation(merged);
          }
        }
  try { onSave?.(saved); } catch (e) { console.error('Error in onSave callback', e); }
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
    // Ask for confirmation because this will clear persisted assessments
  const ok = window.confirm('هل أنت متأكد؟ سيؤدي هذا إلى حذف جميع سجلات التقييم لهذا الطالب وإعادة تعيين نقاط الخبرة والتاريخ. هذا الإجراء لا يمكن التراجع عنه.');
  if (!ok) return;

    (async () => {
      try {
  const url = `http://localhost:3000/api/students/${studentId}/assessments/reset`;
  console.log('[QuickEvaluation] Resetting assessments via POST at', url);
  const resp = await fetch(url, { method: 'POST' });
        const text = await resp.text().catch(() => '');
        let body = {};
        try { body = text ? JSON.parse(text) : {}; } catch (e) { body = { rawText: text }; }
        if (!resp.ok) {
          console.error('[QuickEvaluation] delete response not ok', resp.status, resp.statusText, body);
          enqueueSnackbar(`فشل في حذف سجلات التقييم: ${resp.status} ${resp.statusText}`, { variant: 'error' });
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
        // notify parent to refresh lists
        try { onSave?.({ deleted: true, deletedCount: body.deletedCount ?? 0 }); } catch (e) { console.error('onSave threw', e); }
      } catch (error) {
        // Provide richer error info for debugging
        console.error('Error resetting assessments:', error && (error.message || error));
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
        // prepend to local list
        setFollowups(prev => [created || { type, description: '', status: 'open' }, ...prev]);
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
        const updated = await resp.json().catch(() => null);
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
    <div className="flex gap-4 w-full max-w-4xl mx-auto">
      <div className="flex-1">
        <Card className="w-full">
          <CardBody className="p-6">
            {/* Header: left = title/name, right = controls + level/xp */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-2xl font-extrabold text-blue-800 mb-1">تقييم سريع</div>
                <div className="text-sm text-gray-500">{studentName}</div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outlined" onClick={() => {
                    if (!sectionStudents || !sectionStudents.length) return;
                    const idx = sectionStudents.findIndex(s => String(s.id) === String(studentId));
                    const prev = sectionStudents[(idx > 0 ? idx - 1 : sectionStudents.length - 1)];
                    if (prev && onSwitchStudent) onSwitchStudent(prev.id);
                  }}>السابق</Button>
                  <Button size="sm" variant="outlined" onClick={() => {
                    if (!sectionStudents || !sectionStudents.length) return;
                    const idx = sectionStudents.findIndex(s => String(s.id) === String(studentId));
                    const next = sectionStudents[(idx === -1 ? 0 : (idx + 1) % sectionStudents.length)];
                    if (next && onSwitchStudent) onSwitchStudent(next.id);
                  }}>التالي</Button>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }} className={LEVEL_COLORS[evaluation.student_level]}>{LEVEL_NAMES[evaluation.student_level]}</div>
                  <div className="text-sm text-gray-600">المستوى {evaluation.student_level} • 💎 {evaluation.total_xp} XP</div>
                </div>

                <div>
                  <Button size="sm" variant="text" onClick={() => setCollapsed(c => !c)}>{collapsed ? 'إظهار الأرقام' : 'إخفاء الأرقام'}</Button>
                  <Button size="sm" color="red" variant="outlined" onClick={onClose} className="ml-1">إغلاق</Button>
                </div>
              </div>
            </div>

        {/* Tabs */}
        <div className="mb-4">
          <div className="flex gap-2">
            <button className={`px-3 py-1 rounded ${activeTab === 'evaluation' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`} onClick={() => setActiveTab('evaluation')}>تقييم</button>
            <button className={`px-3 py-1 rounded ${activeTab === 'followups' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`} onClick={() => setActiveTab('followups')}>متابعة</button>
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'evaluation' && (
          <div className="flex flex-col gap-6">
            {/* Sliders and inputs laid out vertically to show everything without scrolling */}

            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <Typography color="blue-gray">😊 السلوك</Typography>
                <div className="text-sm text-gray-700">{evaluation.behavior_score.toFixed(1)}/10</div>
              </div>
              <input type="range" min={0} max={10} step={0.1} value={Number(evaluation.behavior_score ?? 0)} onChange={(e) => handleSliderChange('behavior_score', e.target.value)} className="w-full" />
              <div className="text-sm text-gray-600">{getBehaviorText(evaluation.behavior_score)}</div>
            </div>

            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <Typography color="blue-gray">🗣️ المشاركة</Typography>
                <div className="text-sm text-gray-700">{evaluation.participation_score.toFixed(1)}/10</div>
              </div>
              <input type="range" min={0} max={10} step={0.1} value={Number(evaluation.participation_score ?? 0)} onChange={(e) => handleSliderChange('participation_score', e.target.value)} className="w-full" />
            </div>

            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <Typography color="blue-gray">📝 الدفتر</Typography>
                <div className="text-sm text-gray-700">{evaluation.notebook_score.toFixed(1)}/10</div>
              </div>
              <input type="range" min={0} max={10} step={0.1} value={Number(evaluation.notebook_score ?? 0)} onChange={(e) => handleSliderChange('notebook_score', e.target.value)} className="w-full" />
            </div>

            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <Typography color="blue-gray">🎯 البورتفوليو</Typography>
                <div className="text-sm text-gray-700">{evaluation.portfolio_score.toFixed(1)}/10</div>
              </div>
              <input type="range" min={0} max={10} step={0.1} value={Number(evaluation.portfolio_score ?? 0)} onChange={(e) => handleSliderChange('portfolio_score', e.target.value)} className="w-full" />
            </div>

            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <Typography color="blue-gray">📅 الحضور</Typography>
                <div className="text-sm text-gray-700">{evaluation.attendance_score.toFixed(1)}/10</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(evaluation.attendance_score / 10) * 100}%` }} /></div>
            </div>

            <div className="mb-3">
              <div className="mb-2 font-medium text-gray-800">📿 حفظ القرآن</div>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[{ value: 0, label: "لم يحفظ", reward: "0 XP" }, { value: 5, label: "جزئي", reward: "+50 XP" }, { value: 10, label: "كامل", reward: "+100 XP" }, { value: 15, label: "متقن", reward: "+150 XP" }].map((option) => (
                  <Button key={option.value} size="sm" variant={evaluation.quran_memorization === option.value ? "filled" : "outlined"} color={evaluation.quran_memorization === option.value ? "green" : "gray"} onClick={() => updateScore('quran_memorization', option.value)} className="text-xs p-2">
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
              <Textarea value={evaluation.notes} onChange={(e) => setEvaluation({ ...evaluation, notes: e.target.value })} placeholder="أضف ملاحظات حول أداء الطالب..." rows={4} />
            </div>
          </div>
        )}

    {activeTab === 'followups' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Button size="sm" color="blue" onClick={() => createQuickFollowup('دفتر')}>دفتر</Button>
              <Button size="sm" color="blue" onClick={() => createQuickFollowup('كتاب')}>كتاب</Button>
              <div className="text-sm text-gray-500">{followups.length} متابعات</div>
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
                        <Button size="sm" color="red" variant="outlined" onClick={() => closeFollowup(f.id)}>إغلاق</Button>
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
        <div className="mt-4 p-2 bg-gray-50 rounded text-sm">
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
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outlined" onClick={onClose}>
            إلغاء
          </Button>
          <Button color="red" onClick={resetToZero} variant="outlined">
            إعادة التعيين إلى 0
          </Button>
          <Button 
            color="green" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التقييم'}
          </Button>
        </div>
            {lastAssessmentDate && (
              <div className="mt-2 text-xs text-gray-500">يسمح حتى تاريخ آخر تقييم: {new Date(lastAssessmentDate).toLocaleString('ar-EG')}</div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Quick list shown while the modal is open */}
      {!collapsed && (
        <div style={{ width: 220 }}>
          <StudentQuickList students={sectionStudents} currentStudentId={studentId} onSelectStudent={(id) => {
            if (onSwitchStudent) onSwitchStudent(id);
          }} />
        </div>
      )}
    </div>
  );
}

export default QuickEvaluation;