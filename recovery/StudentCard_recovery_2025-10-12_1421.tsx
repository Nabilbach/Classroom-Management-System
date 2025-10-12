import React, { useState, useEffect, useRef } from 'react';
import { Tooltip, IconButton } from "@material-tailwind/react";
import { FaStar, FaChartLine, FaEdit, FaTrash, FaInfoCircle, FaClipboard, FaBook, FaTasks, FaSmile, FaMedal } from 'react-icons/fa';
import { Student } from '../../types/student';

interface StudentCardProps {
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (studentId: number) => void;
  onDetail: (student: Student) => void;
  onAssess: (student: Student) => void;
}

// Helper function to calculate level-based XP
const getLevelInfo = (totalXp: number) => {
  const xpForNextLevel = 150; // Each level requires 150 XP
  const level = Math.floor(totalXp / xpForNextLevel);
  const xpInCurrentLevel = totalXp % xpForNextLevel;
  const progressPercentage = (xpInCurrentLevel / xpForNextLevel) * 100;
  return {
    level: level + 1, // Start from level 1
    xpInCurrentLevel,
    xpForNextLevel,
    progressPercentage,
  };
};

const StatCard = ({ icon, value, label, animate }: { icon: React.ReactNode, value: string | number, label: string, animate?: boolean }) => (
  <div className="flex flex-col items-center justify-center bg-gray-50 p-3 rounded-lg border border-gray-200">
    <div className="text-amber-600 mb-1">{icon}</div>
    <div className={`text-lg font-bold text-gray-800 transition-transform duration-300 ${animate ? 'transform scale-105 text-amber-600' : ''}`}>{value}</div>
    <div className="text-xs text-gray-500">{label}</div>
  </div>
);

// Level badge gradients (match evaluation visuals)
const LEVEL_GRADIENTS: Record<number, string> = {
  1: 'linear-gradient(135deg, #78909C 0%, #546E7A 100%)',
  2: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
  3: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
  4: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
  5: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
};

const LevelBadge = ({ level }: { level: number }) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <div style={{
      width: 48,
      height: 56,
      borderRadius: 10,
      background: LEVEL_GRADIENTS[level] || LEVEL_GRADIENTS[1],
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      boxShadow: '0 6px 18px rgba(0,0,0,0.12)'
    }}>
      <FaMedal style={{ fontSize: 18 }} />
      <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>{level}</div>
    </div>
  </div>
);

const LEVEL_NAMES: Record<number, string> = {
  1: 'المبتدئ',
  2: 'الناشط',
  3: 'المتميز',
  4: 'المتفوق',
  5: 'الخبير',
};

