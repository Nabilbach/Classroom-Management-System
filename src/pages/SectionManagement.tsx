import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, TextField, Select, MenuItem, IconButton, CircularProgress } from '@mui/material';
import { FaUsers, FaChalkboard, FaChalkboardTeacher, FaUserGraduate, FaPlus, FaSearch, FaUndo, FaEye, FaEdit, FaTrash, FaChartPie, FaUpload, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';
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
          <Typography variant="h4" color="blue-gray" sx={{ fontWeight: 'bold' }}>{value}</Typography>
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
  const [isUploadInstructionsOpen, setIsUploadInstructionsOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState<string>('');
  const [confirmModalAction, setConfirmModalAction] = useState<(() => void) | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Skip header row and process data
      const rows = jsonData.slice(1) as any[][];
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 4) continue; // Skip empty or incomplete rows

        try {
          const sectionData = {
            name: row[0]?.toString().trim() || '',
            educationalLevel: row[1]?.toString().trim() || '',
            specialization: row[2]?.toString().trim() || '',
            teacherName: row[3]?.toString().trim() || '',
            courseName: row[4]?.toString().trim() || '',
            roomNumber: row[5]?.toString().trim() || `قاعة-${Math.floor(Math.random() * 100)}`, // Default room number
            color: row[6]?.toString().trim() || '#3949ab', // Default color
          };

          // Validate required fields
          if (!sectionData.name || !sectionData.educationalLevel || !sectionData.specialization || !sectionData.teacherName) {
            errors.push(`الصف ${i + 2}: بيانات ناقصة (اسم القسم، المستوى، التخصص، اسم الأستاذ مطلوبة)`);
            errorCount++;
            continue;
          }

          await addSection(sectionData);
          successCount++;
        } catch (error) {
          errors.push(`الصف ${i + 2}: خطأ في إضافة القسم - ${error}`);
          errorCount++;
        }
      }

      // Show results
      let message = `تم رفع الملف بنجاح!\n`;
      message += `تم إضافة ${successCount} قسم بنجاح\n`;
      if (errorCount > 0) {
        message += `فشل في إضافة ${errorCount} قسم\n`;
        if (errors.length > 0) {
          message += `\nالأخطاء:\n${errors.slice(0, 5).join('\n')}`;
          if (errors.length > 5) {
            message += `\n... و ${errors.length - 5} خطأ آخر`;
          }
        }
      }
      alert(message);

    } catch (error) {
      console.error('Error processing Excel file:', error);
      alert('حدث خطأ في معالجة الملف. تأكد من صحة تنسيق الملف.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    setIsUploadInstructionsOpen(true);
  };

  const handleProceedWithUpload = () => {
    setIsUploadInstructionsOpen(false);
    fileInputRef.current?.click();
  };

  const downloadTemplate = () => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Create sample data with Arabic headers
    const templateData = [
      ['اسم القسم', 'المستوى التعليمي', 'التخصص', 'اسم الأستاذ', 'اسم المقرر', 'اللون'],
      ['TCS-1', 'الثانوي', 'علوم', 'أحمد محمد', 'الفيزياء', '#3949ab'],
      ['1BACSE-1', 'الثانوي', 'علوم', 'فاطمة علي', 'الرياضيات', '#2196f3'],
      ['2BACSH-1', 'الثانوي', 'آداب', 'محمد حسن', 'التاريخ', '#4caf50'],
      ['TCLSH-1', 'الثانوي', 'آداب', 'زينب أحمد', 'الفلسفة', '#ff9800'],
      ['', '', '', '', '', ''], // Empty row for user input
      ['', '', '', '', '', ''], // Empty row for user input
      ['', '', '', '', '', ''], // Empty row for user input
    ];
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // اسم القسم
      { wch: 18 }, // المستوى التعليمي
      { wch: 12 }, // التخصص
      { wch: 20 }, // اسم الأستاذ
      { wch: 18 }, // اسم المقرر
      { wch: 10 }  // اللون
    ];
    
    // Style the header row
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1976D2" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
    
    // Apply styles to header row (A1:F1)
    for (let col = 0; col < 6; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) ws[cellAddress] = {};
      ws[cellAddress].s = headerStyle;
    }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'قالب الأقسام');
    
    // Generate and download file
    const fileName = 'قالب_رفع_الأقسام.xlsx';
    XLSX.writeFile(wb, fileName);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setLevelFilter('all');
    setSpecialtyFilter('all');
  };

  return (
  <div dir="rtl" className="pl-4 pr-0 font-cairo w-full min-w-0">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4" color="blue-gray" sx={{ fontWeight: 'bold' }}>إدارة الأقسام</Typography>
        <div className="flex gap-3">
          <Button 
            onClick={handleAddModalOpen} 
            variant="contained" 
            color="primary" 
            className="flex items-center gap-2 hover:shadow-lg hover:scale-105 transform transition-all duration-200" 
            disabled={isLoading}
          >
            <FaPlus /> إضافة قسم جديد
          </Button>
          <Button
            onClick={handleUploadClick}
            variant="outlined"
            color="primary"
            className="flex items-center gap-2 hover:shadow-lg hover:scale-105 transform transition-all duration-200"
            disabled={isLoading || isUploading}
          >
            {isUploading ? <CircularProgress size={20} /> : <FaUpload />}
            {isUploading ? 'جاري الرفع...' : 'رفع ملف Excel'}
          </Button>
        </div>
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
        />
      </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 w-full min-w-0">
        <StatCard icon={<FaUsers size={24} />} title="إجمالي التلاميذ" value={stats.totalStudents} color="border-t-blue-500" />
        <StatCard icon={<FaChalkboard size={24} />} title="عدد الأقسام" value={stats.totalSections} color="border-t-green-500" />
        <StatCard icon={<FaChalkboardTeacher size={24} />} title="عدد المعلمين" value={stats.uniqueTeachers} color="border-t-orange-500" />
        <StatCard icon={<FaUserGraduate size={24} />} title="القسم الأكثر ازدحامًا" value={`${stats.mostCrowded.name} (${stats.mostCrowded.count})`} color="border-t-red-500" />
      </div>

  <Card className="mb-8 p-4 shadow-lg w-full min-w-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <TextField 
              label="ابحث..." 
              InputProps={{ endAdornment: <FaSearch /> }} 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              fullWidth 
            />
          </div>
          <Select 
            label="المستوى" 
            value={levelFilter} 
            onChange={(e) => setLevelFilter(e.target.value as string)} 
            fullWidth
          >
            <MenuItem value="all">جميع المستويات</MenuItem>
            <MenuItem value="جذع مشترك">جذع مشترك</MenuItem>
            <MenuItem value="أولى بكالوريا">أولى بكالوريا</MenuItem>
            <MenuItem value="ثانية بكالوريا">ثانية بكالوريا</MenuItem>
          </Select>
          <div className="flex gap-2">
            <Select 
              label="التخصص" 
              value={specialtyFilter} 
              onChange={(e) => setSpecialtyFilter(e.target.value as string)} 
              fullWidth
            >
              <MenuItem value="all">جميع التخصصات</MenuItem>
              <MenuItem value="آداب وعلوم إنسانية">آداب وعلوم إنسانية</MenuItem>
              <MenuItem value="علوم تجريبية">علوم تجريبية</MenuItem>
              <MenuItem value="علوم تجريبية (فرنسية)">علوم تجريبية (فرنسية)</MenuItem>
              <MenuItem value="علوم فيزيائية">علوم فيزيائية</MenuItem>
              <MenuItem value="علوم الحياة والأرض">علوم الحياة والأرض</MenuItem>
            </Select>
            <IconButton onClick={resetFilters} variant="outlined" color="primary">
              <FaUndo />
            </IconButton>
          </div>
        </div>
      </Card>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full min-w-0">
        <div className="lg:col-span-2 w-full min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full min-w-0">
            {isLoading ? <div className="col-span-full text-center py-12"><CircularProgress size={48} /></div> : 
            filteredSections.length > 0 ? filteredSections.map((section) => (
              <Card key={section.id} className="shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 rounded-xl border border-gray-200 text-right overflow-hidden">
                <div className="h-2 bg-blue-600" />
                <CardContent className="p-5">
                  <Typography variant="h5" color="blue-gray" className="mb-3 font-bold text-gray-800 truncate" sx={{ fontWeight: 'bold' }}>{section.name}</Typography>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between"><span>المستوى:</span><span className="font-semibold text-gray-800" style={{ fontWeight: 'bold' }}>{section.educationalLevel}</span></div>
                    <div className="flex justify-between"><span>التخصص:</span><span className="font-semibold text-gray-800" style={{ fontWeight: 'bold' }}>{section.specialization}</span></div>
                    <div className="flex justify-between"><span>الأستاذ:</span><span className="font-semibold text-gray-800" style={{ fontWeight: 'bold' }}>{section.teacherName}</span></div>
                  </div>
                  <div className="text-center border-t border-b py-2 my-3">
                    <Typography color="blue-gray" className="text-xs font-semibold">عدد التلاميذ</Typography>
                    <Typography color="primary" variant="h4" className="font-bold" sx={{ fontWeight: 'bold' }}>{students.filter(st => st.sectionId === section.id).length}</Typography>
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
            <Typography variant="h5" className="mb-5 text-center text-gray-800 font-semibold" sx={{ fontWeight: 'bold' }}>توزيع التلاميذ على الأقسام</Typography>
            <div className="space-y-3">
              {filteredSections.length > 0 ? (
                filteredSections.map((section) => {
                  const studentCount = students.filter(s => s.sectionId === section.id).length;
                  const maxStudents = Math.max(...sections.map(s => students.filter(st => st.sectionId === s.id).length));
                  const width = maxStudents > 0 ? (studentCount / maxStudents) * 100 : 0;
                  return (
                    <div key={section.id} className="flex items-center gap-3">
                      <div className="w-24 text-sm font-medium text-gray-700 truncate" style={{ fontWeight: 'bold' }}>{section.name}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${width}%` }}></div>
                      </div>
                      <div className="w-8 text-sm text-gray-600 font-bold" style={{ fontWeight: 'bold' }}>{studentCount}</div>
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

      <Dialog open={isAddModalOpen} onClose={handleAddModalOpen} maxWidth="xs" fullWidth><DialogTitle sx={{ justifyContent: 'flex-end', fontWeight: 'bold' }}>إضافة قسم</DialogTitle><DialogContent dividers><SectionForm onClose={handleAddModalOpen} addSection={addSection} /></DialogContent></Dialog>
      <Dialog open={isEditModalOpen} onClose={handleEditModalOpen} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ justifyContent: 'flex-end', fontWeight: 'bold' }}>تعديل القسم</DialogTitle>
        {selectedSection && <DialogContent dividers><SectionForm onClose={handleEditModalOpen} initialData={selectedSection} updateSection={(id, data) => editSection(id, data).finally(handleEditModalOpen)} /></DialogContent>}
      </Dialog>
      <Dialog open={isDetailModalOpen} onClose={handleDetailModalOpen} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ justifyContent: 'flex-end', fontWeight: 'bold' }}>تفاصيل: {selectedSection?.name}</DialogTitle>
        <DialogContent dividers className="p-4 text-right space-y-2 max-h-[60vh] overflow-y-auto">
          {selectedSection && <><Typography><strong style={{ fontWeight: 'bold' }}>المستوى:</strong> {selectedSection.educationalLevel}</Typography><Typography><strong style={{ fontWeight: 'bold' }}>التخصص:</strong> {selectedSection.specialization}</Typography><Typography><strong style={{ fontWeight: 'bold' }}>القاعة:</strong> {selectedSection.roomNumber}</Typography><Typography><strong style={{ fontWeight: 'bold' }}>الأستاذ:</strong> {selectedSection.teacherName}</Typography>{selectedSection.courseName && <Typography><strong style={{ fontWeight: 'bold' }}>المقرر:</strong> {selectedSection.courseName}</Typography>}<hr className="my-2" /><Typography className="font-bold" style={{ fontWeight: 'bold' }}>التلاميذ:</Typography><div className="max-h-60 overflow-y-auto pr-2">{students.filter(st => st.sectionId === selectedSection.id).length > 0 ? <ul className="list-disc pr-5">{(students.filter(st => st.sectionId === selectedSection.id).map(student => <li key={student.id}>{student.firstName} {student.lastName}</li>))}</ul> : <Typography>لا يوجد تلاميذ.</Typography>}</div></>}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-start' }}><Button variant="text" color="error" onClick={handleDetailModalOpen}>إغلاق</Button></DialogActions>
      </Dialog>
      <Dialog open={isDeleteStudentsModalOpen} onClose={handleDeleteStudentsModalOpen} maxWidth="xs" fullWidth><DialogTitle sx={{ justifyContent: 'flex-end', fontWeight: 'bold' }}>تأكيد</DialogTitle><DialogContent dividers><Typography>هل أنت متأكد من حذف جميع تلاميذ هذا القسم؟</Typography></DialogContent><DialogActions sx={{ justifyContent: 'flex-start' }}><Button variant="text" color="error" onClick={handleDeleteStudentsForSection} sx={{ ml: 2, fontWeight: 'bold' }}>نعم</Button><Button variant="text" color="inherit" onClick={handleDeleteStudentsModalOpen}>إلغاء</Button></DialogActions></Dialog>

      {/* Custom Confirmation Modal for deleting all sections */}
      <Dialog open={isConfirmModalOpen} onClose={handleConfirmModalClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>تأكيد الإجراء</DialogTitle>
        <DialogContent dividers>
          <Typography>{confirmModalMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            color="error"
            onClick={handleConfirmAction}
            sx={{ ml: 2, fontWeight: 'bold' }}
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

      {/* Excel Upload Instructions Modal */}
      <Dialog open={isUploadInstructionsOpen} onClose={() => setIsUploadInstructionsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', color: '#1976d2', fontWeight: 'bold' }}>
          📊 تعليمات رفع ملف Excel
        </DialogTitle>
        <DialogContent dividers>
          <div className="space-y-4 text-right">
            <Typography variant="body1" className="text-gray-700 mb-3">
              يجب أن يحتوي ملف Excel على الأعمدة التالية بالترتيب الصحيح:
            </Typography>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <Typography variant="subtitle2" className="text-blue-800 font-semibold mb-2" sx={{ fontWeight: 'bold' }}>
                  الأعمدة المطلوبة:
                </Typography>
                <div className="space-y-1 text-sm">
                  <div className="bg-white p-2 rounded border" style={{ fontWeight: 'bold' }}>1. اسم القسم</div>
                  <div className="bg-white p-2 rounded border" style={{ fontWeight: 'bold' }}>2. المستوى التعليمي</div>
                  <div className="bg-white p-2 rounded border" style={{ fontWeight: 'bold' }}>3. التخصص</div>
                  <div className="bg-white p-2 rounded border" style={{ fontWeight: 'bold' }}>4. اسم الأستاذ</div>
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <Typography variant="subtitle2" className="text-green-800 font-semibold mb-2" sx={{ fontWeight: 'bold' }}>
                  الأعمدة الاختيارية:
                </Typography>
                <div className="space-y-1 text-sm">
                  <div className="bg-white p-2 rounded border">5. اسم المقرر</div>
                  <div className="bg-white p-2 rounded border">6. اللون</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <Typography variant="subtitle2" className="text-yellow-800 font-semibold mb-2">
                📝 ملاحظات مهمة:
              </Typography>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>الأعمدة 1-4 مطلوبة وضرورية</li>
                <li>الأعمدة 5-6 اختيارية</li>
                <li>سيتم توليد رقم القاعة تلقائياً</li>
                <li>اللون الافتراضي هو الأزرق إذا لم يُحدد</li>
                <li>يجب أن يكون الصف الأول يحتوي على العناوين</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border">
              <Typography variant="subtitle2" className="text-gray-800 font-semibold mb-2">
                📥 تحميل القالب الجاهز:
              </Typography>
              <Typography variant="body2" className="text-gray-600 mb-3">
                يمكنك تحميل ملف Excel جاهز مع الأمثلة والتنسيق الصحيح:
              </Typography>
              <Button
                variant="outlined"
                color="success"
                onClick={downloadTemplate}
                className="w-full flex items-center justify-center gap-2"
                sx={{ mb: 2 }}
              >
                <FaDownload /> تحميل قالب Excel
              </Button>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border">
              <Typography variant="subtitle2" className="text-gray-800 font-semibold mb-2">
                مثال على التنسيق:
              </Typography>
              <div className="text-xs bg-white p-2 rounded border font-mono overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-1 border">اسم القسم</th>
                      <th className="p-1 border">المستوى</th>
                      <th className="p-1 border">التخصص</th>
                      <th className="p-1 border">اسم الأستاذ</th>
                      <th className="p-1 border">اسم المقرر</th>
                      <th className="p-1 border">اللون</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-1 border">TCS-1</td>
                      <td className="p-1 border">الثانوي</td>
                      <td className="p-1 border">علوم</td>
                      <td className="p-1 border">أحمد محمد</td>
                      <td className="p-1 border">الفيزياء</td>
                      <td className="p-1 border">#3949ab</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', p: 3 }}>
          <Button
            variant="text"
            color="inherit"
            onClick={() => setIsUploadInstructionsOpen(false)}
          >
            إلغاء
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleProceedWithUpload}
            className="flex items-center gap-2"
            disabled={isUploading}
          >
            <FaUpload /> متابعة الرفع
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default SectionManagement;
