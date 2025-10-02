
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
import { useSnackbar } from 'notistack';
import { useSections } from '../contexts/SectionsContext';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isSameDay, parseISO, isValid, isWithinInterval, isAfter, isBefore } from 'date-fns';
import { AdaptedLesson } from '../types/lessonLogTypes';
import EditLessonModal from '../components/EditLessonModal';
import { getSessionEndTime } from '../utils/lessonUtils';
import { FaTimes, FaEdit, FaTrash, FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaClock, FaCalendarCheck, FaExclamationCircle, FaForward, FaChartLine, FaPrint, FaDownload, FaUpload } from 'react-icons/fa';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { 
  fetchAdminSchedule, 
  addAdminScheduleEntry, 
  updateAdminScheduleEntry, 
  deleteAdminScheduleEntry 
} from '../services/api/adminScheduleService';
import * as XLSX from 'xlsx';

// --- Constants ---
const DAYS = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00",
  "15:00", "16:00", "17:00", "18:00"
];


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
  date: string;        // تاريخ البداية
  endDate?: string;    // تاريخ الانتهاء (للأحداث متعددة الأيام)
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
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
      InputProps={{ readOnly: true }}
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
          <Typography variant="body2" color="textSecondary" className="font-semibold">{title}</Typography>
          <Typography variant="h5" color="blue-gray" className="font-bold" sx={{ fontWeight: 'bold' }}>{value}</Typography>
          {details && <Typography variant="body2" className="text-gray-600">{details}</Typography>}
        </div>
      </CardContent>
    </Card>
  );
};

