import React, { useEffect, useState } from 'react';
import { Input, Button, Typography, Select, Option, Dialog, DialogHeader, DialogBody, DialogFooter } from "@material-tailwind/react";
import { useStudents } from '../../contexts/StudentsContext';
import { useSections } from '../../contexts/SectionsContext';

interface AddStudentFormProps {
  isOpen: boolean;
  onClose: () => void;
}

function AddStudentForm({ isOpen, onClose }: AddStudentFormProps) {
  const { addStudent, students } = useStudents();
  const { sections } = useSections();

  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [trackNumber, setTrackNumber] = useState<string>('');
  const [sectionId, setSectionId] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [classOrder, setClassOrder] = useState<string>('');
  const [error, setError] = useState<string>('');

  const genderOptions = ['ذكر', 'أنثى'];

  // When section changes, prefill class order with next available number in that section
  useEffect(() => {
    if (!sectionId) {
      setClassOrder('');
      return;
    }
  const sid = sectionId;
  const existing = students.filter((s) => String(s.sectionId) === String(sid));
    const maxOrder = existing.length ? Math.max(...existing.map((s) => s.classOrder || 0)) : 0;
    // Only set default if field is empty or the section changed to a different one
    setClassOrder((prev) => (prev ? prev : String(maxOrder + 1)));
  }, [sectionId, students]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !trackNumber.trim() || !sectionId.trim() || !gender.trim() || !dateOfBirth.trim() || !classOrder.trim()) {
      setError('الرجاء ملء جميع الحقول المطلوبة.');
      return;
    }
    const classOrderNum = parseInt(classOrder, 10);
    if (!Number.isFinite(classOrderNum) || classOrderNum < 1) {
      setError('رقم التلميذ في القسم يجب أن يكون عدداً صحيحاً موجباً.');
      return;
    }
    setError('');
    addStudent({
      firstName,
      lastName,
      pathwayNumber: trackNumber,
      sectionId: sectionId,
      gender,
      birthDate: dateOfBirth,
      classOrder: classOrderNum,
    } as any);
    onClose(); // Close modal on successful submission
    setFirstName('');
    setLastName('');
    setTrackNumber('');
    setSectionId('');
    setGender('');
    setDateOfBirth('');
    setClassOrder('');
  };

  return (
    <Dialog open={isOpen} handler={onClose} dir="rtl">
      <DialogHeader>إضافة طالب جديد</DialogHeader>
      <DialogBody divider>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="text"
            label="الاسم الأول"
            value={firstName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
            crossOrigin={undefined}
            error={!!error && !firstName.trim()}
          />
          <Input
            type="text"
            label="الاسم العائلي"
            value={lastName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
            crossOrigin={undefined}
            error={!!error && !lastName.trim()}
          />
          <Input
            type="text"
            label="رمز مسار"
            value={trackNumber}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrackNumber(e.target.value)}
            crossOrigin={undefined}
            error={!!error && !trackNumber.trim()}
          />
          <Select
            label="القسم"
            value={sectionId}
            onChange={(value) => setSectionId(value ?? '')}
            error={!!error && !sectionId.trim()}
          >
            {sections.map((section) => (
              <Option key={section.id} value={String(section.id)}>{section.name}</Option>
            ))}
          </Select>
          <Input
            type="number"
            label="رقم التلميذ في القسم"
            value={classOrder}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClassOrder(e.target.value)}
            crossOrigin={undefined}
            error={!!error && !classOrder.trim()}
          />
          <Select
            label="النوع"
            value={gender}
            onChange={(value) => setGender(value ?? '')}
            error={!!error && !gender.trim()}
          >
            {genderOptions.map((option) => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Select>
          <Input
            type="date"
            label="تاريخ الازدياد"
            value={dateOfBirth}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateOfBirth(e.target.value)}
            crossOrigin={undefined}
            error={!!error && !dateOfBirth.trim()}
          />
          {error && <Typography variant="small" color="red">{error}</Typography>}
        </form>
      </DialogBody>
      <DialogFooter>
        <Button variant="text" color="red" onClick={onClose} className="mr-1">
          إلغاء
        </Button>
        <Button variant="gradient" color="green" onClick={handleSubmit}>
          إضافة طالب
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default AddStudentForm;