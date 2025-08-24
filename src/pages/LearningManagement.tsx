import { useState } from 'react';
import { Typography, Card, CardBody, Input, Button, Textarea, IconButton } from "@material-tailwind/react";
import { FaTrash } from 'react-icons/fa';
import CurriculumTab from '../components/CurriculumTab';
import { useLessonLog } from '../contexts/LessonLogContext';
import SmartCalendar from '../components/SmartCalendar';

function LessonLog() {
  const { lessonLogs, addLessonLog, removeLessonLog, isLoading } = useLessonLog();
  const [date, setDate] = useState('');
  const [topic, setTopic] = useState('');
  const [objectives, setObjectives] = useState('');
  const [notes, setNotes] = useState('');

  const [activeView, setActiveView] = useState<'calendar' | 'log' | 'curriculum'>('calendar');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !topic || !objectives) {
      alert('الرجاء ملء الحقول الإلزامية: التاريخ، الموضوع، الأهداف.');
      return;
    }
    addLessonLog({ date, topic, objectives, notes });
    setDate('');
    setTopic('');
    setObjectives('');
    setNotes('');
  };

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h4" color="blue-gray">
          Learning Management
        </Typography>
        <div className="flex gap-2">
          <Button
            variant={activeView === 'calendar' ? "filled" : "outlined"}
            onClick={() => setActiveView('calendar')}
          >
            تقويم ذكي
          </Button>
          <Button
            variant={activeView === 'log' ? "filled" : "outlined"}
            onClick={() => setActiveView('log')}
          >
            سجل الدروس
          </Button>
          <Button
            variant={activeView === 'curriculum' ? "filled" : "outlined"}
            onClick={() => setActiveView('curriculum')}
          >
            البرنامج الدراسي
          </Button>
        </div>
      </div>

      {activeView === 'calendar' ? (
        <SmartCalendar />
      ) : activeView === 'log' ? (
        <>
          <Card className="p-4 mb-6">
            <Typography variant="h6" color="blue-gray" className="mb-4">
              إضافة درس جديد
            </Typography>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <Input
                  type="date"
                  label="التاريخ"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="mb-4">
                <Input
                  label="الموضوع"
                  placeholder="موضوع الدرس"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="mb-4">
                <Textarea
                  label="الأهداف"
                  placeholder="أهداف الدرس"
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="mb-4">
                <Textarea
                  label="ملاحظات"
                  placeholder="ملاحظات إضافية"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button type="submit" fullWidth disabled={isLoading}>
                {isLoading ? 'جاري الإضافة...' : 'إضافة درس'}
              </Button>
            </form>
          </Card>

          <Typography variant="h5" color="blue-gray" className="mb-4">
            الدروس المسجلة
          </Typography>
          {isLoading && <p>جاري تحميل الدروس...</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessonLogs.map((lesson) => (
              <Card key={lesson.id} className="p-4 flex flex-col">
                <CardBody className="flex-grow">
                  <Typography variant="h6" color="blue-gray" className="mb-2">
                    الموضوع: {lesson.topic}
                  </Typography>
                  <Typography variant="paragraph" color="blue-gray">
                    التاريخ: {lesson.date}
                  </Typography>
                  <Typography variant="paragraph" color="blue-gray">
                    الأهداف: {lesson.objectives}
                  </Typography>
                  {lesson.notes && (
                    <Typography variant="paragraph" color="blue-gray">
                      ملاحظات: {lesson.notes}
                    </Typography>
                  )}
                </CardBody>
                <div className="p-4 pt-0 text-left">
                  <IconButton color="red" onClick={() => removeLessonLog(lesson.id)}>
                    <FaTrash />
                  </IconButton>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <CurriculumTab />
      )}
    </div>
  );
}

export default LessonLog;