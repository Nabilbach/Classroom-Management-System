import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Chip,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SelectChangeEvent,
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { useSections } from '../contexts/SectionsContext';
import { getLessonInfo, formatDateToArabic } from '../utils/lessonTimeUtils';
import { useCurrentLesson } from '../hooks/useCurrentLesson';
import StudentDetailModal from './students/StudentDetailModal';

interface AttendanceRecord {
  id: number;
  studentId: number;
  sectionId: string;
  date: string;
  isPresent: boolean;
  createdAt?: string; // لتحديد وقت إنشاء السجل
  student?: { id: number; firstName: string; lastName: string; classOrder?: number | null; pathwayNumber?: number | string | null };
  absences?: number;
}

interface AbsenceHistoryContentProps {
  onClose: () => void;
}

const AbsenceHistoryContent: React.FC<AbsenceHistoryContentProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  // Removed unused loading state
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<AttendanceRecord | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { sections } = useSections();
  const { recommendedSectionId, displayMessage, isTeachingTime } = useCurrentLesson();

  // Find selected section object
  const selectedSection = useMemo(() => sections.find(s => s.id === selectedSectionId), [sections, selectedSectionId]);

  // Tab change handler
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Fetch available dates on component mount
  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/attendance');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const allRecords: AttendanceRecord[] = await response.json();
        
        // Extract unique dates and sort them (newest first)
        const dates = [...new Set(allRecords.map((record) => record.date))];
        dates.sort((a, b) => b.localeCompare(a)); // Descending order
        setAvailableDates(dates);
        
        // Set the most recent date as default
        if (dates.length > 0 && !selectedDate) {
          setSelectedDate(dates[0]);
        }
      } catch (error) {
        console.error('Error fetching available dates:', error);
      }
    };

    fetchAvailableDates();
  }, []);

  // Simplified: Just follow the alert directly
  useEffect(() => {
    if (recommendedSectionId && sections.length > 0) {
      // الأولوية الأولى: إذا كان هناك قسم موصى به (حصة حالية)
      if (selectedSectionId !== recommendedSectionId) {
        console.log('🎯 Auto-updating section based on current lesson:', recommendedSectionId);
        setSelectedSectionId(recommendedSectionId);
        // حفظ القسم الموصى به كآخر قسم مستخدم
        localStorage.setItem('lastSelectedSectionId', recommendedSectionId);
      }
    } else if (sections.length > 0 && selectedSectionId === '' && !recommendedSectionId) {
      // الأولوية الثانية: استرجاع آخر قسم محفوظ
      const savedSectionId = localStorage.getItem('lastSelectedSectionId');
      if (savedSectionId && sections.find(s => s.id === savedSectionId)) {
        console.log('� Restoring last selected section:', savedSectionId);
        setSelectedSectionId(savedSectionId);
      } else {
        // الأولوية الثالثة: القسم الافتراضي أو الأول
        const defaultSection = sections[0];
        console.log('�📝 Setting default section (fallback):', defaultSection.name);
        setSelectedSectionId(defaultSection.id);
        localStorage.setItem('lastSelectedSectionId', defaultSection.id);
      }
    }
  }, [recommendedSectionId, sections]);

  const fetchData = useCallback(async () => {
    try {
      // Don't fetch if section is not yet selected
      if (!selectedSectionId) {
        console.log('Skipping fetch: no section selected'); // Debug log
        return;
      }

      let url = 'http://localhost:3000/api/attendance';
      const params: string[] = [];
      
      // Add date parameter only if a specific date is selected (not empty for "all dates")
      if (selectedDate && selectedDate.trim() !== '') {
        params.push(`date=${encodeURIComponent(selectedDate)}`);
        console.log('Adding date filter:', selectedDate); // Debug log
      } else {
        console.log('Fetching for ALL DATES'); // Debug log
      }
      
      // Add section parameter if specific section is selected (not 'ALL')
      if (selectedSectionId && selectedSectionId !== 'ALL') {
        const sectionParam = encodeURIComponent(selectedSection?.name ?? selectedSectionId);
        params.push(`sectionId=${sectionParam}`);
        console.log('Adding section filter:', selectedSection?.name); // Debug log
      } else if (selectedSectionId === 'ALL') {
        console.log('Fetching for ALL SECTIONS'); // Debug log
      }
      
      // Append parameters to URL
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      console.log('Fetching attendance data with URL:', url); // Debug log
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      console.log('Fetched records:', data.length, 'for section:', selectedSectionId === 'ALL' ? 'ALL SECTIONS' : selectedSection?.name); // Debug log
      setRecords(data);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setRecords([]);
    }
  }, [selectedSectionId, selectedDate, selectedSection]);

  // Fetch data when section or date changes (including empty date for "all dates")
  useEffect(() => {
    if (selectedSectionId && selectedSection) {
      console.log('Triggering data fetch for:', selectedSection.name, 'with date filter:', selectedDate || 'ALL DATES'); // Debug log
      fetchData();
    }
  }, [selectedSectionId, selectedDate, selectedSection, fetchData]);

  const present = useMemo(() => records.filter(r => r.isPresent), [records]);
  const absent = useMemo(() => records.filter(r => !r.isPresent), [records]);

  // Sort by classOrder if available so numbers appear in order; put missing at end
  const presentSorted = useMemo(() => {
    const arr = [...present];
    arr.sort((a, b) => {
      const ao = a.student?.classOrder ?? Number.POSITIVE_INFINITY;
      const bo = b.student?.classOrder ?? Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;
      return a.studentId - b.studentId;
    });
    return arr;
  }, [present]);

  const absentSorted = useMemo(() => {
    const arr = [...absent];
    arr.sort((a, b) => {
      const ao = a.student?.classOrder ?? Number.POSITIVE_INFINITY;
      const bo = b.student?.classOrder ?? Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;
      return a.studentId - b.studentId;
    });
    return arr;
  }, [absent]);

  const togglePresence = async (record: AttendanceRecord, newIsPresent: boolean) => {
    try {
      const payload = { attendance: [{ studentId: record.studentId, sectionId: record.sectionId, date: record.date, isPresent: newIsPresent }] };
      const res = await fetch(`http://localhost:3000/api/attendance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Optimistically update local list
      setRecords(prev => prev.map(r => {
        if (r.studentId === record.studentId && r.date === record.date) {
          const currentAbsences = r.absences ?? 0;
          const delta = newIsPresent ? -1 : 1; // present reduces absences, absent increases
          return { ...r, isPresent: newIsPresent, absences: Math.max(0, currentAbsences + delta) };
        }
        return r;
      }));
    } catch (e) {
      console.error('Failed to toggle presence:', e);
      alert('تعذر تحديث الحالة. حاول مرة أخرى.');
    }
  };

  // Print handling via window.print
  const printRef = useRef<HTMLDivElement>(null);

  const triggerPrint = () => {
    // Alternative print method using window.print
    const printContent = printRef.current;
    if (!printContent) return;

    const documentTitle = `سجل الحضور والغياب-${selectedSectionId === 'ALL' ? 'كل الأقسام' : (selectedSection?.name || 'قسم غير محدد')}-${selectedDate}`;
    
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${documentTitle}</title>
          <style>
            @page { 
              size: A4 portrait; 
              margin: 15mm 10mm; 
            }
            body { 
              font-family: Arial, sans-serif;
              direction: rtl;
              margin: 0;
              padding: 20px;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin-bottom: 15px;
              font-size: 9px;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 4px 2px; 
              font-size: 9px;
              text-align: center;
            }
            th { 
              background: #f0f0f0; 
              font-weight: bold;
            }
            .name-cell {
              text-align: right !important;
              padding-right: 5px !important;
            }
            .header-title {
              font-size: 16px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 10px;
            }
            .section-title {
              font-size: 12px;
              font-weight: bold;
              margin: 10px 0 5px 0;
              text-align: right;
            }
            .name-cell {
              text-align: right !important;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDeleteDay = async () => {
    if (!selectedSectionId || !selectedDate || selectedSectionId === 'ALL') return;
    const confirmed = window.confirm('هل أنت متأكد أنك تريد مسح سجل الغياب/الحضور لهذا اليوم بالكامل؟ لا يمكن التراجع.');
    if (!confirmed) return;
    try {
      const sectionParam = encodeURIComponent(selectedSection?.name ?? selectedSectionId);
      const res = await fetch(`http://localhost:3000/api/attendance?sectionId=${sectionParam}&date=${encodeURIComponent(selectedDate)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Clear local records and refetch to be safe
      setRecords([]);
      await fetchData();
    } catch (e) {
      console.error('Failed to delete day attendance:', e);
      alert('تعذر مسح السجل. حاول مرة أخرى.');
    }
  };

  // Handle double click to show student details
  const handleStudentDoubleClick = (record: AttendanceRecord) => {
    setSelectedStudentForDetails(record);
  };

  // Handle manual section selection - simplified
  const handleSectionChange = (event: SelectChangeEvent) => {
    const newSectionId = event.target.value as string;
    setSelectedSectionId(newSectionId);
    // حفظ الاختيار دائماً (بساطة)
    localStorage.setItem('lastSelectedSectionId', newSectionId);
    console.log('💾 Section changed to:', newSectionId);
  };

  // دالة حذف جميع السجلات
  const handleDeleteAllRecords = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch('http://localhost:3000/api/attendance/all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('تم حذف جميع السجلات:', result);
      
      // إعادة تعيين البيانات
      setRecords([]);
      setAvailableDates([]);
      setSelectedDate('');
      
      alert(`تم حذف ${result.deletedCount || 0} سجل غياب بنجاح`);
      
    } catch (error) {
      console.error('خطأ في حذف السجلات:', error);
      alert('حدث خطأ في حذف السجلات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const isMobile = useMediaQuery('(max-width:600px)');
  return (
    <Card sx={{ maxWidth: 900, mx: 'auto', my: 2, boxShadow: 6, borderRadius: 4, height: isMobile ? '100vh' : '90vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <CardContent sx={{ pb: 0 }}>
        {/* Header & Controls */}
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
          <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold" color="primary" sx={{ mb: isMobile ? 2 : 0 }}>
            سجل الحضور والغياب
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 140 }}>
              <InputLabel>التاريخ</InputLabel>
              <Select
                value={selectedDate}
                label="التاريخ"
                onChange={(e) => setSelectedDate(e.target.value)}
              >
                <MenuItem value="">جميع التواريخ</MenuItem>
                {availableDates.map(date => (
                  <MenuItem key={date} value={date}>
                    {new Date(date + 'T00:00:00').toLocaleDateString('ar-MA', {
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>القسم</InputLabel>
              <Select
                value={selectedSectionId}
                label="القسم"
                onChange={handleSectionChange}
              >
                {sections.map(section => (
                  <MenuItem key={section.id} value={section.id}>
                    {section.name}
                  </MenuItem>
                ))}
                <MenuItem value="ALL">كل الأقسام</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" onClick={fetchData} sx={{ height: 56 }}>
              تحديث البيانات
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={records.length === 0 || isDeleting}
              sx={{ minWidth: 120 }}
            >
              {isDeleting ? 'حذف...' : 'حذف جميع السجلات'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={onClose}
              sx={{ minWidth: 100 }}
            >
              إغلاق
            </Button>
          </Box>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {/* Section and Date Info with Current Lesson Indicator */}
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography variant="subtitle1" color="text.secondary">
            {selectedSectionId === 'ALL' ? 'كل الأقسام' : (selectedSection?.name || 'قسم غير محدد')} - {selectedDate}
          </Typography>
          {/* مؤشر الحصة الذكي المبسط */}
          {recommendedSectionId && selectedSectionId === recommendedSectionId && (
            <Box sx={{ mt: 1 }}>
              <Chip 
                label={displayMessage}
                size="small"
                sx={{
                  bgcolor: isTeachingTime ? 'success.light' : 'info.light',
                  color: isTeachingTime ? 'success.dark' : 'info.dark',
                  fontWeight: 'bold'
                }}
              />
            </Box>
          )}
        </Box>
        {/* Tabs */}
        <Tabs value={activeTab} onChange={handleTabChange} centered sx={{ mb: 2 }}>
          <Tab label={`الحاضرون (${presentSorted.length})`} />
          <Tab label={`الغائبون (${absentSorted.length})`} />
        </Tabs>
        {/* Table Content */}
        <Box sx={{ flex: 1, overflow: 'auto', mb: 2, maxHeight: 'calc(100vh - 320px)' }}>
          {activeTab === 0 && (
            <TableContainer component={Paper} sx={{ mb: 2, boxShadow: 2, maxHeight: '100%', overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'success.light', color: 'success.contrastText', width: '8%', textAlign: 'center' }}>
                      ر.ت
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'success.light', color: 'success.contrastText', width: '30%' }}>
                      الاسم الكامل
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'success.light', color: 'success.contrastText', width: '15%', textAlign: 'center' }}>
                      التاريخ
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'success.light', color: 'success.contrastText', width: '10%', textAlign: 'center' }}>
                      الحصة
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'success.light', color: 'success.contrastText', width: '10%', textAlign: 'center' }}>
                      الفترة
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'success.light', color: 'success.contrastText', width: '12%', textAlign: 'center' }}>
                      عدد الغيابات
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'success.light', color: 'success.contrastText', width: '15%', textAlign: 'center' }}>
                      إجراء
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {presentSorted.map((r, idx) => {
                    const lessonInfo = getLessonInfo(r.createdAt || r.date);
                    return (
                      <TableRow 
                        key={r.id} 
                        hover 
                        onDoubleClick={() => handleStudentDoubleClick(r)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                          {r.student?.classOrder ?? (idx + 1)}
                        </TableCell>
                        <TableCell>
                          {`${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          {formatDateToArabic(r.date)}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          {lessonInfo ? lessonInfo.lessonNumber : '-'}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip 
                            label={lessonInfo?.period || 'غير محدد'}
                            size="small"
                            color={lessonInfo?.period === 'صباحية' ? 'primary' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          {r.absences ?? 0}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Button 
                            variant="outlined" 
                            color="error" 
                            size="small" 
                            onClick={() => togglePresence(r, false)}
                            sx={{ minWidth: 120 }}
                          >
                            إلغاء الحضور
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {presentSorted.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={selectedDate ? 6 : 7} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        لا يوجد طلاب حاضرون في هذا التاريخ
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {activeTab === 1 && (
            <TableContainer component={Paper} sx={{ mb: 2, boxShadow: 2, maxHeight: '100%', overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'error.light', color: 'error.contrastText', width: '8%', textAlign: 'center' }}>
                      ر.ت
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'error.light', color: 'error.contrastText', width: '30%' }}>
                      الاسم الكامل
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'error.light', color: 'error.contrastText', width: '15%', textAlign: 'center' }}>
                      التاريخ
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'error.light', color: 'error.contrastText', width: '10%', textAlign: 'center' }}>
                      الحصة
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'error.light', color: 'error.contrastText', width: '10%', textAlign: 'center' }}>
                      الفترة
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'error.light', color: 'error.contrastText', width: '12%', textAlign: 'center' }}>
                      عدد الغيابات
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'error.light', color: 'error.contrastText', width: '15%', textAlign: 'center' }}>
                      إجراء
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {absentSorted.map((r, idx) => {
                    const lessonInfo = getLessonInfo(r.createdAt || r.date);
                    return (
                      <TableRow 
                        key={r.id} 
                        hover 
                        onDoubleClick={() => handleStudentDoubleClick(r)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                          {r.student?.classOrder ?? (idx + 1)}
                        </TableCell>
                        <TableCell>
                          {`${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          {formatDateToArabic(r.date)}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          {lessonInfo ? lessonInfo.lessonNumber : '-'}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip 
                            label={lessonInfo?.period || 'غير محدد'}
                            size="small"
                            color={lessonInfo?.period === 'صباحية' ? 'primary' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          {r.absences ?? 0}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Button 
                            variant="outlined" 
                            color="success" 
                            size="small" 
                            onClick={() => togglePresence(r, true)}
                            sx={{ minWidth: 120 }}
                          >
                            إلغاء الغياب
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {absentSorted.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={selectedDate ? 6 : 7} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        لا يوجد طلاب غائبون في هذا التاريخ
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </CardContent>

      {/* Hidden print-only content */}
      <div 
        ref={printRef} 
        style={{ display: 'none' }}
      >
        <div className="header-title">سجل الحضور والغياب</div>
        <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '12px' }}>
          {selectedSectionId === 'ALL' ? 'كل الأقسام' : (selectedSection?.name || 'قسم غير محدد')} - {selectedDate}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div className="section-title">الحاضرون ({presentSorted.length})</div>
          <table>
            <thead>
              <tr>
                <th style={{ width: '8%' }}>ر.ت</th>
                <th style={{ width: '20%' }}>الاسم الكامل</th>
                <th style={{ width: '15%' }}>التاريخ</th>
                <th style={{ width: '10%' }}>الحصة</th>
                <th style={{ width: '12%' }}>الفترة</th>
                <th style={{ width: '15%' }}>عدد الغيابات</th>
                <th style={{ width: '20%' }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {presentSorted.map((r, idx) => {
                const lessonInfo = getLessonInfo(r.createdAt || r.date);
                return (
                  <tr key={`p-${r.id}`}>
                    <td>{r.student?.classOrder ?? (idx + 1)}</td>
                    <td className="name-cell">
                      {`${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`}
                    </td>
                    <td>{formatDateToArabic(r.date)}</td>
                    <td>{lessonInfo ? lessonInfo.lessonNumber : '-'}</td>
                    <td>{lessonInfo?.period || 'غير محدد'}</td>
                    <td>{r.absences ?? 0}</td>
                    <td>حاضر</td>
                  </tr>
                );
              })}
              {presentSorted.length === 0 && (
                <tr>
                  <td colSpan={7}>لا يوجد طلاب حاضرون</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <div className="section-title">الغائبون ({absentSorted.length})</div>
          <table>
            <thead>
              <tr>
                <th style={{ width: '8%' }}>ر.ت</th>
                <th style={{ width: '20%' }}>الاسم الكامل</th>
                <th style={{ width: '15%' }}>التاريخ</th>
                <th style={{ width: '10%' }}>الحصة</th>
                <th style={{ width: '12%' }}>الفترة</th>
                <th style={{ width: '15%' }}>عدد الغيابات</th>
                <th style={{ width: '20%' }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {absentSorted.map((r, idx) => {
                const lessonInfo = getLessonInfo(r.createdAt || r.date);
                return (
                  <tr key={`a-${r.id}`}>
                    <td>{r.student?.classOrder ?? (idx + 1)}</td>
                    <td className="name-cell">
                      {`${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`}
                    </td>
                    <td>{formatDateToArabic(r.date)}</td>
                    <td>{lessonInfo ? lessonInfo.lessonNumber : '-'}</td>
                    <td>{lessonInfo?.period || 'غير محدد'}</td>
                    <td>{r.absences ?? 0}</td>
                    <td>غائب</td>
                  </tr>
                );
              })}
              {absentSorted.length === 0 && (
                <tr>
                  <td colSpan={7}>لا يوجد طلاب غائبون</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <Box className="no-print" sx={{ position: 'sticky', bottom: 0, left: 0, right: 0, bgcolor: 'grey.100', borderTop: '1px solid #e0e0e0', py: 2, px: 3, display: 'flex', justifyContent: 'center', gap: 2, zIndex: 10 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={handleDeleteDay}
          sx={{ minWidth: 140 }}
        >
          مسح سجل اليوم
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={triggerPrint}
          sx={{ minWidth: 100 }}
        >
          طباعة
        </Button>
      </Box>

      {/* Student Details Modal */}
      {selectedStudentForDetails && (
        <StudentDetailModal
          student={selectedStudentForDetails.student ? {
            id: selectedStudentForDetails.student.id,
            firstName: selectedStudentForDetails.student.firstName || '',
            lastName: selectedStudentForDetails.student.lastName || '',
            classOrder: selectedStudentForDetails.student.classOrder || 0,
            pathwayNumber: String(selectedStudentForDetails.student.pathwayNumber || ''),
            sectionId: selectedStudentForDetails.sectionId,
            birthDate: '', // Default values
            gender: ''
          } : null}
          isOpen={!!selectedStudentForDetails}
          onClose={() => setSelectedStudentForDetails(null)}
          onAssess={(student) => {
            // Assessment functionality can be added later if needed
            console.log('تقييم الطالب:', student);
            setSelectedStudentForDetails(null);
          }}
        />
      )}

      {/* نافذة تأكيد حذف جميع السجلات */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !isDeleting && setDeleteConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: 'error.main', 
          color: 'error.contrastText',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          تأكيد حذف جميع السجلات
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="error" sx={{ mb: 2 }}>
              ⚠️ تحذير هام!
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              هل أنت متأكد من رغبتك في حذف <strong>جميع</strong> سجلات الغياب؟
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              عدد السجلات التي سيتم حذفها: <strong>{records.length}</strong>
            </Typography>
            <Typography variant="body2" color="error" sx={{ fontWeight: 'bold' }}>
              هذه العملية لا يمكن التراجع عنها!
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            variant="outlined"
            disabled={isDeleting}
            sx={{ minWidth: 100 }}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleDeleteAllRecords}
            variant="contained"
            color="error"
            disabled={isDeleting}
            sx={{ minWidth: 120 }}
          >
            {isDeleting ? 'جاري الحذف...' : 'نعم، احذف الجميع'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default AbsenceHistoryContent;