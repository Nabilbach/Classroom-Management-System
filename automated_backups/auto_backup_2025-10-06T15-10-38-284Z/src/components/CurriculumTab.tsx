import React, { useState, useMemo, useCallback } from 'react';
import { Typography, Button, Card, CardBody, Input, Select, Option, IconButton } from "@material-tailwind/react";
import { useCurriculum, Lesson } from '../contexts/CurriculumContext';
import { useSections } from '../contexts/SectionsContext';
import ProgressStatsCard from './ProgressStatsCard';
import LessonModal from './LessonModal';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaPlus, FaEdit, FaTrash, FaBars } from 'react-icons/fa';
import * as XLSX from 'xlsx'; // Import xlsx library

// SortableItem component for D&D
function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-gray-50 p-3 rounded-lg shadow-sm flex items-center justify-between mb-2 cursor-grab">
      {children}
      <FaBars className="text-gray-400" />
    </li>
  );
}

function CurriculumTab() {
  const { lessons, reorderLessons, deleteLesson, isLoading, addLesson } = useCurriculum(); // Added addLesson for import
  const { sections } = useSections();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false); // New state
  const [editingLesson, setEditingLesson] = useState<Lesson | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterCourse, setFilterCourse] = useState<string>('all'); // New state for course filter

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddLesson = () => {
    setEditingLesson(undefined);
    setIsModalOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    if (isActionInProgress) return; // Prevent multiple clicks
    setIsActionInProgress(true); // Set action in progress
    setEditingLesson(lesson);
    setIsModalOpen(true);
    // Reset isActionInProgress when modal closes or action completes
    // This will be handled by the LessonModal's onClose or handleSubmit
  };

  const handleDeleteLesson = async (id: string) => { // Made async
    if (isActionInProgress) return; // Prevent multiple clicks
    setIsActionInProgress(true); // Set action in progress

    if (window.confirm('هل أنت متأكد أنك تريد حذف هذا الدرس؟')) {
      try {
        await deleteLesson(id); // Await the delete operation
      } catch (error) {
        console.error("Error deleting lesson:", error);
      } finally {
        setIsActionInProgress(false); // Reset action in progress
      }
    } else {
      setIsActionInProgress(false); // Reset if user cancels confirm dialog
    }
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = lessons.findIndex(lesson => lesson.id === active.id);
      const newIndex = lessons.findIndex(lesson => lesson.id === over?.id);
      const newOrder = arrayMove(lessons, oldIndex, newIndex).map(lesson => lesson.id);
      reorderLessons(newOrder);
    }
  }, [lessons, reorderLessons]);

  const uniqueCourseNames = useMemo(() => {
    const names = Array.from(new Set(lessons.map(lesson => lesson.courseName).filter(Boolean)));
    return names;
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    let filtered = lessons;

    // Search
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        lesson =>
          lesson.title.toLowerCase().includes(lowerCaseSearchTerm) ||
          lesson.description.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(lesson =>
        Object.values(lesson.completionStatus).some(status => status === filterStatus)
      );
    }

    // Filter by section
    if (filterSection !== 'all') {
      filtered = filtered.filter(lesson =>
        lesson.assignedSections.includes(filterSection)
      );
    }

    // Filter by courseName
    if (filterCourse === 'uncategorized') {
      filtered = filtered.filter(lesson => !lesson.courseName);
    } else if (filterCourse !== 'all') {
      filtered = filtered.filter(lesson => lesson.courseName === filterCourse);
    }

    return filtered;
  }, [lessons, searchTerm, filterStatus, filterSection, filterCourse]);

  const handleExportToExcel = () => {
    const dataToExport = lessons.map(lesson => ({
      Title: lesson.title,
      Description: lesson.description,
      EstimatedSessions: lesson.estimatedSessions,
      CourseName: lesson.courseName || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lessons");
    XLSX.writeFile(wb, "lessons.xlsx");
  };

  const handleImportFromExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        json.forEach((row: any) => {
          // Assuming column names in Excel match Lesson properties
          const newLessonData: Omit<Lesson, 'id'> = {
            title: row.Title || '',
            description: row.Description || '',
            date: new Date().toISOString().split('T')[0], // Default to today's date
            estimatedSessions: row.EstimatedSessions || 1,
            assignedSections: [], // Default to empty array
            completionStatus: {}, // Default to empty object
            stages: [], // Default to empty array
            courseName: row.CourseName || undefined,
          };
          addLesson(newLessonData);
        });
        alert('تم استيراد الدروس بنجاح!');
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div dir="rtl" className="p-4 bg-gray-50 min-h-screen">
      <Typography variant="h4" color="blue-gray" className="mb-6 font-bold text-right">
        البرنامج الدراسي
      </Typography>

      {/* Progress Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {sections.map(section => (
          <ProgressStatsCard
            key={section.id}
            sectionId={section.id}
            sectionName={section.name}
          />
        ))}
      </div>

      {/* Search and Filter */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Input
            label="بحث عن درس..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full"
            disabled={isLoading}
            crossOrigin={undefined} // Added crossOrigin prop
          />
          <Select
            label="تصفية حسب الحالة"
            value={filterStatus}
            onChange={(val: string | undefined) => setFilterStatus(val || 'all')}
            className="w-full"
            disabled={isLoading}
          >
            <Option value="all">الكل</Option>
            <Option value="planned">مخطط</Option>
            <Option value="in-progress">قيد الإنجاز</Option>
            <Option value="completed">مكتمل</Option>
          </Select>
          <Select
            label="تصفية حسب القسم"
            value={filterSection}
            onChange={(val: string | undefined) => setFilterSection(val || 'all')}
            className="w-full"
            disabled={isLoading}
          >
            <Option value="all">الكل</Option>
            {sections.map(section => (
              <Option key={section.id} value={section.id}>{section.name}</Option>
            ))}
          </Select>
          {/* New Select for Course Filter */}
          <Select
            label="تصفية حسب المقرر"
            value={filterCourse}
            onChange={(val: string | undefined) => setFilterCourse(val || 'all')}
            className="w-full"
            disabled={isLoading}
          >
            <Option value="all">جميع الدروس</Option>
            <Option value="uncategorized">دروس غير مصنفة</Option>
            {uniqueCourseNames.map(name => (
              <Option key={name} value={name}>{name}</Option>
            ))}
          </Select>
        </div>
        <Button onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterSection('all'); setFilterCourse('all'); }} variant="outlined" className="w-full md:w-auto" disabled={isLoading}>
          مسح الفلاتر
        </Button>
      </Card>

      {/* Lessons List */}
      <Card className="p-4 mb-6">
        <CardBody className="p-0">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h6" color="blue-gray" className="text-right">
              الدروس الحالية:
            </Typography>
            <div className="flex gap-2">
              <Button onClick={handleAddLesson} className="bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md font-semibold py-2 px-4 transition-colors duration-200" disabled={isLoading || isActionInProgress}>
                <FaPlus className="inline ml-2" /> إضافة درس جديد
              </Button>
              <Button onClick={handleExportToExcel} className="bg-green-600 hover:bg-green-700 rounded-lg shadow-md font-semibold py-2 px-4 transition-colors duration-200" disabled={isLoading || isActionInProgress}>
                تصدير إلى Excel
              </Button>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleImportFromExcel(event)}
                style={{ display: 'none' }}
                id="import-excel-file"
              />
              <label
                htmlFor="import-excel-file"
                className="inline-flex items-center justify-center bg-purple-600 hover:bg-purple-700 rounded-lg shadow-md font-semibold py-2 px-4 transition-colors duration-200 cursor-pointer text-white"
                disabled={isLoading || isActionInProgress} // Added disabled prop
              >
                استيراد من Excel
              </label>
            </div>
          </div>
          {
            isLoading ? (
              <Typography className="text-gray-700 text-right">جاري تحميل الدروس...</Typography>
            ) : filteredLessons.length > 0 ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filteredLessons.map(lesson => lesson.id)} strategy={verticalListSortingStrategy}>
                  <ul className="list-none p-0">
                    {filteredLessons.map((lesson) => (
                      <SortableItem key={lesson.id} id={lesson.id}>
                        <div className="flex-grow text-right">
                          <Typography variant="h6" color="blue-gray">{lesson.title}</Typography>
                          <Typography variant="small" color="gray">{lesson.description}</Typography>
                          <Typography variant="small" color="gray">حصص تقديرية: {lesson.estimatedSessions}</Typography>
                          {lesson.courseName && (
                            <Typography variant="small" color="gray">المقرر: {lesson.courseName}</Typography>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <IconButton variant="text" color="blue" onClick={(e) => { e.stopPropagation(); handleEditLesson(lesson); }} disabled={isLoading || isActionInProgress}>
                            <FaEdit />
                          </IconButton>
                          <IconButton variant="text" color="red" onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id); }} disabled={isLoading || isActionInProgress}>
                            <FaTrash />
                          </IconButton>
                        </div>
                      </SortableItem>
                    ))
                  }
                  </ul>
                </SortableContext>
              </DndContext>
            ) : (
              <Typography className="text-gray-700 text-right">لا توجد دروس متاحة أو لا توجد نتائج للبحث/التصفية.</Typography>
            )
          }
        </CardBody>
      </Card>

      <LessonModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setIsActionInProgress(false); }} // Reset isActionInProgress
        mode={editingLesson ? 'edit' : 'add'} // Added mode prop
        lesson={editingLesson}
      />
    </div>
  );
}

export default CurriculumTab;