// Animated counter hook (uses previous target as start)
function useCount(target: number, duration = 700) {
  const prev = useRef<number>(target);
  const [val, setVal] = useState<number>(target);

  useEffect(() => {
    const from = prev.current ?? 0;
    const change = target - from;
    prev.current = target;
    if (change === 0) {
      setVal(target);
      return;
    }
    const start = performance.now();
    let rafId = 0;
    const step = (ts: number) => {
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - (1 - t) * (1 - t); // easeOutQuad
      setVal(Math.round(from + change * eased));
      if (t < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, [target, duration]);

  return val;
}

const StudentCard = ({ student, onEdit, onDelete, onDetail, onAssess }: StudentCardProps) => {
  const totalXp = Math.round(student.total_xp ?? 0);
  const { level, xpInCurrentLevel, xpForNextLevel, progressPercentage } = getLevelInfo(totalXp);

  // رقم التلميذ في القسم
  const studentNumber = student.classOrder ?? student.studentNumberInSection ?? '—';

  // ربط عناصر التقييم الفعلية من آخر تقييم
  const [latestAssessment, setLatestAssessment] = useState<any | null>(null);
  // إذا لم تُرجع واجهة /students التقييمات، فنجلب آخر تقييم عبر endpoint خاص
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const fetchLatest = async () => {
      try {
        if (student.assessments && student.assessments.length > 0) {
          console.log('🔍 Student already has assessments:', student.id, student.assessments);
          return; // already present
        }
        console.log('🔍 Fetching assessments for student:', student.id);
        const res = await fetch(`http://localhost:3000/api/students/${student.id}/assessments`, { signal: controller.signal });
        if (!res.ok) {
          console.log('❌ Failed to fetch assessments:', res.status);
          return;
        }
        const arr = await res.json();
        console.log('✅ Assessments received:', arr);
        if (!mounted) return;
        if (Array.isArray(arr) && arr.length > 0) {
          // API returns assessments ordered desc (server-side), take first
          console.log('📊 Latest assessment:', arr[0]);
          setLatestAssessment(arr[0]);
        } else {
          console.log('⚠️ No assessments found for student:', student.id);
        }
      } catch (e) {
        console.log('❌ Error fetching assessments:', e);
        // ignore abort or fetch errors
      }
    };
    fetchLatest();
    return () => { mounted = false; controller.abort(); };
  }, [student.id, student.assessments]);

  let attendancePoints = '—', notebookPoints = '—', homeworkPoints = '—', behaviorPoints = '—';
  let lastScore = 'N/A';
  const latest = (student.assessments && student.assessments.length > 0) ? student.assessments[student.assessments.length - 1] : latestAssessment;
  
  if (latest && latest.scores) {
    // Extract scores using actual database field names (with _score suffix)
    const att = latest.scores.attendance_score ?? latest.scores.attendance ?? latest.scores.presence ?? latest.scores['حضور'];
    attendancePoints = (att !== undefined && att !== null && att !== '') ? String(att) : '—';
    
    const nb = latest.scores.notebook_score ?? latest.scores.notebook ?? latest.scores['دفتر'];
    notebookPoints = (nb !== undefined && nb !== null && nb !== '') ? String(nb) : '—';
    
    // portfolio_score is used for homework/assignments in QuickEvaluation
    const hw = latest.scores.portfolio_score ?? latest.scores.homework_score ?? latest.scores.homework ?? latest.scores['واجب'] ?? latest.scores.assignments;
    homeworkPoints = (hw !== undefined && hw !== null && hw !== '') ? String(hw) : '—';
    
    const bh = latest.scores.behavior_score ?? latest.scores.behavior ?? latest.scores['سلوك'];
    behaviorPoints = (bh !== undefined && bh !== null && bh !== '') ? String(bh) : '—';
    
    lastScore = typeof latest.new_score !== 'undefined' ? `${latest.new_score}%` : (typeof latest.score !== 'undefined' ? `${latest.score}%` : (student.score !== undefined ? `${student.score}%` : 'N/A'));
  } else {
    lastScore = student.score !== undefined ? `${student.score}%` : 'N/A';
  }

  const animatedTotalXp = useCount(totalXp, 1000);

  // pulse effect for progress bar when progressPercentage changes (used only in modal)
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 650);
    return () => clearTimeout(t);
  }, [progressPercentage]);

  // menu/modal/print state
  const [menuOpen, setMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const printCard = () => {
    const html = cardRef.current?.innerHTML || '';
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>طباعة البطاقة</title><style>body{font-family: Arial, Helvetica, sans-serif;direction: rtl;padding:20px;background:#fff}.card{max-width:520px;margin:0 auto}</style></head><body><div class="card">${html}</div></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { try { win.print(); win.close(); } catch (e) {} }, 300);
  };

  return (
    <div className="relative">
      {/* three-dots menu top-left */}
      <div className="absolute left-3 top-3 z-20">
        <div className="relative">
          <button onClick={() => setMenuOpen(o => !o)} className="px-2 py-1 rounded-md hover:bg-gray-100" aria-label="خيارات البطاقة">⋮</button>
          {menuOpen && (
            <div className="absolute left-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg text-right">
              <button className="w-full text-sm px-3 py-2 hover:bg-gray-50" onClick={() => { setShowModal(true); setMenuOpen(false); }}>عرض البطاقة</button>
              <button className="w-full text-sm px-3 py-2 hover:bg-gray-50" onClick={() => { printCard(); setMenuOpen(false); }}>طباعة البطاقة</button>
            </div>
          )}
        </div>
      </div>

  <div ref={cardRef} className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200 text-gray-800 flex flex-col h-full" dir="rtl">
      
      {/* Header: Name, Level, Badge and Number */}
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 flex-shrink-0">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg font-bold border-2 border-gray-200">
            {studentNumber}
          </div>
        </div>
        <div className="flex-1 text-center">
          <h3 className="text-xl font-bold">{(student.firstName ?? '') + ' ' + (student.lastName ?? '')}</h3>
          {student.badge && (
            <div className="inline-block mt-2 text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">{student.badge}</div>
          )}
          <div className="flex items-center justify-center mt-3">
            <LevelBadge level={level} />
          </div>
          <div className="mt-2 text-sm font-semibold text-amber-600">{LEVEL_NAMES[level] ?? `المستوى ${level}`}</div>
        </div>
        <div className="w-10" />
      </div>

      {/* XP Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
          <span>نقاط الخبرة</span>
          <span>{xpInCurrentLevel} / {xpForNextLevel}</span>
        </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
  <StatCard icon={<FaStar size={20} />} value={animatedTotalXp} label="إجمالي XP" animate />
        <StatCard icon={<FaChartLine size={20} />} value={lastScore} label="آخر تقييم" />
      </div>

      {/* Quick Skills Row (attendance points, notebook, homework, behavior) */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200 text-sm">
          <FaClipboard className="text-amber-500" />
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{attendancePoints}</span>
            <span className="text-xs text-gray-500">نقاط الحضور</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200 text-sm">
          <FaBook className="text-amber-500" />
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{notebookPoints}</span>
            <span className="text-xs text-gray-500">نقاط الدفتر</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200 text-sm">
          <FaTasks className="text-amber-500" />
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{homeworkPoints}</span>
            <span className="text-xs text-gray-500">الواجبات</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200 text-sm">
          <FaSmile className="text-amber-500" />
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{behaviorPoints}</span>
            <span className="text-xs text-gray-500">السلوك</span>
          </div>
        </div>
      </div>

  {/* Footer: Action Buttons */}
      <div className="mt-auto pt-3 border-t border-gray-200 flex justify-around items-center">
        <Tooltip content="تقييم" placement="top" className="bg-white text-gray-700 border border-gray-200 shadow-lg">
          <IconButton variant="text" onClick={() => onAssess(student)} className="text-yellow-600 hover:bg-yellow-100">
            <FaStar size={20} />
          </IconButton>
        </Tooltip>
        <Tooltip content="تفاصيل" placement="top" className="bg-white text-gray-700 border border-gray-200 shadow-lg">
          <IconButton variant="text" onClick={() => onDetail(student)} className="text-blue-600 hover:bg-blue-100">
            <FaInfoCircle size={20} />
          </IconButton>
        </Tooltip>
        <Tooltip content="تعديل" placement="top" className="bg-white text-gray-700 border border-gray-200 shadow-lg">
          <IconButton variant="text" onClick={() => onEdit(student)} className="text-green-600 hover:bg-green-100">
            <FaEdit size={20} />
          </IconButton>
        </Tooltip>
        <Tooltip content="حذف" placement="top" className="bg-white text-gray-700 border border-gray-200 shadow-lg">
          <IconButton variant="text" onClick={() => onDelete(student.id)} className="text-red-600 hover:bg-red-100">
            <FaTrash size={20} />
          </IconButton>
        </Tooltip>
      </div>
  </div>
  {/* Modal: show isolated card with blur backdrop and rotation animation */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
                <style>{`@keyframes cardEnter { from { transform: rotate(-12deg) scale(0.92); opacity: 0; } to { transform: rotate(0deg) scale(1); opacity: 1; } }`}</style>
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md" style={{ animation: 'cardEnter 700ms cubic-bezier(.2,.9,.3,1)' }}>
                  {/* Modal card content mirrored as JSX so animations (numbers) work */}
                  <div dir="rtl">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg font-bold border-2 border-gray-200">{student.studentNumberInSection ?? 0}</div>
                      </div>
                      <div className="flex-1 text-center">
                        <h3 className="text-xl font-bold">{(student.firstName ?? '') + ' ' + (student.lastName ?? '')}</h3>
                        {student.badge && (<div className="inline-block mt-2 text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">{student.badge}</div>)}
                        <div className="flex items-center justify-center mt-3"><LevelBadge level={level} /></div>
                        <div className="mt-2 text-sm font-semibold text-amber-600">{LEVEL_NAMES[level] ?? `المستوى ${level}`}</div>
                      </div>
                      <div className="w-10" />
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-xs font-medium text-gray-600 mb-1"><span>نقاط الخبرة</span><span>{xpInCurrentLevel} / {xpForNextLevel}</span></div>
                      {/* modalPulse active only when modal open and progress changed */}
                      <div className={`w-full bg-gray-200 rounded-full h-2.5 ${showModal && pulse ? 'scale-105' : ''}`}>
                        <div className={`bg-gradient-to-r from-yellow-400 to-orange-500 h-2.5 rounded-full transition-all duration-500 ${showModal && pulse ? 'shadow-lg' : ''}`} style={{ width: `${progressPercentage}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <StatCard icon={<FaStar size={20} />} value={animatedTotalXp} label="إجمالي XP" animate />
                      <StatCard icon={<FaChartLine size={20} />} value={lastScore} label="آخر تقييم" />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200 text-sm"><FaClipboard className="text-amber-500" /><div className="flex flex-col"><span className="font-semibold text-gray-800">{attendancePoints ?? '—'}</span><span className="text-xs text-gray-500">نقاط الحضور</span></div></div>
                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200 text-sm"><FaBook className="text-amber-500" /><div className="flex flex-col"><span className="font-semibold text-gray-800">{notebookPoints ?? '—'}</span><span className="text-xs text-gray-500">نقاط الدفتر</span></div></div>
                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200 text-sm"><FaTasks className="text-amber-500" /><div className="flex flex-col"><span className="font-semibold text-gray-800">{homeworkPoints ?? '—'}</span><span className="text-xs text-gray-500">الواجبات</span></div></div>
                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200 text-sm"><FaSmile className="text-amber-500" /><div className="flex flex-col"><span className="font-semibold text-gray-800">{behaviorPoints ?? '—'}</span><span className="text-xs text-gray-500">السلوك</span></div></div>
                    </div>
                  </div>
                </div>
            <div className="flex justify-center gap-3 mt-4">
              <button className="px-4 py-2 bg-gray-100 rounded" onClick={() => { printCard(); }}>طباعة</button>
              <button className="px-4 py-2 bg-amber-600 text-white rounded" onClick={() => setShowModal(false)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCard;
