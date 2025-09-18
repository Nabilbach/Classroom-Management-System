import React, { useState, useEffect, useMemo, forwardRef, useCallback } from 'react';
import {
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import { useSections } from '../contexts/SectionsContext';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isSameDay, parseISO, isValid, isWithinInterval, addWeeks } from 'date-fns';
import ar from 'date-fns/locale/ar';
import { useCurriculum } from '../contexts/CurriculumContext';
import { AdaptedLesson, ScheduledLesson, LessonTemplate } from '../types/lessonLogTypes';
import { migrateLessonToAdapted } from '../utils/lessonLogMigrationUtils';
import LessonModal from '../components/LessonModal';
import EditLessonModal from '../components/EditLessonModal';
import { getSessionEndTime } from '../utils/lessonUtils';
import { FaTimes, FaEdit, FaTrash, FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaClock, FaUsers, FaCalendarCheck, FaExclamationCircle, FaForward, FaChartLine } from 'react-icons/fa';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { 
  fetchAdminSchedule, 
  addAdminScheduleEntry, 
  updateAdminScheduleEntry, 
  deleteAdminScheduleEntry 
} from '../services/api/adminScheduleService';

// --- Constants ---
const DAYS = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00",
  "15:00", "16:00", "17:00", "18:00"
];
const TIME_SLOT_DURATION_MINUTES = 60;

// --- Interfaces ---
interface WeeklyScheduleSession {
  id: string;
  day: string;
  startTime: string;
  duration: number;
  sectionId: string;
  sectionName: string;
  subject: string;
  teacher: string;
  classroom: string;
  sessionType: "official" | "extra" | "compensatory";
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: { start: string; end: string };
  type: "holiday" | "meeting" | "exam" | "event";
  description?: string;
  color?: string;
}

// --- Helper Functions ---
const generateId = () => Date.now().toString();
const formatTimeRange = (startTime: string, duration: number) => {
  const endTime = getSessionEndTime(startTime, duration);
  return `${startTime}–${endTime}`;
};

const isSubsequentSlotOfMultiSlotSession = (
  day: string,
  timeSlot: string,
  allSessions: WeeklyScheduleSession[]
): boolean => {
  for (const session of allSessions) {
    if (session.day !== day || session.duration <= 1 || !session.startTime) continue;
    if (session.startTime === timeSlot) continue;

    const referenceDate = '2000-01-01';
    const slotTime = parseISO(`${referenceDate}T${timeSlot}:00`);
    const sessionStart = parseISO(`${referenceDate}T${session.startTime}:00`);
    const sessionEndString = getSessionEndTime(session.startTime, session.duration);
    const sessionEnd = parseISO(`${referenceDate}T${sessionEndString}:00`);

    if (!isValid(slotTime) || !isValid(sessionStart) || !isValid(sessionEnd)) continue;

    return isWithinInterval(slotTime, { start: sessionStart, end: sessionEnd });
  }
  return false;
};

const CustomDateInput = forwardRef<HTMLInputElement, { value?: string; onClick?: () => void }>(({ value, onClick }, ref) => (
  <div dir="ltr">
    <TextField
      label="التاريخ"
      value={value}
      onClick={onClick}
      inputRef={ref}
      readOnly
      fullWidth
    />
  </div>
));

// --- Stat Card Component ---
const StatCard = ({ title, value, icon, details }: { title: string, value: string, icon: any, details?: string }) => {
  const Icon = icon;
  return (
    <Card className="shadow-md border border-blue-gray-50">
      <CardContent className="flex items-start gap-4 p-4">
        <div className="p-3 rounded-full bg-blue-gray-50 text-blue-gray-600">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <Typography variant="small" color="blue-gray" className="font-semibold">{title}</Typography>
          <Typography variant="h5" color="blue-gray" className="font-bold">{value}</Typography>
          {details && <Typography variant="small" className="text-gray-600">{details}</Typography>}
        </div>
      </CardContent>
    </Card>
  );
};

