import React, { useState } from 'react';
import { Input, Button, Typography, Select, Option } from "@material-tailwind/react";
import { useCurriculum } from '../contexts/CurriculumContext';
import { useSections, Section } from '../contexts/SectionsContext'; // Import useSections and Section interface

interface SectionFormProps {
  onClose: () => void;
  addSection?: (section: Omit<Section, 'id'>) => Promise<Section>; // Changed return type
  updateSection?: (section: Section) => Promise<Section>; // Changed return type
  initialData?: Section | null;
}

function SectionForm({ onClose, addSection, updateSection, initialData }: SectionFormProps) {
  const [sectionName, setSectionName] = useState(initialData?.name || '');
  const [educationalLevel, setEducationalLevel] = useState(initialData?.educationalLevel || '');
  const [specialization, setSpecialization] = useState(initialData?.specialization || '');
  const [roomNumber, setRoomNumber] = useState(initialData?.roomNumber || '');
  const [teacherName, setTeacherName] = useState(initialData?.teacherName || '');
  const [courseName, setCourseName] = useState(initialData?.courseName || ''); // New state for courseName

  const { lessons } = useCurriculum(); // Get lessons to extract unique course names
  const { isLoading: sectionsLoading } = useSections(); // Get isLoading from useSections

  const educationalLevels = ['أولى إعدادي', 'ثانية إعدادي', 'ثالثة إعدادي', 'جذع مشترك', 'أولى بكالوريا', 'ثانية بكالوريا'];
  const specializations = ['علمي', 'أدبي', 'تقني', 'أصيل'];

  // Get unique course names from lessons
  const uniqueCourseNames = React.useMemo(() => {
    const names = Array.from(new Set(lessons.map(lesson => lesson.courseName).filter(Boolean)));
    return names;
  }, [lessons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionName || !educationalLevel || !specialization || !roomNumber || !teacherName) {
      alert('الرجاء ملء جميع الحقول.'); // Please fill in all fields.
      return;
    }

    const sectionData = {
      name: sectionName,
      educationalLevel,
      specialization,
      roomNumber,
      teacherName,
      courseName: courseName || undefined, // Include courseName
    };

    if (initialData) {
      // Editing existing section
      if (updateSection) {
        await updateSection({ ...initialData, ...sectionData });
      }
    } else {
      // Adding new section
      if (addSection) {
        await addSection(sectionData);
      }
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="p-4"> {/* Removed text-right from here */}
      <div className="mb-4">
        <Typography variant="small" color="blue-gray" className="mb-2 font-semibold text-right">
          اسم القسم
        </Typography>
        <Input
          placeholder="اسم القسم"
          value={sectionName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSectionName(e.target.value)}
          fullWidth
          className="text-right"
          labelProps={{ className: "hidden" }} // Hide default label
          crossOrigin={undefined}
        />
      </div>
      <div className="mb-4">
        <Typography variant="small" color="blue-gray" className="mb-2 font-semibold text-right">
          المستوى الدراسي
        </Typography>
        <Select
          value={educationalLevel}
          onChange={(value: string) => setEducationalLevel(value)}
          className="text-right"
          labelProps={{ className: "hidden" }}
          label="اختر المستوى الدراسي"
        >
          {educationalLevels.map((level) => (
            <Option key={level} value={level}>{level}</Option>
          ))}
        </Select>
      </div>
      <div className="mb-4">
        <Typography variant="small" color="blue-gray" className="mb-2 font-semibold text-right">
          التخصص
        </Typography>
        <Select
          value={specialization}
          onChange={(value: string) => setSpecialization(value)}
          className="text-right"
          labelProps={{ className: "hidden" }}
          label="اختر التخصص"
        >
          {specializations.map((spec) => (
            <Option key={spec} value={spec}>{spec}</Option>
          ))}
        </Select>
      </div>
      <div className="mb-4">
        <Typography variant="small" color="blue-gray" className="mb-2 font-semibold text-right">
          رقم القاعة/الغرفة
        </Typography>
        <Input
          placeholder="رقم القاعة/الغرفة"
          value={roomNumber}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomNumber(e.target.value)}
          fullWidth
          className="text-right"
          labelProps={{ className: "hidden" }}
          crossOrigin={undefined}
        />
      </div>
      <div className="mb-4">
        <Typography variant="small" color="blue-gray" className="mb-2 font-semibold text-right">
          اسم الأستاذ
        </Typography>
        <Input
          placeholder="اسم الأستاذ"
          value={teacherName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTeacherName(e.target.value)}
          fullWidth
          className="text-right"
          labelProps={{ className: "hidden" }}
          crossOrigin={undefined}
        />
      </div>
      {/* New Select for Course Name */}
      <div className="mb-4">
        <Typography variant="small" color="blue-gray" className="mb-2 font-semibold text-right">
          المقرر المخصص
        </Typography>
        <Select
          value={courseName}
          onChange={(value: string) => setCourseName(value)}
          className="text-right"
          labelProps={{ className: "hidden" }}
          label="اختر المقرر"
          disabled={sectionsLoading} // Disable when loading
        >
          <Option value="">لا يوجد</Option>
          {uniqueCourseNames.map((name) => (
            <Option key={name} value={name}>{name}</Option>
          ))}
        </Select>
      </div>
      <div className="mb-4">
        <Button
          variant="filled"
          fullWidth
          className="mb-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md font-semibold py-3 px-6 transition-colors duration-200"
        >
          إضافة جدول الحصص
        </Button>
      </div>
      <div className="flex justify-start gap-2">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md font-semibold py-3 px-6 transition-colors duration-200" disabled={sectionsLoading}> {/* Disable when loading */}
          {initialData ? 'تعديل' : 'إنشاء'}
        </Button>
        <Button variant="text" color="red" onClick={onClose} disabled={sectionsLoading}> {/* Disable when loading */}
          إلغاء
        </Button>
      </div>
    </form>
  );
}

export default SectionForm;
