import React, { useState, useMemo, useCallback } from 'react';
import { Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, TextField, Select, MenuItem, IconButton, CircularProgress } from '@mui/material';
import { FaUsers, FaChalkboard, FaChalkboardTeacher, FaUserGraduate, FaPlus, FaSearch, FaUndo, FaEye, FaEdit, FaTrash, FaChartPie } from 'react-icons/fa';
import SectionForm from '../components/SectionForm';
import { useSections, Section } from '../contexts/SectionsContext';
import { useStudents } from '../contexts/StudentsContext';
import { Link } from 'react-router-dom';

// A reusable stat card component
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
}
const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => (
  <Card className={`shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 ${color}`}>
    <CardContent className="p-4 text-right">
      <div className="flex justify-between items-center">
        <div className="text-white p-3 rounded-full bg-blue-gray-800/80">
          {icon}
        </div>
        <div>
          <Typography variant="small" className="text-blue-gray-500 font-semibold">{title}</Typography>
          <Typography variant="h4" color="blue-gray">{value}</Typography>
        </div>
      </div>
    </CardContent>
  </Card>
);

function SectionManagement() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteStudentsModalOpen, setIsDeleteStudentsModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState<string>('');
  const [confirmModalAction, setConfirmModalAction] = useState<(() => void) | null>(null);
  const { sections, addSection, deleteSection, editSection, isLoading, deleteAllSections } = useSections();
  const { students, fetchStudents } = useStudents();

  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');

  // Memoized calculations for quick stats
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const totalSections = sections.length;
    const uniqueTeachers = [...new Set(sections.map(s => s.teacherName))].length;
    let mostCrowded = { name: 'N/A', count: 0 };
    if (sections.length > 0 && students.length > 0) {
        const studentCounts = sections.map(section => ({ name: section.name, count: students.filter(st => st.sectionId === section.id).length }));
        if (studentCounts.length > 0) {
            mostCrowded = studentCounts.reduce((max, current) => current.count > max.count ? current : max, studentCounts[0]);
        }
    }
    return { totalStudents, totalSections, uniqueTeachers, mostCrowded };
  }, [students, sections]);

  // Memoized filtering logic
  const filteredSections = useMemo(() => {
    return sections.filter(section => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = (
        section.name.toLowerCase().includes(searchLower) ||
        section.teacherName.toLowerCase().includes(searchLower) ||
        section.roomNumber.toLowerCase().includes(searchLower)
      );
      const matchesLevel = levelFilter === 'all' || section.educationalLevel === levelFilter;
      const matchesSpecialty = specialtyFilter === 'all' || section.specialization === specialtyFilter;
      return matchesSearch && matchesLevel && matchesSpecialty;
    });
  }, [sections, searchQuery, levelFilter, specialtyFilter]);

  const handleAddModalOpen = () => setIsAddModalOpen(!isAddModalOpen);
  const handleEditModalOpen = () => setIsEditModalOpen(!isEditModalOpen);
  const handleDetailModalOpen = () => setIsDetailModalOpen(!isDetailModalOpen);
  const handleDeleteStudentsModalOpen = () => setIsDeleteStudentsModalOpen(!isDeleteStudentsModalOpen);

  const handleConfirmModalOpen = useCallback((message: string, action: () => void) => {
    setConfirmModalMessage(message);
    setConfirmModalAction(() => action); // Use a function to set the action
    setIsConfirmModalOpen(true);
  }, []);

  const handleConfirmModalClose = useCallback(() => {
    setIsConfirmModalOpen(false);
    setConfirmModalMessage('');
    setConfirmModalAction(null);
  }, []);

  const handleConfirmAction = useCallback(() => {
    if (confirmModalAction) {
      confirmModalAction();
    }
    handleConfirmModalClose();
  }, [confirmModalAction, handleConfirmModalClose]);

  const handleEditClick = (section: Section) => {
    setSelectedSection(section);
    setIsEditModalOpen(true);
  };

  const handleDeleteStudentsForSection = async () => {
    if (selectedSection) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/sections/${selectedSection.id}/students`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete students for section');
        fetchStudents();
        handleDeleteStudentsModalOpen();
      } catch (error) {
        console.error('Error deleting students for section:', error);
      }
    }
  };

  const handleViewDetailsClick = (section: Section) => {
    setSelectedSection(section);
    setIsDetailModalOpen(true);
  };

  const handleDeleteSection = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد أنك تريد حذف القسم "${name}"? هذا الإجراء لا يمكن التراجع عنه.`)) {
      deleteSection(id);
    }
  };

  const handleDeleteAllSections = useCallback(() => {
    handleConfirmModalOpen(
      "هل أنت متأكد أنك تريد حذف جميع الأقسام؟ هذا الإجراء لا يمكن التراجع عنه.",
      async () => {
        try {
          await deleteAllSections();
          alert("تم حذف جميع الأقسام بنجاح.");
        } catch (error) {
          console.error("Error deleting all sections:", error);
          alert("فشل في حذف جميع الأقسام.");
        }
      }
    );
  }, [deleteAllSections, handleConfirmModalOpen]);

  const resetFilters = () => {
    setSearchQuery('');
    setLevelFilter('all');
    setSpecialtyFilter('all');
  };

  return (
    <div dir="rtl" className="p-4 font-cairo">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4" color="blue-gray">إدارة الأقسام</Typography>
        <Button onClick={handleAddModalOpen} variant="contained" color="primary" className="flex items-center gap-2 hover:shadow-lg hover:scale-105 transform transition-all duration-200" disabled={isLoading}><FaPlus /> إضافة قسم جديد</Button>
        <Button onClick={handleDeleteAllSections} color="error" variant="outlined" className="flex items-center gap-2" disabled={isLoading}><FaTrash /> حذف جميع الأقسام</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<FaUsers size={24} />} title="إجمالي التلاميذ" value={stats.totalStudents} color="border-t-blue-500" />
        <StatCard icon={<FaChalkboard size={24} />} title="عدد الأقسام" value={stats.totalSections} color="border-t-green-500" />
        <StatCard icon={<FaChalkboardTeacher size={24} />} title="عدد المعلمين" value={stats.uniqueTeachers} color="border-t-orange-500" />
        <StatCard icon={<FaUserGraduate size={24} />} title="القسم الأكثر ازدحامًا" value={`${stats.mostCrowded.name} (${stats.mostCrowded.count})`} color="border-t-red-500" />
      </div>

      <Card className="mb-8 p-4 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2"><TextField label="ابحث..." InputProps={{ endAdornment: <FaSearch /> }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} fullWidth /></div>
          <Select label="المستوى" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value as string)} fullWidth><MenuItem value="all">الكل</MenuItem><MenuItem value="الابتدائي">الابتدائي</MenuItem><MenuItem value="المتوسط">المتوسط</MenuItem><MenuItem value="الثانوي">الثانوي</MenuItem></Select>
          <div className="flex gap-2"><Select label="التخصص" value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value as string)} fullWidth><MenuItem value="all">الكل</MenuItem><MenuItem value="علوم">علوم</MenuItem><MenuItem value="رياضيات">رياضيات</MenuItem><MenuItem value="آداب">آداب</MenuItem><MenuItem value="لغات">لغات</MenuItem></Select><IconButton onClick={resetFilters} variant="outlined" color="primary"><FaUndo /></IconButton></div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? <div className="col-span-full text-center py-12"><CircularProgress size={48} /></div> : 
            filteredSections.length > 0 ? filteredSections.map((section) => (
              <Card key={section.id} className="shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 rounded-xl border border-gray-200 text-right overflow-hidden">
                <div className="h-2 bg-blue-600" />
                <CardContent className="p-5">
                  <Typography variant="h5" color="blue-gray" className="mb-3 font-bold text-gray-800 truncate">{section.name}</Typography>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between"><span>المستوى:</span><span className="font-semibold text-gray-800">{section.educationalLevel}</span></div>
                    <div className="flex justify-between"><span>التخصص:</span><span className="font-semibold text-gray-800">{section.specialization}</span></div>
                    <div className="flex justify-between"><span>الأستاذ:</span><span className="font-semibold text-gray-800">{section.teacherName}</span></div>
                  </div>
                  <div className="text-center border-t border-b py-2 my-3">
                    <Typography color="blue-gray" className="text-xs font-semibold">عدد التلاميذ</Typography>
                    <Typography color="primary" variant="h4" className="font-bold">{students.filter(st => st.sectionId === section.id).length}</Typography>
                  </div>
                  <div className="flex justify-center flex-wrap gap-2 mt-4">
                    <Button size="small" variant="outlined" color="primary" className="flex items-center gap-2" onClick={() => handleViewDetailsClick(section)}><FaEye /> تفاصيل</Button>
                    <Button size="small" variant="outlined" color="warning" className="flex items-center gap-2" onClick={() => handleEditClick(section)} disabled={isLoading}><FaEdit /> تعديل</Button>
                    {section.courseName && <Link to={`/section-progress/${section.id}`}><Button size="small" variant="outlined" color="success" className="flex items-center gap-2" disabled={isLoading}><FaChartPie /> التقدم</Button></Link>}
                    <Button size="small" variant="contained" color="error" className="flex items-center gap-2" onClick={() => handleDeleteSection(section.id, section.name)} disabled={isLoading}><FaTrash /> حذف</Button>
                  </div>
                </CardContent>
              </Card>
            )) : <div className="col-span-full text-center py-12"><Typography variant="h6">لا توجد أقسام تطابق البحث.</Typography></div>}
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-lg h-full">
            <Typography variant="h5" className="mb-5 text-center text-gray-800 font-semibold">توزيع التلاميذ على الأقسام</Typography>
            <div className="space-y-3">
              {filteredSections.length > 0 ? (
                filteredSections.map((section) => {
                  const studentCount = students.filter(s => s.sectionId === section.id).length;
                  const maxStudents = Math.max(...sections.map(s => students.filter(st => st.sectionId === s.id).length));
                  const width = maxStudents > 0 ? (studentCount / maxStudents) * 100 : 0;
                  return (
                    <div key={section.id} className="flex items-center gap-3">
                      <div className="w-24 text-sm font-medium text-gray-700 truncate">{section.name}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${width}%` }}></div>
                      </div>
                      <div className="w-8 text-sm text-gray-600 font-bold">{studentCount}</div>
                    </div>
                  );
                })
              ) : (
                <Typography color="gray" className="text-center py-4">لا توجد بيانات لعرضها</Typography>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isAddModalOpen} onClose={handleAddModalOpen} maxWidth="xs" fullWidth><DialogTitle sx={{ justifyContent: 'flex-end' }}>إضافة قسم</DialogTitle><DialogContent dividers><SectionForm onClose={handleAddModalOpen} addSection={addSection} /></DialogContent></Dialog>
      <Dialog open={isEditModalOpen} onClose={handleEditModalOpen} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ justifyContent: 'flex-end' }}>تعديل القسم</DialogTitle>
        {selectedSection && <DialogContent dividers><SectionForm onClose={handleEditModalOpen} initialData={selectedSection} updateSection={(id, data) => editSection(id, data).finally(handleEditModalOpen)} /></DialogContent>}
      </Dialog>
      <Dialog open={isDetailModalOpen} onClose={handleDetailModalOpen} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ justifyContent: 'flex-end' }}>تفاصيل: {selectedSection?.name}</DialogTitle>
        <DialogContent dividers className="p-4 text-right space-y-2 max-h-[60vh] overflow-y-auto">
          {selectedSection && <><Typography><strong>المستوى:</strong> {selectedSection.educationalLevel}</Typography><Typography><strong>التخصص:</strong> {selectedSection.specialization}</Typography><Typography><strong>القاعة:</strong> {selectedSection.roomNumber}</Typography><Typography><strong>الأستاذ:</strong> {selectedSection.teacherName}</Typography>{selectedSection.courseName && <Typography><strong>المقرر:</strong> {selectedSection.courseName}</Typography>}<hr className="my-2" /><Typography className="font-bold">التلاميذ:</Typography><div className="max-h-60 overflow-y-auto pr-2">{students.filter(st => st.sectionId === selectedSection.id).length > 0 ? <ul className="list-disc pr-5">{(students.filter(st => st.sectionId === selectedSection.id).map(student => <li key={student.id}>{student.firstName} {student.lastName}</li>))}</ul> : <Typography>لا يوجد تلاميذ.</Typography>}</div></>}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-start' }}><Button variant="text" color="error" onClick={handleDetailModalOpen}>إغلاق</Button></DialogActions>
      </Dialog>
      <Dialog open={isDeleteStudentsModalOpen} onClose={handleDeleteStudentsModalOpen} maxWidth="xs" fullWidth><DialogTitle sx={{ justifyContent: 'flex-end' }}>تأكيد</DialogTitle><DialogContent dividers><Typography>هل أنت متأكد من حذف جميع تلاميذ هذا القسم؟</Typography></DialogContent><DialogActions sx={{ justifyContent: 'flex-start' }}><Button variant="text" color="error" onClick={handleDeleteStudentsForSection} sx={{ ml: 2 }}>نعم</Button><Button variant="text" color="inherit" onClick={handleDeleteStudentsModalOpen}>إلغاء</Button></DialogActions></Dialog>

      {/* Custom Confirmation Modal for deleting all sections */}
      <Dialog open={isConfirmModalOpen} onClose={handleConfirmModalClose} maxWidth="xs" fullWidth>
        <DialogTitle>تأكيد الإجراء</DialogTitle>
        <DialogContent dividers>
          <Typography>{confirmModalMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            color="error"
            onClick={handleConfirmAction}
            sx={{ ml: 2 }}
          >
            تأكيد
          </Button>
          <Button
            variant="text"
            color="inherit"
            onClick={handleConfirmModalClose}
          >
            إلغاء
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default SectionManagement;
