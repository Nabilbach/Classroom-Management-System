import React, { useState, useEffect } from 'react';
import { Typography, Card, CardBody, Input, Button, Select, Option } from "@material-tailwind/react";
import { useSections } from '../contexts/SectionsContext'; // Corrected import path

interface ScheduleEntry {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  sectionId: string;
  subject: string;
  teacher: string;
}

function Schedule() {
  const { sections } = useSections();
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>(() => {
    const savedSchedule = localStorage.getItem('classSchedule');
    return savedSchedule ? JSON.parse(savedSchedule) : [];
  });

  const [day, setDay] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [teacher, setTeacher] = useState<string>('');

  const daysOfWeek = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

  useEffect(() => {
    localStorage.setItem('classSchedule', JSON.stringify(scheduleEntries));
  }, [scheduleEntries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!day || !startTime || !endTime || !selectedSectionId || !subject || !teacher) {
      alert('الرجاء ملء جميع الحقول.');
      return;
    }
    const newEntry: ScheduleEntry = {
      id: Date.now().toString(),
      day,
      startTime,
      endTime,
      sectionId: selectedSectionId,
      subject,
      teacher,
    };
    setScheduleEntries((prevEntries) => [...prevEntries, newEntry]);
    setDay('');
    setStartTime('');
    setEndTime('');
    setSelectedSectionId('');
    setSubject('');
    setTeacher('');
  };

  const getSectionName = (id: string) => {
    const section = sections.find(s => s.id === id);
    return section ? section.name : 'غير معروف';
  };

  return (
    <div>
      <Typography variant="h4" color="blue-gray" className="mb-4">
        جدول الحصص
      </Typography>

      <Card className="p-4 mb-6">
        <Typography variant="h6" color="blue-gray" className="mb-4">
          إضافة حصة جديدة
        </Typography>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Select
              label="اليوم"
              value={day}
              onChange={(value: string) => setDay(value)}
            >
              {daysOfWeek.map((d) => (
                <Option key={d} value={d}>{d}</Option>
              ))}
            </Select>
          </div>
          <div className="mb-4">
            <Input
              type="time"
              label="وقت البدء"
              value={startTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="mb-4">
            <Input
              type="time"
              label="وقت الانتهاء"
              value={endTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="mb-4">
            <Select
              label="القسم"
              value={selectedSectionId}
              onChange={(value: string) => setSelectedSectionId(value)}
            >
              {sections.map((section) => (
                <Option key={section.id} value={section.id}>{section.name}</Option>
              ))}
            </Select>
          </div>
          <div className="mb-4">
            <Input
              label="المادة"
              placeholder="اسم المادة"
              value={subject}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="mb-4">
            <Input
              label="الأستاذ"
              placeholder="اسم الأستاذ"
              value={teacher}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTeacher(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit" fullWidth>
            إضافة حصة
          </Button>
        </form>
      </Card>

      <Typography variant="h5" color="blue-gray" className="mb-4">
        الجدول الأسبوعي
      </Typography>
      <div className="grid grid-cols-1 gap-4">
        {daysOfWeek.map((d) => (
          <Card key={d} className="p-4">
            <Typography variant="h6" color="blue-gray" className="mb-2">{d}</Typography>
            {scheduleEntries.filter(entry => entry.day === d).length > 0 ? (
              <List>
                {scheduleEntries.filter(entry => entry.day === d).map((entry) => (
                  <ListItem key={entry.id}>
                    {entry.startTime} - {entry.endTime} | {getSectionName(entry.sectionId)} | {entry.subject} | {entry.teacher}
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="paragraph" color="blue-gray">لا توجد حصص لهذا اليوم.</Typography>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Schedule;
