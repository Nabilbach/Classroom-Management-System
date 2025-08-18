/**
 * LessonLogPage Component
 * 
 * SETUP REQUIREMENT:
 * This component uses a React Portal for the modal dialog. Ensure that your main `index.html` file
 * has a `<div id="modal-root"></div>` in the `<body>` section.
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ar'; // Keep Arabic locale for calendar display
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { Tabs, TabsHeader, TabsBody, Tab, TabPanel } from '@material-tailwind/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/my_components/ui/card.jsx';
import Button from '@/my_components/ui/button.jsx';
import { Input } from '@/my_components/ui/input.jsx';
import { Label } from '@/my_components/ui/label.jsx';
import { Calendar as CalendarIcon, Plus, BookOpen, Trash2, GripVertical } from 'lucide-react';

import 'react-big-calendar/lib/css/react-big-calendar.css';

// --- SETUP & CONFIG ---
moment.locale('ar');
const localizer = momentLocalizer(moment);
const API_BASE_URL = 'http://localhost:5000';
const CALENDAR_DRAG_TYPE = 'lesson';
const SYLLABUS_DRAG_TYPE = 'syllabus-item';

// --- MOCK DATA for Syllabus ---
const generateMockSyllabus = () => {
    const createLesson = (id, title, semester, order) => ({ id: `syllabus-${id}`, title, semester, order, completion_date: null, stages: [{ id: `${id}-s1`, stage_name: 'المرحلة الأولى', is_completed: false }, { id: `${id}-s2`, stage_name: 'المرحلة الثانية', is_completed: false }] });
    return [ createLesson(1, 'مقدمة في الجبر', 1, 1), createLesson(2, 'المعادلات الخطية', 1, 2), createLesson(3, 'المعادلات التربيعية', 1, 3), createLesson(4, 'مقدمة في الهندسة', 2, 1), createLesson(5, 'النظريات والبراهين', 2, 2) ];
};

// --- HELPER FUNCTIONS ---
const getStatusLabel = (status) => { switch (status) { case 'completed': return 'منجز'; case 'postponed': return 'مؤجل'; default: return 'مخطط له'; } };
const getEventColor = (status) => { switch (status) { case 'completed': return '#4caf50'; case 'postponed': return '#fdd835'; default: return '#3174ad'; } };

// --- SYLLABUS COMPONENTS ---
const SyllabusLessonModal = ({ isOpen, onClose, onSave, lesson }) => {
    const [title, setTitle] = useState('');
    const [completionDate, setCompletionDate] = useState('');

    useEffect(() => {
        if (lesson) {
            setTitle(lesson.title || '');
            setCompletionDate(lesson.completion_date ? moment(lesson.completion_date).format('YYYY-MM-DD') : '');
        } else {
            setTitle('');
            setCompletionDate('');
        }
    }, [lesson]);

    const handleSave = () => {
        onSave({ ...lesson, title, completion_date: completionDate });
        onClose();
    };

    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4" dir="rtl">
            <Card className="w-full max-w-lg"><CardHeader><CardTitle>{lesson?.id ? 'تعديل درس البرنامج' : 'إضافة درس للبرنامج'}</CardTitle></CardHeader><CardContent className="space-y-4 pt-4"><div><Label htmlFor="syllabus-title">العنوان</Label><Input id="syllabus-title" value={title} onChange={(e) => setTitle(e.target.value)} /></div><div><Label htmlFor="syllabus-date">تاريخ الإنجاز</Label><Input id="syllabus-date" type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} /></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>إلغاء</Button><Button onClick={handleSave}>حفظ</Button></div></CardContent></Card>
        </div>,
        document.getElementById('modal-root')
    );
};

const DraggableSyllabusItem = ({ item, index, moveItem, onSelectItem, onDeleteItem }) => {
    const ref = useRef(null);
    const [, drop] = useDrop({ accept: SYLLABUS_DRAG_TYPE, hover(draggedItem) { if (draggedItem.index !== index) { moveItem(draggedItem.index, index); draggedItem.index = index; } } });
    const [{ isDragging }, drag, preview] = useDrag({ type: SYLLABUS_DRAG_TYPE, item: () => ({ ...item, index }), collect: (monitor) => ({ isDragging: monitor.isDragging() }) });
    preview(drop(ref));
    return (
        <div ref={ref} style={{ opacity: isDragging ? 0.4 : 1 }} className="flex items-center p-2 mb-2 bg-gray-100 rounded-md shadow-sm">
            <div ref={drag} className="cursor-move p-2"><GripVertical className="h-5 w-5 text-gray-500" /></div>
            <div className="flex-grow cursor-pointer" onClick={() => onSelectItem(item)}>
                <p className="font-semibold">{item.title}</p>
                {item.completion_date && <p className="text-sm text-green-600">أنجز في: {moment(item.completion_date).format('DD-MM-YYYY')}</p>}
            </div>
            <Button variant="ghost" size="sm" onClick={() => onDeleteItem(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </div>
    );
};

const SyllabusTab = ({ selectedClass }) => {
    const [lessons, setLessons] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState(1);
    const [selectedLesson, setSelectedLesson] = useState(null);
    useEffect(() => { setLessons(generateMockSyllabus()); }, [selectedClass]);
    const moveItem = useCallback((dragIndex, hoverIndex) => { setLessons(prev => { const newLessons = [...prev]; const [draggedItem] = newLessons.splice(dragIndex, 1); newLessons.splice(hoverIndex, 0, draggedItem); return newLessons; }); }, []);
    const handleSaveLesson = (lessonToSave) => { if (lessonToSave.id) { setLessons(prev => prev.map(l => l.id === lessonToSave.id ? lessonToSave : l)); toast.success(`تم تحديث الدرس`); } else { const newLesson = { ...lessonToSave, id: `syllabus-${Date.now()}`, semester: selectedSemester, order: lessons.filter(l => l.semester === selectedSemester).length + 1 }; setLessons(prev => [...prev, newLesson]); toast.success(`تمت إضافة الدرس`); } };
    const handleDeleteLesson = (lessonId) => { setLessons(prev => prev.filter(l => l.id !== lessonId)); toast.info('تم حذف الدرس'); };
    const filteredLessons = useMemo(() => lessons.filter(l => l.semester === selectedSemester).sort((a, b) => a.order - b.order), [lessons, selectedSemester]);
    return (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>البرنامج الدراسي</CardTitle><CardDescription>إدارة الخطة الدراسية للسنة.</CardDescription></div><div className="flex items-center gap-4"><select value={selectedSemester} onChange={e => setSelectedSemester(Number(e.target.value))} className="p-2 border rounded-md"><option value={1}>الدورة الأولى</option><option value={2}>الدورة الثانية</option></select><Button onClick={() => setSelectedLesson({})}><Plus className="w-4 h-4 ml-2" /> إضافة درس</Button></div></CardHeader>
            <CardContent className="max-h-[60vh] overflow-y-auto p-4">{filteredLessons.length > 0 ? filteredLessons.map((item, index) => <DraggableSyllabusItem key={item.id} index={index} item={item} moveItem={moveItem} onSelectItem={setSelectedLesson} onDeleteItem={handleDeleteLesson} />) : <p className="text-center text-gray-500 py-8">لا توجد دروس لهذه الدورة.</p>}</CardContent>
            <SyllabusLessonModal isOpen={!!selectedLesson} onClose={() => setSelectedLesson(null)} onSave={handleSaveLesson} lesson={selectedLesson} />
        </Card>
    );
};

// --- CALENDAR COMPONENTS ---
const CalendarLessonModal = ({ isOpen, onClose, onSave, lesson, sections }) => {
  const [formState, setFormState] = useState({});

  useEffect(() => {
    if (lesson) {
      setFormState({
        title: lesson.title || '',
        planned_date: lesson.planned_date ? moment(lesson.planned_date).format('YYYY-MM-DD') : '',
        class_id: lesson.class_id || (sections.length > 0 ? sections[0].id : ''),
        status: lesson.status || 'planned'
      });
    } else {
      setFormState({
        title: '',
        planned_date: '',
        class_id: sections.length > 0 ? sections[0].id : '',
        status: 'planned'
      });
    }
  }, [lesson, sections]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave({ ...lesson, ...formState });
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4" dir="rtl">
      <Card className="bg-gray-800 text-white w-full max-w-lg">
        <CardHeader>
          <CardTitle>{lesson?.id ? 'تعديل الدرس' : 'إضافة درس جديد'}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Form fields */}
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-300">عنوان الدرس</label>
              <input
                type="text"
                name="title"
                id="title"
                value={formState.title || ''}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                placeholder="أدخل عنوان الدرس"
              />
            </div>
            <div>
              <label htmlFor="planned_date" className="block mb-2 text-sm font-medium text-gray-300">التاريخ المخطط</label>
              <input
                type="date"
                name="planned_date"
                id="planned_date"
                value={formState.planned_date || ''}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              />
            </div>
            <div>
              <label htmlFor="class_id" className="block mb-2 text-sm font-medium text-gray-300">القسم</label>
              <select
                name="class_id"
                id="class_id"
                value={formState.class_id || ''}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              >
                {sections.map(section => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>إلغاء</Button>
            <Button onClick={handleSave}>حفظ</Button>
          </div>
        </CardContent>
      </Card>
    </div>,
    document.getElementById('modal-root')
  );
};