// --- Main Schedule Component ---
function Schedule() {
  const { enqueueSnackbar } = useSnackbar();
  const { sections: availableSections } = useSections();

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
  const [newEventEndDate, setNewEventEndDate] = useState<Date | null>(null);
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

  // States for event upload
  const [isEventUploadModalOpen, setIsEventUploadModalOpen] = useState(false);
  const [eventFile, setEventFile] = useState<File | null>(null);
  const [isUploadingEvents, setIsUploadingEvents] = useState(false);

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('calendarEvents');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Missing Function Definition ---
  const handleSaveEditedLesson = async (updatedLesson: AdaptedLesson) => {
    try {
      // Update the lesson in the scheduled lessons list
      setScheduledLessons(prevLessons => 
        prevLessons.map(lesson => 
          lesson.id === updatedLesson.id 
            ? {
                ...lesson,
                customTitle: updatedLesson.lessonTitle,
                stages: updatedLesson.stages,
                notes: updatedLesson.notes?.map(note => note.text).join('\n') || '', // Convert notes array to string for ScheduledLesson format
                manualSessionNumber: updatedLesson.manualSessionNumber,
                progress: updatedLesson.progress
              }
            : lesson
        )
      );
      
      // Also update lesson logs if applicable
      setLessonLogs(prevLogs => 
        prevLogs.map(log => 
          log.id === updatedLesson.id 
            ? {
                ...log,
                lessonTitle: updatedLesson.lessonTitle,
                stages: updatedLesson.stages,
                teacherNotes: updatedLesson.notes?.map(note => note.text).join('\n') || ''
              }
            : log
        )
      );

      console.log('تم حفظ الحصة المعدلة:', updatedLesson);
      enqueueSnackbar('تم حفظ تعديلات الدرس بنجاح', { variant: 'success' });
    } catch (error) {
      console.error('خطأ في حفظ الدرس:', error);
      enqueueSnackbar('فشل في حفظ تعديلات الدرس', { variant: 'error' });
    }
    
    setIsEditLessonModalOpen(false);
    setSelectedLessonForEdit(null);
  };

  // --- Print Schedule Function ---
  const handlePrintSchedule = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>الجدول الأسبوعي</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
              h1 { text-align: center; color: #333; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .session { 
                background-color: #e3f2fd; 
                border-radius: 4px; 
                padding: 4px; 
                margin: 2px 0; 
                font-size: 12px;
              }
              .time-header { background-color: #e8f5e8; }
              @media print {
                body { margin: 0; }
                table { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <h1>الجدول الأسبوعي للحصص</h1>
            <table>
              <thead>
                <tr>
                  <th class="time-header">الوقت</th>
                  ${DAYS.map(day => `<th>${day}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${TIME_SLOTS.map(timeSlot => `
                  <tr>
                    <td class="time-header"><strong>${formatTimeRange(timeSlot, 1)}</strong></td>
                    ${DAYS.map(day => {
                      const sessionsAtThisSlot = weeklyScheduleTemplate.filter(s => 
                        s.day === day && s.startTime === timeSlot
                      );
                      return `<td>${sessionsAtThisSlot.map(session => 
                        `<div class="session">${session.sectionName}</div>`
                      ).join('')}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p style="text-align: center; margin-top: 30px; color: #666;">
              تم طباعة الجدول في: ${new Date().toLocaleDateString('ar-SA')}
            </p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  // --- Download Events Template ---
  const handleDownloadEventsTemplate = () => {
    const link = document.createElement('a');
    link.href = '/نموذج_الأحداث.xlsx';
    link.download = 'نموذج_الأحداث.xlsx';
    link.click();
  };

  // --- Helper function to parse dates ---
  const parseDate = (dateValue: any): string => {
    if (!dateValue) {
      return '';
    }

    // تحويل القيمة إلى string إذا لم تكن كذلك
    let dateStr: string;
    
    if (typeof dateValue === 'number') {
      // إذا كان التاريخ رقماً (Excel serial date)
      const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
      const year = excelDate.getFullYear();
      const month = (excelDate.getMonth() + 1).toString().padStart(2, '0');
      const day = excelDate.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } else if (dateValue instanceof Date) {
      // إذا كان التاريخ من نوع Date
      const year = dateValue.getFullYear();
      const month = (dateValue.getMonth() + 1).toString().padStart(2, '0');
      const day = dateValue.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } else {
      // تحويل إلى string
      dateStr = String(dateValue).trim();
    }

    if (!dateStr || dateStr === '' || dateStr === 'undefined' || dateStr === 'null') {
      return '';
    }

    // إذا كان التاريخ بالفعل بالصيغة الصحيحة YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // إذا كان التاريخ بصيغة DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      const parts = dateStr.split('/');
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }

    // إذا كان التاريخ بصيغة DD-MM-YYYY
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
      const parts = dateStr.split('-');
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }

    // إذا كان التاريخ بصيغة YYYY/MM/DD
    if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateStr)) {
      const parts = dateStr.split('/');
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // محاولة تحويل التاريخ باستخدام Date constructor
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (error) {
      console.warn('Failed to parse date:', dateValue);
    }

    return '';
  };

  // --- Upload Events from Excel ---
  const handleUploadEvents = async () => {
    if (!eventFile) {
      alert('الرجاء اختيار ملف Excel أولاً');
      return;
    }

    setIsUploadingEvents(true);
    try {
      const data = await eventFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const newEvents: CalendarEvent[] = [];

      jsonData.forEach((row: any, index: number) => {
        try {
          // التعامل مع الأعمدة العربية والإنجليزية مع معالجة آمنة للبيانات
          const title = String(row['العنوان'] || row['Title'] || '').trim();
          const rawDate = row['التاريخ'] || row['تاريخ البداية'] || row['Date'] || row['Start Date'] || '';
          const rawEndDate = row['تاريخ الانتهاء'] || row['End Date'] || '';
          const startTime = String(row['وقت البداية'] || row['Start Time'] || '').trim();
          const endTime = String(row['وقت النهاية'] || row['End Time'] || '').trim();
          const isAllDayValue = row['يوم كامل'] || row['All Day'] || '';
          const isAllDay = String(isAllDayValue).toLowerCase().trim();
          const description = String(row['الوصف'] || row['Description'] || '').trim();
          const typeValue = String(row['النوع'] || row['Type'] || 'حدث').trim();
          const color = String(row['اللون'] || row['Color'] || '#8884d8').trim();

          // تحويل التواريخ إلى الصيغة الصحيحة
          const date = parseDate(rawDate);
          const endDate = parseDate(rawEndDate);

          console.log(`Processing row ${index + 1}:`, {
            title,
            rawDate,
            parsedDate: date,
            rawEndDate,
            parsedEndDate: endDate,
            dataTypes: {
              rawDate: typeof rawDate,
              rawEndDate: typeof rawEndDate,
              title: typeof title
            }
          });

          // تحويل النوع إلى الإنجليزية
          let type: "holiday" | "meeting" | "exam" | "event" = 'event';
          switch (typeValue.toLowerCase()) {
            case 'عطلة':
            case 'holiday':
              type = 'holiday';
              break;
            case 'اجتماع':
            case 'meeting':
              type = 'meeting';
              break;
            case 'امتحان':
            case 'exam':
              type = 'exam';
              break;
            default:
              type = 'event';
          }

          if (title && date) {
            const event: CalendarEvent = {
              id: Date.now().toString() + index,
              title,
              date,
              endDate: endDate || undefined,
              startTime: startTime || undefined,
              endTime: endTime || undefined,
              isAllDay: isAllDay === 'نعم' || isAllDay === 'true' || isAllDay === 'yes',
              description,
              type,
              color
            };
            newEvents.push(event);
            console.log('Added event:', event);
          } else {
            console.warn(`Skipping row ${index + 1}: missing title or date`, { 
              title, 
              date, 
              rawTitle: row['العنوان'] || row['Title'],
              rawDate: rawDate
            });
          }
        } catch (error) {
          console.error(`Error processing row ${index + 1}:`, error, row);
        }
      });

      const updatedEvents = [...calendarEvents, ...newEvents];
      setCalendarEvents(updatedEvents);
      localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
      
      console.log(`Successfully uploaded ${newEvents.length} events:`, newEvents);
      
      if (newEvents.length > 0) {
        alert(`تم رفع ${newEvents.length} حدث بنجاح! 🎉\n\nالأحداث المرفوعة:\n${newEvents.map(e => `• ${e.title} (${e.date})`).join('\n')}`);
      } else {
        alert(`تم رفع 0 حدث! ⚠️\n\nأسباب محتملة:\n• تأكد من أن الملف يحتوي على أعمدة: العنوان، التاريخ أو تاريخ البداية\n• تأكد من أن التواريخ بصيغة صحيحة (مثل: 2025-06-15 أو 23/11/2010)\n• تأكد من أن هناك بيانات في الصفوف`);
      }
      
      setIsEventUploadModalOpen(false);
      setEventFile(null);
    } catch (error) {
      console.error('خطأ في رفع الأحداث:', error);
      alert('حدث خطأ في رفع الملف. تأكد من أن الملف بصيغة Excel صحيحة.');
    } finally {
      setIsUploadingEvents(false);
    }
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

      // تعديل: عرض جميع الأحداث حتى لو لم يكن القسم موجود في القائمة
      const validEntries = entries.filter(
        entry =>
          entry.startTime &&
          entry.day &&
          entry.sectionId // إزالة شرط وجود القسم في availableSections
      );

      const schedule = validEntries.map(entry => {
        const section = availableSections.find(s => s.id === entry.sectionId);
        return {
          id: entry.id || generateId(),
          day: entry.day,
          startTime: entry.startTime,
          duration: entry.duration || 1,
          sectionId: entry.sectionId || '',
          sectionName: section?.name || `قسم ${entry.sectionId}` || 'قسم غير معروف', // إظهار معرف القسم إذا لم يجد الاسم
          subject: entry.subject || 'حصة دراسية',
          teacher: entry.teacher || '',
          classroom: entry.classroom || '',
          sessionType: (entry.sessionType as "official" | "extra" | "compensatory") || 'official',
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
    // يمكن إضافة المنطق لحفظ الغياب هنا لاحقاً
    console.log('Absence recorded for:', {
      sessionId: selectedSessionInstance.id,
      date: absenceDate,
      reason: absenceReason,
      isCollective: isCollectiveAbsence
    });
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
      endDate: newEventEndDate ? format(newEventEndDate, 'yyyy-MM-dd') : undefined,
      startTime: newEventIsAllDay ? undefined : newEventStartTime,
      endTime: newEventIsAllDay ? undefined : newEventEndTime,
      isAllDay: newEventIsAllDay,
      type: newEventType,
      description: newEventDescription || undefined,
      color: newEventColor,
    };
    setCalendarEvents(prev => {
      const updated = [...prev, newEvent];
      localStorage.setItem('calendarEvents', JSON.stringify(updated));
      return updated;
    });
    setIsAddEventModalOpen(false);
    // Reset form
    setNewEventTitle('');
    setNewEventDate(null);
    setNewEventEndDate(null);
    setNewEventStartTime('');
    setNewEventEndTime('');
    setNewEventIsAllDay(false);
    setNewEventDescription('');
    setNewEventColor('#8884d8');
    setNewEventType('event');
  };

  const handleDeleteEvent = (eventId: string) => {
    setCalendarEvents(prev => {
      const updated = prev.filter(e => e.id !== eventId);
      localStorage.setItem('calendarEvents', JSON.stringify(updated));
      return updated;
    });
    setIsEventDetailsModalOpen(false);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDetailsModalOpen(true);
  };

  // --- Section Colors ---
  const sectionColorMap = useMemo(() => {
    const map = new Map<string, string>();
    // ألوان هادئة ومريحة للعين
    const colors = [
      'bg-blue-100 text-blue-800',     // أزرق فاتح
      'bg-green-100 text-green-800',   // أخضر فاتح
      'bg-purple-100 text-purple-800', // بنفسجي فاتح
      'bg-orange-100 text-orange-800', // برتقالي فاتح
      'bg-pink-100 text-pink-800',     // وردي فاتح
      'bg-teal-100 text-teal-800',     // تيل فاتح
      'bg-indigo-100 text-indigo-800', // نيلي فاتح
      'bg-yellow-100 text-yellow-800', // أصفر فاتح
      'bg-red-100 text-red-800',       // أحمر فاتح
      'bg-gray-100 text-gray-800'      // رمادي فاتح
    ];
    availableSections.forEach((section, index) => {
      map.set(section.id, colors[index % colors.length]);
    });
    return map;
  }, [availableSections]);

  const getSessionColorClass = (sectionId: string) => {
    return sectionColorMap.get(sectionId) || 'bg-gray-100 text-gray-800';
  };

  // --- Get Display ---
  const getSessionDisplay = (session: WeeklyScheduleSession) => (
    <div className="text-center">
      <Typography variant="body2" className="text-white font-bold">
        {session.sectionName}
      </Typography>
      {session.classroom && (
        <Typography variant="body2" className="text-white opacity-90 flex items-center justify-center gap-1">
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
      const eventStartDate = parseISO(event.date);
      
      // For single-day events
      if (!event.endDate) {
        return isWithinInterval(eventStartDate, { start: currentWeekStart, end: weekEnd });
      }
      
      // For multi-day events, check if any part of the event overlaps with this week
      const eventEndDate = parseISO(event.endDate);
      return (
        // Event starts within this week
        isWithinInterval(eventStartDate, { start: currentWeekStart, end: weekEnd }) ||
        // Event ends within this week
        isWithinInterval(eventEndDate, { start: currentWeekStart, end: weekEnd }) ||
        // Event spans the entire week (starts before and ends after)
        (isBefore(eventStartDate, currentWeekStart) && isAfter(eventEndDate, weekEnd))
      );
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

  // Helper function to check if a date is within an event's range
  const isDateInEventRange = (targetDate: Date, event: CalendarEvent): boolean => {
    const eventStartDate = parseISO(event.date);
    
    // If the event has no end date, it's a single-day event
    if (!event.endDate) {
      return isSameDay(eventStartDate, targetDate);
    }
    
    // For multi-day events, check if target date is within the range
    const eventEndDate = parseISO(event.endDate);
    return (
      (isSameDay(eventStartDate, targetDate) || isAfter(targetDate, eventStartDate)) &&
      (isSameDay(eventEndDate, targetDate) || isBefore(targetDate, eventEndDate))
    );
  };

  // Get events for a specific date object
  const getEventsForDate = (date: Date) => {
    return calendarEvents.filter(event => isDateInEventRange(date, event));
  };

  const currentWeekRange = `${format(currentWeekStart, 'dd MMMM yyyy')} - ${format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'dd MMMM yyyy')}`;

  // Get dates for each day of the current week
  const getWeekDates = useMemo(() => {
    const weekDays = eachDayOfInterval({ 
      start: currentWeekStart, 
      end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }) 
    });
    return DAYS.map((day, index) => ({
      dayName: day,
      date: weekDays[index],
      formattedDate: format(weekDays[index], 'dd MMMM')
    }));
  }, [currentWeekStart]);

  return (
    <div className="p-4" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>الجدول الأسبوعي</Typography>
        <div className="flex gap-2">
          <Button variant="contained" color="primary" onClick={() => setIsAddEventModalOpen(true)} sx={{ fontWeight: 'bold' }}>+ حدث جديد</Button>
          <Button variant="contained" style={{ backgroundColor: '#2e7d32' }} onClick={handlePrintSchedule} sx={{ fontWeight: 'bold' }}>
            <FaPrint className="mr-2" /> طباعة الجدول
          </Button>
          <Button variant="contained" style={{ backgroundColor: '#1976d2' }} onClick={handleDownloadEventsTemplate} sx={{ fontWeight: 'bold' }}>
            <FaDownload className="mr-2" /> تنزيل نموذج الأحداث (Excel)
          </Button>
          <Button variant="contained" style={{ backgroundColor: '#ed6c02' }} onClick={() => setIsEventUploadModalOpen(true)} sx={{ fontWeight: 'bold' }}>
            <FaUpload className="mr-2" /> رفع الأحداث
          </Button>
          <Button variant="contained" color="error" onClick={handleClearAllSchedule} sx={{ fontWeight: 'bold' }}>حذف الجدول بالكامل</Button>
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
        <Typography variant="h6" className="whitespace-nowrap" sx={{ fontWeight: 'bold' }}>
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
          <div className="p-2 font-bold text-center border-b border-r border-gray-300" style={{ fontWeight: 'bold' }}></div>
          {getWeekDates.map(({ dayName, formattedDate, date }) => {
            const dayEvents = getEventsForDate(date);
            return (
              <div key={dayName} className="p-2 font-bold text-center border-b border-gray-300 space-y-1" style={{ fontWeight: 'bold' }}>
                <div className="text-base" style={{ fontWeight: 'bold' }}>{dayName}</div>
                <div className="text-xs text-gray-600">{formattedDate}</div>
                
                {/* Display Events */}
                {dayEvents.map((event) => {
                  const isMultiDay = event.endDate && event.endDate !== event.date;
                  const isStartDay = event.date === format(date, 'yyyy-MM-dd');
                  const isEndDay = event.endDate === format(date, 'yyyy-MM-dd');
                  
                  return (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className={`text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 text-white font-medium relative ${
                        isMultiDay ? 'border-l-4 border-r-4' : ''
                      }`}
                      style={{ 
                        backgroundColor: event.color || '#1976d2',
                        borderColor: isMultiDay ? 'rgba(255,255,255,0.8)' : 'transparent'
                      }}
                    >
                      {event.title}
                      {isMultiDay && (
                        <div className="text-xs opacity-75 mt-1">
                          {isStartDay && isEndDay ? '📅 يوم واحد' :
                           isStartDay ? '🏁 بداية' :
                           isEndDay ? '🏁 نهاية' : '➖ متواصل'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {TIME_SLOTS.map(timeSlot => (
            <React.Fragment key={timeSlot}>
              <div className="p-2 font-bold text-center border-r border-gray-300 whitespace-nowrap" style={{ fontWeight: 'bold' }}>
                {formatTimeRange(timeSlot, 1)}
              </div>
              {DAYS.map((day) => {
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
                    className={`p-2 border border-gray-200 flex flex-col relative cursor-pointer ${
                      hasSession ? '' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{ gridRow: `span ${rowSpan}` }}
                    onClick={() => handleCellClick(day, timeSlot)}
                  >
                    {/* Sessions */}
                    {hasSession ? (
                      <div className="flex-1">
                        {sessionsAtThisSlot.map(session => (
                          <div
                            key={session.id}
                            className={`w-full p-1 rounded mb-1 ${getSessionColorClass(session.sectionId)}`}
                          >
                            {getSessionDisplay(session)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <Typography variant="body2" color="textSecondary">+</Typography>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Modals */}
      <Dialog open={isAddEditModalOpen} onClose={() => setIsAddEditModalOpen(false)} maxWidth="xs" fullWidth dir="rtl">
        <DialogTitle sx={{ fontWeight: 'bold' }}>{editingSession ? 'تعديل حصة' : 'إضافة حصة جديدة'}</DialogTitle>
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
              <TextField 
                label="المدة (بالساعات)" 
                type="number" 
                value={newSessionDuration} 
                onChange={(e) => setNewSessionDuration(Number(e.target.value))} 
                inputProps={{ min: 1, max: 4 }}
                fullWidth 
              />
              <div className="flex gap-4">
                <label><Checkbox checked={newSessionType === 'official'} onChange={() => setNewSessionType('official')} /> رسمية</label>
                <label><Checkbox checked={newSessionType === 'extra'} onChange={() => setNewSessionType('extra')} /> إضافية</label>
                <label><Checkbox checked={newSessionType === 'compensatory'} onChange={() => setNewSessionType('compensatory')} /> تعويضية</label>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="error" onClick={() => setIsAddEditModalOpen(false)} className="mr-1">إلغاء</Button>
          <Button variant="contained" color="success" onClick={handleAddEditSessionSubmit}>{editingSession ? 'تعديل' : 'إضافة'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isAbsenceModalOpen} onClose={() => setIsAbsenceModalOpen(false)} maxWidth="xs" fullWidth dir="rtl">
        <DialogTitle sx={{ fontWeight: 'bold' }}>تسجيل غياب</DialogTitle>
        <DialogContent dividers>
          {selectedSessionInstance && (
            <div>
              <div className="mb-2">حصة: {getSessionDisplay(selectedSessionInstance)}</div>
              <Typography>اليوم: {selectedSessionInstance.day}, الوقت: {selectedSessionInstance.startTime}</Typography>
            </div>
          )}
          <TextField label="تاريخ الغياب (YYYY-MM-DD)" type="date" value={absenceDate} onChange={(e) => setAbsenceDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} className="mt-4 mb-4" />
          <TextField label="سبب الغياب" value={absenceReason} onChange={(e) => setAbsenceReason(e.target.value)} fullWidth className="mb-4" />
          <label><Checkbox checked={isCollectiveAbsence} onChange={() => setIsCollectiveAbsence(prev => !prev)} /> غياب جماعي</label>
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="error" onClick={() => setIsAbsenceModalOpen(false)} className="mr-1">إلغاء</Button>
          <Button variant="contained" color="success" onClick={handleAbsenceSubmit}>تسجيل الغياب</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isOptionsModalOpen} onClose={() => setIsOptionsModalOpen(false)} maxWidth="xs" fullWidth dir="rtl">
        <DialogTitle sx={{ fontWeight: 'bold' }}>خيارات الحصة</DialogTitle>
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

      <Dialog open={isAddEventModalOpen} onClose={() => setIsAddEventModalOpen(false)} maxWidth="sm" fullWidth dir="rtl">
        <DialogTitle className="bg-blue-50 text-blue-900" sx={{ fontWeight: 'bold' }}>
          <div className="flex items-center gap-2">
            📅 إضافة حدث جديد
          </div>
        </DialogTitle>
        <DialogContent dividers className="space-y-4 p-6">
          <div className="flex flex-col gap-6">
            {/* عنوان الحدث */}
            <TextField 
              label="عنوان الحدث" 
              value={newEventTitle} 
              onChange={(e) => setNewEventTitle(e.target.value)} 
              fullWidth 
              variant="outlined"
              placeholder="مثال: عطلة العيد الوطني"
              dir="rtl"
            />
            
            {/* تواريخ الحدث */}
            <div className="space-y-4">
              <Typography variant="subtitle1" className="font-semibold text-gray-700" sx={{ fontWeight: 'bold' }}>
                📅 تواريخ الحدث
              </Typography>
              
              {/* تاريخ البدء */}
              <div className="space-y-2">
                <Typography variant="body2" className="text-gray-600">
                  تاريخ البدء *
                </Typography>
                <div dir="ltr">
                  <DatePicker 
                    selected={newEventDate} 
                    onChange={(date: Date | null) => setNewEventDate(date)} 
                    dateFormat="dd/MM/yyyy" 
                    customInput={<CustomDateInput />} 
                    placeholderText="اختر تاريخ بداية الحدث (DD/MM/YYYY)" 
                  />
                </div>
              </div>
              
              {/* تاريخ الانتهاء */}
              <div className="space-y-2">
                <Typography variant="body2" className="text-gray-600">
                  تاريخ الانتهاء (اختياري - للأحداث متعددة الأيام)
                </Typography>
                <div dir="ltr">
                  <DatePicker 
                    selected={newEventEndDate} 
                    onChange={(date: Date | null) => setNewEventEndDate(date)} 
                    dateFormat="dd/MM/yyyy" 
                    customInput={<CustomDateInput />} 
                    placeholderText="اختر تاريخ انتهاء الحدث (للعطل الطويلة)" 
                    minDate={newEventDate || undefined}
                  />
                </div>
                <Typography variant="caption" className="text-gray-500">
                  💡 اتركه فارغاً إذا كان الحدث ليوم واحد فقط
                </Typography>
              </div>
              
              {/* معاينة الحدث متعدد الأيام */}
              {newEventEndDate && newEventDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Typography variant="body2" className="text-blue-800 font-medium">
                    🗓️ حدث متعدد الأيام
                  </Typography>
                  <Typography variant="body2" className="text-blue-700 mt-1">
                    من {newEventDate.toLocaleDateString('ar-SA')} إلى {newEventEndDate.toLocaleDateString('ar-SA')}
                  </Typography>
                  <Typography variant="caption" className="text-blue-600">
                    المدة: {Math.ceil((newEventEndDate.getTime() - newEventDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} أيام
                  </Typography>
                </div>
              )}
            </div>
            
            {/* يوم كامل */}
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <Checkbox 
                checked={newEventIsAllDay} 
                onChange={() => setNewEventIsAllDay(prev => !prev)}
                color="primary"
              />
              <div className="flex-1">
                <Typography variant="body1" className="font-medium">
                  📆 حدث طوال اليوم
                </Typography>
                <Typography variant="caption" className="text-gray-500">
                  فعّل هذا الخيار إذا كان الحدث لا يحتاج لتوقيت محدد (مثل العطل والأعياد)
                </Typography>
              </div>
            </div>
            
            {/* أوقات الحدث */}
            {!newEventIsAllDay && (
              <div className="space-y-4">
                <Typography variant="subtitle1" className="font-semibold text-gray-700">
                  ⏰ أوقات الحدث
                </Typography>
                <div className="grid grid-cols-2 gap-4">
                  <TextField 
                    label="وقت البدء" 
                    value={newEventStartTime} 
                    onChange={(e) => setNewEventStartTime(e.target.value)} 
                    fullWidth 
                    placeholder="09:00"
                    helperText="صيغة 24 ساعة"
                    dir="ltr"
                  />
                  <TextField 
                    label="وقت الانتهاء" 
                    value={newEventEndTime} 
                    onChange={(e) => setNewEventEndTime(e.target.value)} 
                    fullWidth 
                    placeholder="17:00"
                    helperText="صيغة 24 ساعة"
                    dir="ltr"
                  />
                </div>
              </div>
            )}
            
            {/* نوع الحدث */}
            <div className="space-y-2">
              <Typography variant="subtitle1" className="font-semibold text-gray-700">
                🏷️ نوع الحدث
              </Typography>
              <Select 
                value={newEventType} 
                onChange={(e) => setNewEventType(e.target.value as "holiday" | "meeting" | "exam" | "event")} 
                fullWidth
                variant="outlined"
              >
                <MenuItem value="event">🎉 حدث عام</MenuItem>
                <MenuItem value="holiday">🏖️ عطلة</MenuItem>
                <MenuItem value="meeting">👥 اجتماع</MenuItem>
                <MenuItem value="exam">📝 اختبار</MenuItem>
              </Select>
            </div>
            
            {/* وصف الحدث */}
            <TextField 
              label="وصف الحدث (اختياري)" 
              value={newEventDescription} 
              onChange={(e) => setNewEventDescription(e.target.value)} 
              fullWidth 
              multiline
              rows={3}
              variant="outlined"
              placeholder="اكتب وصف مختصر للحدث..."
              dir="rtl"
            />
            
            {/* لون الحدث */}
            <div className="space-y-2">
              <Typography variant="subtitle1" className="font-semibold text-gray-700">
                🎨 لون الحدث (اختياري)
              </Typography>
              <TextField 
                label="كود اللون" 
                value={newEventColor} 
                onChange={(e) => setNewEventColor(e.target.value)} 
                fullWidth 
                placeholder="#FF5722"
                helperText="استخدم كود hex مثل #FF5722 أو اتركه فارغاً للون الافتراضي"
                dir="ltr"
              />
              {newEventColor && (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: newEventColor }}
                  ></div>
                  <Typography variant="caption">معاينة اللون</Typography>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions className="p-4 gap-2">
          <Button 
            variant="outlined" 
            color="error" 
            onClick={() => setIsAddEventModalOpen(false)}
            className="flex-1"
          >
            إلغاء
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleAddEventSubmit}
            className="flex-1"
            disabled={!newEventTitle || !newEventDate}
          >
            ✅ إضافة الحدث
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isEventDetailsModalOpen} onClose={() => setIsEventDetailsModalOpen(false)} maxWidth="xs" fullWidth dir="rtl">
        <DialogTitle sx={{ fontWeight: 'bold' }}>تفاصيل الحدث</DialogTitle>
        <DialogContent dividers>
          {selectedEvent && (
            <div className="flex flex-col gap-2">
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{selectedEvent.title}</Typography>
              <Typography><strong style={{ fontWeight: 'bold' }}>التاريخ:</strong> {selectedEvent.date}</Typography>
              {selectedEvent.endDate && (
                <>
                  <Typography className="text-blue-600">
                    🗓️ حدث متعدد الأيام: حتى {selectedEvent.endDate}
                  </Typography>
                  <Typography className="text-sm text-gray-600">
                    📊 المدة: {(() => {
                      const startDate = new Date(selectedEvent.date);
                      const endDate = new Date(selectedEvent.endDate);
                      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                      return `${diffDays} ${diffDays === 1 ? 'يوم' : diffDays === 2 ? 'يومان' : 'أيام'}`;
                    })()}
                  </Typography>
                </>
              )}
              {(selectedEvent.startTime && selectedEvent.endTime) && 
                <Typography><strong style={{ fontWeight: 'bold' }}>الوقت:</strong> {selectedEvent.startTime} - {selectedEvent.endTime}</Typography>
              }
              {selectedEvent.isAllDay && <Typography><strong style={{ fontWeight: 'bold' }}>يوم كامل</strong></Typography>}
              {selectedEvent.description && <Typography><strong style={{ fontWeight: 'bold' }}>الوصف:</strong> {selectedEvent.description}</Typography>}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="inherit" onClick={() => setIsEventDetailsModalOpen(false)} className="mr-1">إلغاء</Button>
          <Button variant="contained" color="error" onClick={() => handleDeleteEvent(selectedEvent!.id)} sx={{ fontWeight: 'bold' }}>حذف الحدث</Button>
        </DialogActions>
      </Dialog>

      <EditLessonModal
        open={isEditLessonModalOpen}
        onClose={() => setIsEditLessonModalOpen(false)}
        lesson={selectedLessonForEdit}
        onSave={handleSaveEditedLesson}
      />

      {/* Event Upload Modal */}
      <Dialog open={isEventUploadModalOpen} onClose={() => setIsEventUploadModalOpen(false)} maxWidth="xs" fullWidth dir="rtl">
        <DialogTitle sx={{ fontWeight: 'bold' }}>رفع الأحداث من ملف Excel</DialogTitle>
        <DialogContent dividers>
          <div className="flex flex-col gap-4">
            <Typography variant="body2" className="text-gray-600">
              اختر ملف Excel يحتوي على الأحداث. يمكنك تنزيل النموذج أولاً لمعرفة التنسيق المطلوب.
            </Typography>
            
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <Typography variant="body2" className="text-blue-800">
                <strong style={{ fontWeight: 'bold' }}>📋 تنسيق الملف المطلوب:</strong><br/>
                • الأعمدة: العنوان، التاريخ، وقت البداية، وقت النهاية، يوم كامل، الوصف، النوع، اللون<br/>
                • التاريخ: YYYY-MM-DD (مثل: 2025-06-15)<br/>
                • الوقت: HH:MM (مثل: 14:00)<br/>
                • يوم كامل: نعم أو لا<br/>
                • النوع: عطلة، اجتماع، امتحان، حدث
              </Typography>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setEventFile(e.target.files?.[0] || null)}
                className="hidden"
                id="event-file-input"
              />
              <label htmlFor="event-file-input" className="cursor-pointer">
                <FaUpload className="mx-auto mb-2 text-4xl text-gray-400" />
                <Typography variant="body1" className="mb-2">
                  {eventFile ? eventFile.name : 'اضغط لاختيار ملف Excel'}
                </Typography>
                <Typography variant="body2" className="text-gray-500">
                  أو اسحب وأفلت الملف هنا
                </Typography>
              </label>
            </div>

            {eventFile && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <Typography variant="body2" className="text-green-800">
                  ✅ تم اختيار الملف: {eventFile.name}
                </Typography>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEventUploadModalOpen(false)} disabled={isUploadingEvents}>
            إلغاء
          </Button>
          <Button 
            onClick={handleUploadEvents} 
            variant="contained" 
            disabled={!eventFile || isUploadingEvents}
          >
            {isUploadingEvents ? 'جاري الرفع...' : 'رفع الأحداث'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Schedule;