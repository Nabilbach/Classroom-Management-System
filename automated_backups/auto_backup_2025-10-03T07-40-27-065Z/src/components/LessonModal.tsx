import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
  Input,
  Textarea,
  Button,
  Checkbox,
  IconButton,
} from "@material-tailwind/react";
import { FaTrash, FaTimes } from 'react-icons/fa';
import { useCurriculum } from '../contexts/CurriculumContext';
import { useSections } from '../contexts/SectionsContext';
import { Lesson, LessonStage } from '../contexts/CurriculumContext';
import { format } from 'date-fns';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'add' | 'edit';
  lesson?: Lesson;
  initialDate?: Date;
}

function LessonModal({ isOpen, onClose, mode, lesson, initialDate }: LessonModalProps) {
  const { addLesson, editLesson, deleteLesson, isLoading, lessons: allLessons } = useCurriculum();
  const { sections: availableSections } = useSections();

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [estimatedSessions, setEstimatedSessions] = useState<number>(1);
  const [assignedSections, setAssignedSections] = useState<string[]>([]);
  const [stages, setStages] = useState<LessonStage[]>([]);
  const [stageInput, setStageInput] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [showCourseSuggestions, setShowCourseSuggestions] = useState(false);

  const isViewMode = mode === 'view';

  useEffect(() => {
    if (isOpen) {
      if ((mode === 'edit' || mode === 'view') && lesson) {
        setTitle(lesson.title);
        setDescription(lesson.description || '');
        setDate(lesson.date ? format(new Date(lesson.date), 'yyyy-MM-dd') : '');
        setEstimatedSessions(lesson.estimatedSessions || 1);
        setAssignedSections(lesson.assignedSections || []);
        setStages(lesson.stages || []);
        setCourseName(lesson.courseName || '');
      } else if (mode === 'add') {
        setTitle('');
        setDescription('');
        setDate(initialDate ? format(initialDate, 'yyyy-MM-dd') : '');
        setEstimatedSessions(1);
        setAssignedSections([]);
        setStages([]);
        setCourseName('');
      }
    }
  }, [lesson, mode, isOpen, initialDate]);

  const handleSectionToggle = (sectionId: string) => {
    setAssignedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleStageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && stageInput.trim() !== '') {
      e.preventDefault();
      const newStage: LessonStage = {
        id: `stage-${Date.now()}`,
        title: stageInput.trim(),
        isCompleted: false,
      };
      setStages([...stages, newStage]);
      setStageInput('');
    }
  };

  const handleToggleStage = (stageId: string) => {
    setStages(stages.map(stage =>
      stage.id === stageId ? { ...stage, isCompleted: !stage.isCompleted } : stage
    ));
  };

  const handleRemoveStage = (stageId: string) => {
    setStages(stages.filter(stage => stage.id !== stageId));
  };

  const uniqueCourseNames = Array.from(new Set(allLessons.map(l => l.courseName).filter(Boolean))) as string[];
  const filteredCourseSuggestions = uniqueCourseNames.filter(name =>
    name.toLowerCase().includes(courseName.toLowerCase())
  );

  const handleSubmit = () => {
    if (!title || !date || assignedSections.length === 0) {
      alert('الرجاء ملء الحقول الإلزامية: العنوان، التاريخ، وتعيين قسم واحد على الأقل.');
      return;
    }

    const lessonData: Omit<Lesson, 'id'> = {
      title,
      description,
      date,
      estimatedSessions,
      assignedSections,
      stages,
      courseName: courseName || undefined, // Add courseName
      completionStatus: lesson?.completionStatus || {}, // Preserve status on edit, empty on add
      completionDate: lesson?.completionDate,
    };
    
    // When adding, initialize completion status for all assigned sections to 'planned'
    if (mode === 'add') {
        assignedSections.forEach(sectionId => {
            lessonData.completionStatus[sectionId] = 'planned';
        });
    }


    if (mode === 'edit' && lesson) {
      editLesson(lesson.id, lessonData);
    } else if (mode === 'add') {
      addLesson(lessonData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (lesson) {
      if (window.confirm(`هل أنت متأكد أنك تريد حذف الدرس: "${lesson.title}"؟`)) {
        deleteLesson(lesson.id);
        onClose();
      }
    }
  };

  const getDialogTitle = () => {
    if (mode === 'view') return 'تفاصيل الدرس';
    if (mode === 'edit') return 'تعديل الدرس';
    return 'إضافة درس جديد';
  };

  return (
    <Dialog open={isOpen} handler={onClose} size="md">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full text-right">
        <DialogHeader className="justify-end p-0 mb-4">
          <Typography variant="h5" color="blue-gray" className="text-xl font-bold">
            {getDialogTitle()}
          </Typography>
        </DialogHeader>
        <DialogBody divider className="p-0 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
          <div className="flex flex-col gap-4">
            <Input label="عنوان الدرس" value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} disabled={isViewMode} crossOrigin={undefined} />
            <Input label="التاريخ" type="date" value={date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} disabled={isViewMode} crossOrigin={undefined} />
            <Input label="عدد الحصص المتوقعة" type="number" value={estimatedSessions} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEstimatedSessions(Number(e.target.value))} disabled={isViewMode} crossOrigin={undefined} />
            <Textarea label="وصف الدرس" value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} disabled={isViewMode} />

            <div className="relative mt-4">
              <Input
                label="اسم المقرر"
                value={courseName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setCourseName(e.target.value);
                  setShowCourseSuggestions(true);
                }}
                onFocus={() => setShowCourseSuggestions(true)}
                onBlur={() => setTimeout(() => setShowCourseSuggestions(false), 100)}
                disabled={isViewMode}
                crossOrigin={undefined}
              />
              {showCourseSuggestions && filteredCourseSuggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {filteredCourseSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onMouseDown={() => {
                        setCourseName(suggestion);
                        setShowCourseSuggestions(false);
                      }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4">
              <Typography variant="h6" color="blue-gray">الأقسام المعنية</Typography>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {availableSections.map(section => (
                  <Checkbox
                    key={section.id}
                    label={section.name}
                    checked={assignedSections.includes(section.id)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSectionToggle(section.id)}
                    disabled={isViewMode}
                    crossOrigin={undefined}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4">
              <Typography variant="h6" color="blue-gray">مراحل الدرس</Typography>
              {!isViewMode && (
                <Input
                  label="أضف مرحلة ثم اضغط Enter"
                  value={stageInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStageInput(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleStageInputKeyDown(e)}
                  disabled={isViewMode}
                  crossOrigin={undefined}
                />
              )}
              <div className="mt-2 space-y-2">
                {stages.map((stage) => (
                  <div key={stage.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Typography variant="small" color="blue-gray" className="font-semibold">
                          {stages.indexOf(stage) + 1}.
                      </Typography>
                      <Checkbox label={stage.title} checked={stage.isCompleted} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleToggleStage(stage.id)} disabled={isViewMode} crossOrigin={undefined} />
                    </div>
                    {!isViewMode && (
                      <IconButton size="sm" variant="text" className="rounded-full" onClick={() => handleRemoveStage(stage.id)}>
                        <FaTimes />
                      </IconButton>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </DialogBody>
        <DialogFooter className="justify-between p-0 mt-4">
          <div>
            {!isViewMode && (
              <Button variant="gradient" color="green" onClick={handleSubmit} disabled={isLoading}>
                حفظ
              </Button>
            )}
            <Button variant="text" color="blue-gray" onClick={onClose} className="mr-2">
              {isViewMode ? 'إغلاق' : 'إلغاء'}
            </Button>
          </div>
          {mode === 'edit' && (
            <Button variant="filled" color="red" onClick={handleDelete} disabled={isLoading}>
              حذف الدرس
            </Button>
          )}
        </DialogFooter>
      </div>
    </Dialog>
  );
}

export default LessonModal;