// --- Main Schedule Component ---
function Schedule() {
  const { sections: availableSections } = useSections();
  const { scheduledLessons, lessonTemplates } = useCurriculum();

  // --- State Definitions (Must be at the top) ---
  const [weeklyScheduleTemplate, setWeeklyScheduleTemplate] = useState<WeeklyScheduleSession[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<WeeklyScheduleSession | null>(null);
  const [currentDay, setCurrentDay] = useState('');
  const [currentTimeSlot, setCurrentTimeSlot] = useState('');

  const [newSessionSectionId, setNewSessionSectionId] = useState('');
  const [newSessionSubject, setNewSessionSubject] = useState('التربية الإسلامية');
  const [newSessionTeacher, setNewSessionTeacher] = useState('بشيري نبيل');
  const [newSessionClassroom, setNewSessionClassroom] = useState('');
  const [newSessionDuration, setNewSessionDuration] = useState(1);
  const [newSessionType, setNewSessionType] = useState<"official" | "extra" | "compensatory">('official');

  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [sessionToModify, setSessionToModify] = useState<WeeklyScheduleSession | null>(null);

  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [selectedSessionInstance, setSelectedSessionInstance] = useState<WeeklyScheduleSession | null>(null);
  const [absenceReason, setAbsenceReason] = useState('');
  const [isCollectiveAbsence, setIsCollectiveAbsence] = useState(false);
  const [absenceDate, setAbsenceDate] = useState('');

  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);
  const [newEventStartTime, setNewEventStartTime] = useState('');
  const [newEventEndTime, setNewEventEndTime] = useState('');
  const [newEventIsAllDay, setNewEventIsAllDay] = useState(false);
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventColor, setNewEventColor] = useState('#8884d8');
  const [newEventType, setNewEventType] = useState<"holiday" | "meeting" | "exam" | "event">('event');

  const [isEventDetailsModalOpen, setIsEventDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const [isEditLessonModalOpen, setIsEditLessonModalOpen] = useState(false);
  const [selectedLessonForEdit, setSelectedLessonForEdit] = useState<AdaptedLesson | null>(null);

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('calendarEvents');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Missing Function Definition ---
  const handleSaveEditedLesson = (updatedLesson: AdaptedLesson) => {
    // يمكنك هنا إرسال التحديث إلى الخادم
    // أو تحديث الحالة المحلية
    console.log('تم حفظ الحصة المعدلة:', updatedLesson);
    setIsEditLessonModalOpen(false);
    setSelectedLessonForEdit(null);
  };

  const handleEditSession = (session: WeeklyScheduleSession) => {
    // For now, we'll convert the WeeklyScheduleSession to an AdaptedLesson for editing
    // This might need more sophisticated mapping depending on AdaptedLesson structure
    const adaptedLesson: AdaptedLesson = {
      id: session.id,
      title: session.subject, // Assuming subject can be title
      description: '', // No description in WeeklyScheduleSession
      templateId: '', // No templateId in WeeklyScheduleSession
      sections: [session.sectionId], // Assuming one section
      duration: session.duration,
      // Add other fields as necessary for AdaptedLesson
    };
    setSelectedLessonForEdit(adaptedLesson);
    setIsEditLessonModalOpen(true);
    setIsOptionsModalOpen(false); // Close options modal
  };

  const handleOpenEditModal = (session: WeeklyScheduleSession) => {
    setEditingSession(session);
    setCurrentDay(session.day);
    setCurrentTimeSlot(session.startTime);
    setNewSessionSectionId(session.sectionId);
    setNewSessionClassroom(session.classroom);
    setNewSessionDuration(session.duration);
    setNewSessionType(session.sessionType);
    setNewSessionSubject('التربية الإسلامية');
    setNewSessionTeacher('بشيري نبيل');

    setIsOptionsModalOpen(false);
    setIsAddEditModalOpen(true);
  };

  // --- Reset Form Function ---
  const resetAddEditForm = () => {
    setEditingSession(null);
    setNewSessionSectionId('');
    setNewSessionSubject('التربية الإسلامية');
    setNewSessionTeacher('بشيري نبيل');
    setNewSessionClassroom('');
    setNewSessionDuration(1);
    setNewSessionType('official');
  };

  // --- Handle Cell Click ---
  const handleCellClick = (day: string, timeSlot: string) => {
    const session = weeklyScheduleTemplate.find(s => s.day === day && s.startTime === timeSlot);
    if (session) {
      setSessionToModify(session);
      setIsOptionsModalOpen(true);
    } else {
      resetAddEditForm();
      setCurrentDay(day);
      setCurrentTimeSlot(timeSlot);
      setIsAddEditModalOpen(true);
    }
  };

  // --- Load Schedule ---
  const loadSchedule = useCallback(async () => {
    try {
      const entries = await fetchAdminSchedule();
      if (!Array.isArray(entries)) return setWeeklyScheduleTemplate([]);

      const validEntries = entries.filter(
        entry =>
          entry.startTime &&
          entry.day &&
          entry.sectionId &&
          availableSections.some(s => s.id === entry.sectionId)
      );

      const schedule = validEntries.map(entry => {
        const section = availableSections.find(s => s.id === entry.sectionId);
        return {
          id: entry.id || generateId(),
          day: entry.day,
          startTime: entry.startTime,
          duration: entry.duration || 1,
          sectionId: entry.sectionId,
          sectionName: section?.name || '',
          subject: 'حصة دراسية',
          teacher: '',
          classroom: entry.classroom || '',
          sessionType: entry.sessionType || 'official',
        };
      });

      setWeeklyScheduleTemplate(schedule);
    } catch (error) {
      console.error('فشل تحميل الجدول:', error);
      setWeeklyScheduleTemplate([]);
    }
  }, [availableSections]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // --- Handle Clear All Schedule ---
  const handleClearAllSchedule = async () => {
    if (!window.confirm('هل أنت متأكد أنك تريد حذف الجدول بأكمله؟')) return;

    await Promise.all(
      weeklyScheduleTemplate.map(async (session) => {
        try {
          await deleteAdminScheduleEntry(session.id);
        } catch (error) {
          console.error(`فشل حذف الحصة ${session.id}:`, error);
        }
      })
    );

    setWeeklyScheduleTemplate([]);
    setCalendarEvents([]);
    localStorage.removeItem('calendarEvents');
    alert('تم حذف الجدول بالكامل.');
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('هل أنت متأكد أنك تريد حذف هذه الحصة؟')) return;

    try {
      await deleteAdminScheduleEntry(sessionId);
      await loadSchedule(); // Reload the schedule to reflect the deletion
      setIsOptionsModalOpen(false); // Close the options modal
      setSessionToModify(null); // Clear the selected session
    } catch (error) {
      console.error(`فشل حذف الحصة ${sessionId}:`, error);
      alert('فشل حذف الحصة.');
    }
  };

  // --- Add/Edit Session ---
  const handleAddEditSessionSubmit = async () => {
    const section = availableSections.find(s => s.id === newSessionSectionId);
    if (!section) {
      alert('الرجاء تحديد قسم صحيح.');
      return;
    }

    const entryData = {
      id: editingSession ? editingSession.id : generateId(),
      day: currentDay,
      startTime: currentTimeSlot,
      duration: newSessionDuration,
      sectionId: newSessionSectionId,
      classroom: newSessionClassroom,
      sessionType: newSessionType,
    };

    try {
      if (editingSession) {
        await updateAdminScheduleEntry(editingSession.id, entryData);
      } else {
        await addAdminScheduleEntry(entryData);
      }
      await loadSchedule();
      setIsAddEditModalOpen(false);
      resetAddEditForm();
    } catch (error) {
      console.error('فشل في حفظ الحصة:', error);
    }
  };

  // --- Absence Handling ---
  const handleAbsenceClick = (session: WeeklyScheduleSession) => {
    setSelectedSessionInstance(session);
    setAbsenceDate(format(new Date(), 'yyyy-MM-dd'));
    setIsOptionsModalOpen(false);
    setIsAbsenceModalOpen(true);
  };

  const handleAbsenceSubmit = () => {
    if (!selectedSessionInstance || !absenceDate) return;
    const newAbsence = {
      id: generateId(),
      sessionId: selectedSessionInstance.id,
      date: absenceDate,
      isAbsent: true,
      reason: absenceReason,
      isCollective: isCollectiveAbsence,
      timestamp: Date.now(),
    };
    // يمكنك تخزين الغياب في حالة أو API لاحقًا
    setIsAbsenceModalOpen(false);
    setSelectedSessionInstance(null);
    setAbsenceReason('');
    setIsCollectiveAbsence(false);
    setAbsenceDate('');
  };

  // --- Event Handling ---
  const handleAddEventSubmit = () => {
    if (!newEventTitle || !newEventDate || (!newEventIsAllDay && (!newEventStartTime || !newEventEndTime))) {
      alert('الرجاء ملء جميع الحقول الإلزامية للحدث.');
      return;
    }
    const newEvent: CalendarEvent = {
      id: generateId().toString(),
      title: newEventTitle,
      date: format(newEventDate!, 'yyyy-MM-dd'),
      time: newEventIsAllDay ? undefined : { start: newEventStartTime, end: newEventEndTime },
      type: newEventType,
      description: newEventDescription || undefined,
      color: newEventColor,
    };
    setCalendarEvents(prev => [...prev, newEvent]);
    setIsAddEventModalOpen(false);
    // Reset form
    setNewEventTitle('');
    setNewEventDate(null);
    setNewEventStartTime('');
    setNewEventEndTime('');
    setNewEventIsAllDay(false);
    setNewEventDescription('');
    setNewEventColor('#8884d8');
    setNewEventType('event');
  };

  const handleDeleteEvent = (eventId: string) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== eventId));
    setIsEventDetailsModalOpen(false);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDetailsModalOpen(true);
  };

  // --- Section Colors ---
  const sectionColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const colors = ['bg-blue-400', 'bg-green-400', 'bg-pink-400', 'bg-yellow-400', 'bg-purple-400'];
    availableSections.forEach((section, index) => {
      map.set(section.id, colors[index % colors.length]);
    });
    return map;
  }, [availableSections]);

  const getSessionColorClass = (sectionId: string) => {
    return sectionColorMap.get(sectionId) || 'bg-gray-500';
  };

  // --- Get Display ---
  const getSessionDisplay = (session: WeeklyScheduleSession) => (
    <div className="text-center">
      <Typography variant="small" className="text-white font-bold">
        {session.sectionName}
      </Typography>
      {session.classroom && (
        <Typography variant="small" className="text-white opacity-90 flex items-center justify-center gap-1">
          <FaMapMarkerAlt /> {session.classroom}
        </Typography>
      )}
    </div>
  );

  // --- Insights ---
  const scheduleInsights = useMemo(() => {
    const totalHours = weeklyScheduleTemplate.reduce((acc, s) => acc + s.duration, 0);
    const extraSessions = weeklyScheduleTemplate.filter(s => s.sessionType === 'extra').length;
    const compensatorySessions = weeklyScheduleTemplate.filter(s => s.sessionType === 'compensatory').length;

    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    const thisWeekEvents = calendarEvents.filter(event => {
      const eventDate = parseISO(event.date);
      return isWithinInterval(eventDate, { start: currentWeekStart, end: weekEnd });
    });

    const hoursByDay = DAYS.reduce((acc, day) => {
      acc[day] = weeklyScheduleTemplate
        .filter(s => s.day === day)
        .reduce((total, s) => total + s.duration, 0);
      return acc;
    }, {} as Record<string, number>);

    const busiestDay = Object.entries(hoursByDay).reduce(
      (a, b) => (b[1] > a[1] ? b : a),
      ['', 0]
    );

    return {
      totalHours,
      extraSessions,
      compensatorySessions,
      thisWeekEvents,
      busiestDay: busiestDay[0] ? `${busiestDay[0]}: ${busiestDay[1]}h` : 'N/A'
    };
  }, [weeklyScheduleTemplate, calendarEvents, currentWeekStart]);

  const getEventsForDay = (day: string) => {
    const dayIndex = DAYS.indexOf(day);
    const weekDays = eachDayOfInterval({ start: currentWeekStart, end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }) });
    const targetDate = weekDays[dayIndex];
    return calendarEvents.filter(event => isSameDay(parseISO(event.date), targetDate));
  };

  const currentWeekRange = `${format(currentWeekStart, 'dd MMMM yyyy')} - ${format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'dd MMMM yyyy')}`;

  return (
    <div className="p-4" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h4">الجدول الأسبوعي</Typography>
        <div className="flex gap-2">
          <Button variant="contained" color="primary" onClick={() => setIsAddEventModalOpen(true)}>+ حدث جديد</Button>
          <Button variant="contained" color="error" onClick={handleClearAllSchedule}>حذف الجدول بالكامل</Button>
        </div>
      </div>

      {/* Insights Panel */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="مجموع الساعات الأسبوعية" value={`${scheduleInsights.totalHours}h`} icon={FaClock} />
        <StatCard title="الحصص الخاصة" value={`${scheduleInsights.extraSessions + scheduleInsights.compensatorySessions}`} details={`إضافية: ${scheduleInsights.extraSessions}, تعويضية: ${scheduleInsights.compensatorySessions}`} icon={FaExclamationCircle} />
        <StatCard title="أحداث هذا الأسبوع" value={`${scheduleInsights.thisWeekEvents.length}`} icon={FaCalendarCheck} />
        <StatCard title="اليوم الأكثر ازدحاماً" value={scheduleInsights.busiestDay} icon={FaChartLine} />
        <StatCard title="أحداث الأسبوع القادم" value={`${0}`} icon={FaForward} />
      </div>

      <div className="flex justify-center items-center gap-4 mb-6">
        <IconButton onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}>
          <FaChevronRight className="h-5 w-5" />
        </IconButton>
        <Button variant="outlined" onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
          الأسبوع الحالي
        </Button>
        <IconButton onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}>
          <FaChevronLeft className="h-5 w-5" />
        </IconButton>
        <Typography variant="h6" className="whitespace-nowrap">
          الأسبوع الحالي: {currentWeekRange}
        </Typography>
      </div>

      {/* Schedule Grid */}
      <div className="overflow-x-auto">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `minmax(120px, 1fr) repeat(${DAYS.length}, 1fr)`,
            gridTemplateRows: `repeat(${TIME_SLOTS.length}, minmax(40px, auto))`
          }}
        >
          <div className="p-2 font-bold text-center border-b border-r border-gray-300"></div>
          {DAYS.map(day => (
            <div key={day} className="p-2 font-bold text-center border-b border-gray-300">
              {day}
            </div>
          ))}

          {TIME_SLOTS.map(timeSlot => (
            <React.Fragment key={timeSlot}>
              <div className="p-2 font-bold text-center border-r border-gray-300 whitespace-nowrap">
                {formatTimeRange(timeSlot, 1)}
              </div>
              {DAYS.map(day => {
                const sessionsAtThisSlot = weeklyScheduleTemplate.filter(
                  s => s.day === day && s.startTime === timeSlot
                );
                const hasSession = sessionsAtThisSlot.length > 0;
                const isPartOfLongerSession = isSubsequentSlotOfMultiSlotSession(day, timeSlot, weeklyScheduleTemplate);

                if (isPartOfLongerSession) {
                  return <div key={`${day}-${timeSlot}`} className="border border-gray-200"></div>;
                }

                const rowSpan = hasSession ? sessionsAtThisSlot[0].duration : 1;

                return (
                  <div
                    key={`${day}-${timeSlot}`}
                    className={`p-2 border border-gray-200 flex items-center justify-center relative cursor-pointer ${
                      hasSession ? '' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{ gridRow: `span ${rowSpan}` }}
                    onClick={() => handleCellClick(day, timeSlot)}
                  >
                    {hasSession ? (
                      sessionsAtThisSlot.map(session => (
                        <div
                          key={session.id}
                          className={`w-full p-1 rounded ${getSessionColorClass(session.sectionId)}`}
                        >
                          {getSessionDisplay(session)}
                        </div>
                      ))
                    ) : (
                      <Typography variant="small" color="blue-gray">+</Typography>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Modals */}
      <Dialog open={isAddEditModalOpen} onClose={() => setIsAddEditModalOpen(false)} size="xs" dir="rtl">
        <DialogTitle>{editingSession ? 'تعديل حصة' : 'إضافة حصة جديدة'}</DialogTitle>
        <DialogContent dividers>
          {currentTimeSlot && (
            <div className="flex flex-col gap-4">
              <Select label="اليوم" value={currentDay} onChange={(e) => setCurrentDay(e.target.value as string)} fullWidth>
                {DAYS.map(day => (<MenuItem key={day} value={day}>{day}</MenuItem>))}
              </Select>
              <Select label="الوقت" value={currentTimeSlot} onChange={(e) => setCurrentTimeSlot(e.target.value as string)} fullWidth>
                {TIME_SLOTS.map(timeSlot => (<MenuItem key={timeSlot} value={timeSlot}>{formatTimeRange(timeSlot, 1)}</MenuItem>))}
              </Select>
              <Select label="القسم" value={newSessionSectionId} onChange={(e) => setNewSessionSectionId(e.target.value as string)} fullWidth disabled={availableSections.length === 0}>
                {Array.isArray(availableSections) && availableSections.length > 0 ? (
                  availableSections.map(section => (<MenuItem key={section.id} value={section.id}>{section.name}</MenuItem>))
                ) : (
                  <MenuItem disabled>لا يوجد أقسام متاحة</MenuItem>
                )}
              </Select>
              <TextField label="المادة" value={newSessionSubject} onChange={(e) => setNewSessionSubject(e.target.value)} fullWidth />
              <TextField label="الأستاذ" value={newSessionTeacher} onChange={(e) => setNewSessionTeacher(e.target.value)} fullWidth />
              <TextField label="رقم القاعة" value={newSessionClassroom} onChange={(e) => setNewSessionClassroom(e.target.value)} fullWidth />
              <TextField label="المدة (بالساعات)" type="number" value={newSessionDuration} onChange={(e) => setNewSessionDuration(Number(e.target.value))} min={1} max={4} fullWidth />
              <div className="flex gap-4">
                <Checkbox label="رسمية" checked={newSessionType === 'official'} onChange={() => setNewSessionType('official')} />
                <Checkbox label="إضافية" checked={newSessionType === 'extra'} onChange={() => setNewSessionType('extra')} />
                <Checkbox label="تعويضية" checked={newSessionType === 'compensatory'} onChange={() => setNewSessionType('compensatory')} />
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="error" onClick={() => setIsAddEditModalOpen(false)} className="mr-1">إلغاء</Button>
          <Button variant="contained" color="success" onClick={handleAddEditSessionSubmit}>{editingSession ? 'تعديل' : 'إضافة'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isAbsenceModalOpen} onClose={() => setIsAbsenceModalOpen(false)} size="xs" dir="rtl">
        <DialogTitle>تسجيل غياب</DialogTitle>
        <DialogContent dividers>
          {selectedSessionInstance && (
            <div>
              <div className="mb-2">حصة: {getSessionDisplay(selectedSessionInstance)}</div>
              <Typography>اليوم: {selectedSessionInstance.day}, الوقت: {selectedSessionInstance.startTime}</Typography>
            </div>
          )}
          <TextField label="تاريخ الغياب (YYYY-MM-DD)" type="date" value={absenceDate} onChange={(e) => setAbsenceDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} className="mt-4 mb-4" />
          <TextField label="سبب الغياب" value={absenceReason} onChange={(e) => setAbsenceReason(e.target.value)} fullWidth className="mb-4" />
          <Checkbox label="غياب جماعي" checked={isCollectiveAbsence} onChange={() => setIsCollectiveAbsence(prev => !prev)} />
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="error" onClick={() => setIsAbsenceModalOpen(false)} className="mr-1">إلغاء</Button>
          <Button variant="contained" color="success" onClick={handleAbsenceSubmit}>تسجيل الغياب</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isOptionsModalOpen} onClose={() => setIsOptionsModalOpen(false)} size="xs" dir="rtl">
        <DialogTitle>خيارات الحصة</DialogTitle>
        <DialogContent dividers>
          {sessionToModify && (
            <div>
              <div className="mb-2">حصة: {getSessionDisplay(sessionToModify)}</div>
              <Typography>اليوم: {sessionToModify.day}, الوقت: {sessionToModify.startTime 
                ? formatTimeRange(sessionToModify.startTime, sessionToModify.duration) 
                : "وقت غير محدد"}</Typography>
            </div>
          )}
        </DialogContent>
        <DialogActions className="flex flex-col gap-2">
          <Button variant="contained" color="primary" onClick={() => handleOpenEditModal(sessionToModify!)} fullWidth><FaEdit className="inline-block ml-2" /> تعديل الحصة</Button>
          <Button variant="contained" color="warning" onClick={() => handleAbsenceClick(sessionToModify!)} fullWidth><FaTimes className="inline-block ml-2" /> تسجيل غياب</Button>
          <Button variant="contained" color="error" onClick={() => handleDeleteSession(sessionToModify!.id)} fullWidth><FaTrash className="inline-block ml-2" /> حذف الحصة</Button>
          <Button variant="text" color="inherit" onClick={() => setIsOptionsModalOpen(false)} fullWidth>إلغاء</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isAddEventModalOpen} onClose={() => setIsAddEventModalOpen(false)} size="sm" dir="rtl">
        <DialogTitle>إضافة حدث جديد</DialogTitle>
        <DialogContent dividers>
          <div className="flex flex-col gap-4">
            <TextField label="عنوان الحدث" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} fullWidth />
            <div dir="ltr">
              <DatePicker selected={newEventDate} onChange={(date: Date | null) => setNewEventDate(date)} dateFormat="dd/MM/yyyy" customInput={<CustomDateInput />} placeholderText="تاريخ الحدث (DD/MM/YYYY)" />
            </div>
            <Checkbox label="حدث طوال اليوم" checked={newEventIsAllDay} onChange={() => setNewEventIsAllDay(prev => !prev)} />
            {!newEventIsAllDay && (
              <div className="flex gap-4">
                <TextField label="وقت البدء (HH:MM)" value={newEventStartTime} onChange={(e) => setNewEventStartTime(e.target.value)} fullWidth />
                <TextField label="وقت الانتهاء (HH:MM)" value={newEventEndTime} onChange={(e) => setNewEventEndTime(e.target.value)} fullWidth />
              </div>
            )}
            <Select label="نوع الحدث" value={newEventType} onChange={(e) => setNewEventType(e.target.value as "holiday" | "meeting" | "exam" | "event")} fullWidth>
              <MenuItem value="event">حدث عام</MenuItem>
              <MenuItem value="holiday">عطلة</MenuItem>
              <MenuItem value="meeting">اجتماع</MenuItem>
              <MenuItem value="exam">اختبار</MenuItem>
            </Select>
            <TextField label="وصف (اختياري)" value={newEventDescription} onChange={(e) => setNewEventDescription(e.target.value)} fullWidth />
            <TextField label="لون (اختياري - Hex)" value={newEventColor} onChange={(e) => setNewEventColor(e.target.value)} fullWidth />
          </div>
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="error" onClick={() => setIsAddEventModalOpen(false)} className="mr-1">إلغاء</Button>
          <Button variant="contained" color="success" onClick={handleAddEventSubmit}>إضافة الحدث</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isEventDetailsModalOpen} onClose={() => setIsEventDetailsModalOpen(false)} size="xs" dir="rtl">
        <DialogTitle>تفاصيل الحدث</DialogTitle>
        <DialogContent dividers>
          {selectedEvent && (
            <div className="flex flex-col gap-2">
              <Typography variant="h6">{selectedEvent.title}</Typography>
              <Typography>التاريخ: {selectedEvent.date}</Typography>
              {selectedEvent.time && <Typography>الوقت: {selectedEvent.time.start} - {selectedEvent.time.end}</Typography>}
              {selectedEvent.description && <Typography>الوصف: {selectedEvent.description}</Typography>}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="inherit" onClick={() => setIsEventDetailsModalOpen(false)} className="mr-1">إلغاء</Button>
          <Button variant="contained" color="error" onClick={() => handleDeleteEvent(selectedEvent!.id)}>حذف الحدث</Button>
        </DialogActions>
      </Dialog>

      <EditLessonModal
        open={isEditLessonModalOpen}
        onClose={() => setIsEditLessonModalOpen(false)}
        lesson={selectedLessonForEdit}
        onSave={handleSaveEditedLesson}
        sections={availableSections}
        lessonTemplates={lessonTemplates}
        scheduledLessons={scheduledLessons}
      />
    </div>
  );
}

export default Schedule;