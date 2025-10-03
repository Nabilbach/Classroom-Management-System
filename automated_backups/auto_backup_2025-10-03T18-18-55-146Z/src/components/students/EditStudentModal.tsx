import React, { useState, useEffect } from 'react';
import { Input, Button, Typography, Select, Option, Dialog, DialogHeader, DialogBody, DialogFooter } from "@material-tailwind/react";
import { useStudents } from '../../contexts/StudentsContext';
import { useSections } from '../../contexts/SectionsContext';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  trackNumber: string;
  sectionId: string;
  gender: string;
  dateOfBirth: string;
  studentNumberInSection?: number; // Changed to optional
  badge: string;
}

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

function EditStudentModal({ isOpen, onClose, student }: EditStudentModalProps) {
  const { editStudent } = useStudents();
  const { sections } = useSections();

  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [trackNumber, setTrackNumber] = useState<string>('');
  const [sectionId, setSectionId] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [badge, setBadge] = useState<string>('لا يوجد');
  const [error, setError] = useState<string>('');

  const badgeOptions = ['لا يوجد', 'جيد', 'ممتاز', 'يحتاج لتحسين'];
  const genderOptions = ['ذكر', 'أنثى'];

  useEffect(() => {
    if (student) {
      setFirstName(student.firstName || '');
      setLastName(student.lastName || '');
      setTrackNumber(student.trackNumber || '');
      setSectionId(student.sectionId || '');
      setGender(student.gender || '');
      setDateOfBirth(student.dateOfBirth || '');
      setBadge(student.badge || 'لا يوجد');
    } else {
      // Reset form when modal is closed or no student is passed
      setFirstName('');
      setLastName('');
      setTrackNumber('');
      setSectionId('');
      setGender('');
      setDateOfBirth('');
      setBadge('لا يوجد');
    }
    setError(''); // Clear error on student change or modal open/close
  }, [student, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !trackNumber.trim() || !sectionId.trim() || !gender.trim() || !dateOfBirth.trim() || !badge.trim()) {
      setError('الرجاء ملء جميع الحقول المطلوبة.');
      return;
    }
    if (student) {
      setError('');
      editStudent(student.id, {
        firstName,
        lastName,
        trackNumber,
        sectionId,
        gender,
        dateOfBirth,
        badge,
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} handler={onClose}>
      <DialogHeader>تعديل بيانات الطالب</DialogHeader>
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
            onChange={(value: string | undefined) => setSectionId(value || '')}
            error={!!error && !sectionId.trim()}
          >
            {sections.map((section) => (
              <Option key={section.id} value={section.id}>{section.name}</Option>
            ))}
          </Select>
          <Select
            label="النوع"
            value={gender}
            onChange={(value: string | undefined) => setGender(value || '')}
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
          {/* Removed رقم التلميذ في القسم input */}
          <Select
            label="الشارة"
            value={badge}
            onChange={(value: string | undefined) => setBadge(value || 'لا يوجد')}
            error={!!error && !badge.trim()}
          >
            {badgeOptions.map((option) => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Select>
          {error && <Typography variant="small" color="red">{error}</Typography>}
        </form>
      </DialogBody>
      <DialogFooter>
        <Button variant="text" color="red" onClick={onClose} className="mr-1">
          إلغاء
        </Button>
        <Button variant="gradient" color="green" onClick={handleSubmit}>
          حفظ التغييرات
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default EditStudentModal;