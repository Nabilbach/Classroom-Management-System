import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Input, Select, Option, Card } from "@material-tailwind/react";
import { useSections } from '../contexts/SectionsContext';
import { useStudents } from '../contexts/StudentsContext';
import AddStudentForm from '../components/students/AddStudentForm';
import EditStudentModal from '../components/students/EditStudentModal';
import StudentCard from '../components/students/StudentCard';
import StudentTable from '../components/students/StudentTable';
import StudentDetailModal from '../components/students/StudentDetailModal';
import AssessmentModal from '../components/students/AssessmentModal';
import StudentTableSkeleton from '../components/students/StudentTableSkeleton';
import StudentCardSkeleton from '../components/students/StudentCardSkeleton';
import ExcelUploadModal from '../components/students/ExcelUploadModal';
import useDebounce from '../hooks/useDebounce';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  pathway_number: string;
  sectionId: number;
  gender: string;
  birth_date: string;
  class_order: number;
  score?: number;
}

// Memoized StudentCard and StudentTable for performance
const MemoizedStudentCard = React.memo(StudentCard);
const MemoizedStudentTable = React.memo(StudentTable);

function StudentManagement() {
  const { sections, currentSection, setCurrentSection } = useSections();
  const { students, deleteStudent, editStudent, isLoading, fetchStudents } = useStudents();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [badgeFilter, setBadgeFilter] = useState<string>('الكل');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isExcelUploadModalOpen, setIsExcelUploadModalOpen] = useState<boolean>(false);

  useEffect(() => {
    console.log("StudentManagement: Component Mounted or fetchStudents changed");
    fetchStudents();
  }, [fetchStudents]);

  // Set initial currentSection if not already set
  useEffect(() => {
    if (!currentSection && sections.length > 0) {
      setCurrentSection(sections[0]);
    }
  }, [sections, currentSection, setCurrentSection]);

  const finalFilteredStudents = useMemo(() => {
    const filteredBySection = currentSection
      ? students.filter((student) => student.sectionId === currentSection.id)
      : [];

    const trimmedSearch = debouncedSearchTerm.trim();

    if (!trimmedSearch) {
      return filteredBySection;
    }

    const lowerCaseSearchTerm = trimmedSearch.toLowerCase();

    return filteredBySection.filter((student) => {
      return (
        student.first_name.toLowerCase().includes(lowerCaseSearchTerm) ||
        student.last_name.toLowerCase().includes(lowerCaseSearchTerm) ||
        student.pathway_number.toLowerCase().includes(lowerCaseSearchTerm)
      );
    });

  }, [students, currentSection, debouncedSearchTerm]);

  const handleDeleteStudent = useCallback((studentId: number) => {
    if (window.confirm("هل أنت متأكد أنك تريد حذف هذا الطالب؟")) {
      deleteStudent(studentId);
    }
  }, [deleteStudent]);

  const handleEditStudent = useCallback((student: Student) => {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  }, []);

  const handleDetailStudent = useCallback((student: Student) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
  }, []);

  const handleAssessStudent = useCallback((student: Student) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(false); // Close detail modal if open
    setIsAssessmentModalOpen(true);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setBadgeFilter('الكل');
  }, []);

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h4" color="blue-gray">
          إدارة الطلاب
        </Typography>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddModalOpen(true)}>
            إضافة طالب جديد
          </Button>
          <Button onClick={() => setIsExcelUploadModalOpen(true)} variant="outlined">
            رفع Excel
          </Button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {sections.map((section) => (
          <Button
            key={section.id}
            variant={currentSection?.id === section.id ? "filled" : "outlined"}
            onClick={() => setCurrentSection(section)}
            className="flex-shrink-0"
          >
            {section.name}
          </Button>
        ))}
      </div>

      <div className="min-h-[500px]"> {/* Added min-height to prevent jitter */}
        {currentSection ? (
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <Typography variant="h5" color="blue-gray">
                طلاب قسم {currentSection.name}
              </Typography>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Input
                type="text"
                label="بحث..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
              <Button onClick={handleClearFilters} variant="outlined">
                مسح الفلاتر
              </Button>
            </div>

            {/* View Toggle */}
            <div className="flex justify-end gap-2 mb-4">
              <Button
                variant={viewMode === 'table' ? "filled" : "outlined"}
                onClick={() => setViewMode('table')}
                size="sm"
              >
                عرض الجدول
              </Button>
              <Button
                variant={viewMode === 'card' ? "filled" : "outlined"}
                onClick={() => setViewMode('card')}
                size="sm"
              >
                عرض البطاقات
              </Button>
            </div>

            {isLoading ? (
              viewMode === 'table' ? <StudentTableSkeleton /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(6)].map((_, i) => <StudentCardSkeleton key={i} />)}
                </div>
              )
            ) : viewMode === 'table' ? (
                <MemoizedStudentTable
                  students={finalFilteredStudents}
                  onEdit={handleEditStudent}
                  onDelete={handleDeleteStudent}
                  onDetail={handleDetailStudent}
                  onAssess={handleAssessStudent}
                />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {finalFilteredStudents.length > 0 ? (
                  finalFilteredStudents.map((student) => (
                    <MemoizedStudentCard
                      key={student.id}
                      student={student}
                      onEdit={handleEditStudent}
                      onDelete={handleDeleteStudent}
                      onDetail={handleDetailStudent}
                      onAssess={handleAssessStudent}
                    />
                  ))
                ) : (
                  <Typography className="px-4 py-2 text-center text-blue-gray-500 col-span-full">
                    لا يوجد طلاب في هذا القسم أو لا توجد نتائج للبحث/التصفية.
                  </Typography>
                )}
              </div>
            )}
          </Card>
        ) : (sections.length > 0 ? (
          <Typography variant="paragraph" color="blue-gray" className="mt-4">
            الرجاء اختيار قسم لعرض الطلاب.
          </Typography>
        ) : (
          <Typography variant="paragraph" color="blue-gray" className="mt-4">
            لا توجد أقسام متاحة. الرجاء إضافة قسم جديد أولاً.
          </Typography>
        ))}
      </div>

      <AddStudentForm isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <EditStudentModal isOpen={isEditModalOpen} onClose={() => {
        setIsEditModalOpen(false);
        setEditingStudent(null);
      }} student={editingStudent} />
      <StudentDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} student={selectedStudent} onAssess={handleAssessStudent} />
      <AssessmentModal isOpen={isAssessmentModalOpen} onClose={() => setIsAssessmentModalOpen(false)} studentId={selectedStudent?.id} />
      <ExcelUploadModal isOpen={isExcelUploadModalOpen} onClose={() => setIsExcelUploadModalOpen(false)} />
    </div>
  );
}

export default StudentManagement;