const DateCellWrapper = ({ children, value, onRescheduleLesson, onScheduleSyllabusItem }) => {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: [CALENDAR_DRAG_TYPE, SYLLABUS_DRAG_TYPE],
      drop: (item, monitor) => {
        const date = moment(value).toDate();
        if (isNaN(date.getTime())) { console.error('Invalid date value:', value); return; }
        const newDateStr = moment(date).format('YYYY-MM-DD');
        const type = monitor.getItemType();
        if (type === CALENDAR_DRAG_TYPE) { onRescheduleLesson(item.id, newDateStr); } else if (type === SYLLABUS_DRAG_TYPE) { onScheduleSyllabusItem(item, newDateStr); }
      },
      collect: (monitor) => ({ isOver: monitor.isOver() }),
    }),
    [value, onRescheduleLesson, onScheduleSyllabusItem]
  );

  return (
    <div ref={drop} style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', minHeight: '100px', backgroundColor: isOver ? '#e3f2fd' : 'transparent', border: isOver ? '2px dashed #2196f3' : 'none', borderRadius: '4px', cursor: 'move', position: 'relative', zIndex: isOver ? 10 : 1, }}>
      {children}
    </div>
  );
};

const DraggableEvent = ({ event }) => {
  const [{ isDragging }, drag] = useDrag(() => ({ type: CALENDAR_DRAG_TYPE, item: { id: event.id }, collect: (monitor) => ({ isDragging: !!monitor.isDragging() }) }), [event.id]);
  return (
    <div ref={drag} style={{ backgroundColor: getEventColor(event.status), color: 'white', borderRadius: '4px', padding: '2px 6px', fontSize: '0.875rem', fontWeight: 500, cursor: 'move', opacity: isDragging ? 0.8 : 1, height: '100%', display: 'flex', alignItems: 'center', overflow: 'hidden' }} title={event.title}>
      {event.title}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const LessonLogPage = () => {
  const [allLessons, setAllLessons] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [selectedCalendarLesson, setSelectedCalendarLesson] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar');

  const fetchSections = useCallback(async () => { try { const response = await fetch(`${API_BASE_URL}/api/section-names`); const data = await response.json(); setSections(data); if (data.length > 0 && !selectedClass) setSelectedClass(data[0].id); } catch (error) { toast.error('فشل في جلب الأقسام'); } }, [selectedClass]);
  const fetchLessons = useCallback(async () => { if (!selectedClass) return; try { const response = await fetch(`${API_BASE_URL}/api/lessons/by-class/${selectedClass}`); const data = await response.json(); setAllLessons(data); } catch (error) { toast.error('فشل في جلب الدروس'); setAllLessons([]); } }, [selectedClass]);

  useEffect(() => { fetchSections(); }, [fetchSections]);
  useEffect(() => { fetchLessons(); }, [selectedClass, fetchLessons]);

  const calendarEvents = useMemo(() => allLessons.map(l => ({ ...l, start: new Date(l.planned_date || l.actual_date), end: new Date(l.planned_date || l.actual_date), allDay: true })), [allLessons]);

  const handleSaveCalendarLesson = async (lessonData) => {
    const url = lessonData.id && !String(lessonData.id).startsWith('syllabus-') ? `${API_BASE_URL}/api/lessons/${lessonData.id}` : `${API_BASE_URL}/api/lessons`;
    const method = lessonData.id && !String(lessonData.id).startsWith('syllabus-') ? 'PUT' : 'POST';
    const body = { ...lessonData };
    if (String(body.id).startsWith('syllabus-')) delete body.id;
    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error('Save failed');
      toast.success('تم حفظ الدرس بنجاح');
      fetchLessons();
    } catch (error) { toast.error('فشل في حفظ الدرس'); }
  };

  const handleRescheduleLesson = useCallback(async (lessonId, newDateStr) => {
    try {
      await fetch(`${API_BASE_URL}/api/lessons/${lessonId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planned_date: newDateStr, status: 'planned' }) });
      toast.success('تمت إعادة جدولة الدرس بنجاح');
      fetchLessons();
    } catch (error) { toast.error('فشل في إعادة جدولة الدرس'); }
  }, [fetchLessons]);

  const handleScheduleSyllabusItem = useCallback((syllabusItem, date) => {
      const newLesson = { title: syllabusItem.title, planned_date: date, class_id: selectedClass, status: 'planned', stages: syllabusItem.stages.map(s => ({...s, is_completed: false})) };
      handleSaveCalendarLesson(newLesson);
      toast.success(`تمت جدولة درس "${syllabusItem.title}"`);
  }, [selectedClass, handleSaveCalendarLesson]);

  const handleSelectCalendarEvent = (event) => { setSelectedCalendarLesson(allLessons.find(l => l.id === event.id)); setIsCalendarModalOpen(true); };
  const openNewCalendarLessonModal = () => { setSelectedCalendarLesson({}); setIsCalendarModalOpen(true); };

  const calendarComponents = useMemo(() => ({ 
      event: DraggableEvent,
      dateCellWrapper: (props) => <DateCellWrapper {...props} onRescheduleLesson={handleRescheduleLesson} onScheduleSyllabusItem={handleScheduleSyllabusItem} />
  }), [handleRescheduleLesson, handleScheduleSyllabusItem]);

  const calendarMessages = useMemo(() => ({ allDay: 'طوال اليوم', previous: 'السابق', next: 'التالي', today: 'اليوم', month: 'شهر', week: 'أسبوع', day: 'يوم', agenda: 'جدول الأعمال', date: 'التاريخ', time: 'الوقت', event: 'الحدث', noEventsInRange: 'لا توجد دروس في هذا النطاق' }), []);
  
  const calendarFormats = useMemo(() => ({
    dateFormat: 'DD-MM-YYYY',
    dayFormat: 'dddd DD-MM',
    agendaDateFormat: 'DD-MM-YYYY',
    monthHeaderFormat: 'MMMM YYYY',
    dayHeaderFormat: 'dddd, DD MMMM YYYY'
  }), []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-4 md:p-6" dir="rtl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
          <h1 className="text-3xl font-bold">سجل الدروس</h1>
          <div className="flex items-center gap-2">
            <select onChange={(e) => setSelectedClass(e.target.value)} value={selectedClass} className="p-2 border rounded-md">{sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <Button onClick={openNewCalendarLessonModal} className="flex items-center"><Plus className="w-5 h-5 ml-1" /> إضافة درس للتقويم</Button>
          </div>
        </div>
        <Tabs value={activeTab} id="lesson-tabs">
          <TabsHeader className="w-full md:w-1/2 lg:w-1/3 mx-auto" onChange={(value) => setActiveTab(value)}><Tab value="calendar"><CalendarIcon className="w-5 h-5 ml-2" />التقويم</Tab><Tab value="syllabus"><BookOpen className="w-5 h-5 ml-2" />البرنامج الدراسي</Tab></TabsHeader>
          <TabsBody>
            <TabPanel value="calendar" className="p-0">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <Calendar localizer={localizer} events={calendarEvents} startAccessor="start" endAccessor="end" style={{ height: 800 }} onSelectEvent={handleSelectCalendarEvent} components={calendarComponents} messages={calendarMessages} formats={calendarFormats} rtl={true} />
              </div>
            </TabPanel>
            <TabPanel value="syllabus"><SyllabusTab selectedClass={selectedClass} /></TabPanel>
          </TabsBody>
        </Tabs>
        <CalendarLessonModal isOpen={isCalendarModalOpen} onClose={() => setIsCalendarModalOpen(false)} onSave={handleSaveCalendarLesson} lesson={selectedCalendarLesson} sections={sections} />
      </div>
    </DndProvider>
  );
};

export default LessonLogPage;
