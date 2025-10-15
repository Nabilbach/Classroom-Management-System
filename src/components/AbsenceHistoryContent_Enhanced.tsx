import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
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
  Chip,
  Grid,
  IconButton,
  Collapse,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SelectChangeEvent,
  Backdrop,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { 
  Print as PrintIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  PersonOff as PersonOffIcon,
} from '@mui/icons-material';
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
  createdAt?: string;
  student?: { 
    id: number; 
    firstName: string; 
    lastName: string; 
    classOrder?: number | null; 
    pathwayNumber?: number | string | null 
  };
  absences?: number;
}

interface AbsenceHistoryContentProps {
  onClose: () => void;
}

const AbsenceHistoryContent: React.FC<AbsenceHistoryContentProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(false);
  // تحديد التاريخ الحالي تلقائياً لتجنب عرض بيانات قديمة
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<AttendanceRecord | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string>('');
  
  const { sections } = useSections();
  const { recommendedSectionId, displayMessage, isTeachingTime } = useCurrentLesson();
  const printRef = useRef<HTMLDivElement>(null);

  // Find selected section object
  const selectedSection = useMemo(() => sections.find(s => s.id === selectedSectionId), [sections, selectedSectionId]);

  // لا نختار أي قسم تلقائياً - المستخدم يجب أن يختار بنفسه
  useEffect(() => {
    // تم إزالة الاختيار التلقائي للقسم لتجنب عرض بيانات غير مرغوب فيها
  }, [recommendedSectionId, sections, selectedSectionId]);

  // Fetch available dates on component mount
  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/attendance');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        // Handle API response format: { success, count, records }
        const allRecords: AttendanceRecord[] = data.records || (Array.isArray(data) ? data : []);
        
        const dates = [...new Set(allRecords.map((record) => record.date))];
        dates.sort((a, b) => b.localeCompare(a));
        setAvailableDates(dates);
        
        if (dates.length > 0 && !selectedDate) {
          setSelectedDate(dates[0]);
        }
      } catch (error) {
        console.error('Error fetching available dates:', error);
      }
    };

    fetchAvailableDates();
  }, []);

  const fetchData = useCallback(async () => {
    // تطبيق فلاتر أقوى لضمان عدم عرض بيانات غير مرغوب فيها
    if (!selectedDate) {
      setSearchMessage('يرجى اختيار تاريخ محدد للبحث');
      setRecords([]); // مسح البيانات السابقة
      return;
    }

    if (!selectedSectionId || selectedSectionId === '') {
      setSearchMessage('يرجى اختيار قسم محدد للبحث');
      setRecords([]); // مسح البيانات السابقة
      return;
    }

    // منع عرض "جميع الأقسام" بدون تاريخ محدد لتجنب البيانات الضخمة
    if (selectedSectionId === 'ALL' && !selectedDate) {
      setSearchMessage('عند اختيار "جميع الأقسام" يجب تحديد تاريخ محدد');
      setRecords([]);
      return;
    }

    setIsLoadingRecords(true);
    setSearchMessage('');

    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append('date', selectedDate);
      if (selectedSectionId && selectedSectionId !== 'ALL') params.append('sectionId', selectedSectionId);

      const response = await fetch(`http://localhost:3000/api/attendance?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      // Handle API response format: { success, count, records }
      const recordsArray: AttendanceRecord[] = data.records || (Array.isArray(data) ? data : []);
      setRecords(recordsArray);
      
      if (recordsArray.length === 0) {
        setSearchMessage('لا توجد سجلات حضور للمعايير المحددة');
      } else if (!data.records && !Array.isArray(data)) {
        console.warn('API returned unexpected data format:', data);
        setSearchMessage('تنسيق البيانات غير صحيح من الخادم');
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setSearchMessage('خطأ في جلب البيانات. يرجى المحاولة مرة أخرى.');
      setRecords([]); // Clear records on error
    } finally {
      setIsLoadingRecords(false);
    }
  }, [selectedDate, selectedSectionId]);

  // تحديث البيانات عند تغيير الفلاتر
  useEffect(() => {
    if (selectedDate && selectedSectionId && selectedSectionId !== '') {
      fetchData();
    }
  }, [selectedDate, selectedSectionId, fetchData]);

  // Separate present and absent records
  const { presentSorted, absentSorted } = useMemo(() => {
    const present = records.filter(r => r.isPresent);
    const absent = records.filter(r => !r.isPresent);
    
    const sortByClassOrder = (a: AttendanceRecord, b: AttendanceRecord) => {
      const orderA = a.student?.classOrder ?? 999;
      const orderB = b.student?.classOrder ?? 999;
      return orderA - orderB;
    };

    return {
      presentSorted: present.sort(sortByClassOrder),
      absentSorted: absent.sort(sortByClassOrder)
    };
  }, [records]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSectionChange = (event: SelectChangeEvent) => {
    setSelectedSectionId(event.target.value);
  };

  const togglePresence = async (record: AttendanceRecord, newPresence: boolean) => {
    try {
      const response = await fetch(`http://localhost:3000/api/attendance/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPresent: newPresence }),
      });

      if (!response.ok) throw new Error('Failed to update attendance');

      // Update local records
      setRecords(prev => prev.map(r => 
        r.id === record.id ? { ...r, isPresent: newPresence } : r
      ));
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('فشل في تحديث الحضور');
    }
  };

  const handleStudentDoubleClick = (record: AttendanceRecord) => {
    setSelectedStudentForDetails(record);
  };

  const handleDeleteAllRecords = async () => {
    // التحقق من وجود قسم محدد
    if (!selectedSectionId || selectedSectionId === 'ALL') {
      alert('يرجى اختيار قسم محدد أولاً. لا يمكن حذف جميع الأقسام.');
      setDeleteConfirmOpen(false);
      return;
    }

    const sectionName = selectedSection?.name || selectedSectionId;
    const confirmMessage = selectedDate 
      ? `هل أنت متأكد من حذف سجلات الحضور لقسم "${sectionName}" في تاريخ ${formatDateToArabic(selectedDate)}؟`
      : `هل أنت متأكد من حذف جميع سجلات الحضور لقسم "${sectionName}"؟`;
    
    if (!window.confirm(confirmMessage + '\n\nهذا الإجراء لا يمكن التراجع عنه.')) {
      setDeleteConfirmOpen(false);
      return;
    }

    setIsDeleting(true);
    try {
      // بناء المعاملات للحذف المحدد
      const params = new URLSearchParams();
      params.append('sectionId', selectedSectionId);
      
      if (selectedDate) {
        params.append('date', selectedDate);
      }

      const response = await fetch(`http://localhost:3000/api/attendance?${params.toString()}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete attendance records');

      const result = await response.json();
      alert(`تم حذف ${result.deletedCount} سجل بنجاح من قسم "${sectionName}"`);
      
      // تحديث البيانات
      fetchData();
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Error deleting attendance records:', error);
      alert('فشل في حذف السجلات');
    } finally {
      setIsDeleting(false);
    }
  };

  const triggerPrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const sectionName = selectedSectionId === 'ALL' ? 'كل الأقسام' : 
                       selectedSectionId ? (selectedSection?.name || 'قسم غير محدد') : 'غير محدد';
    const dateStr = selectedDate ? formatDateToArabic(selectedDate) : 'جميع التواريخ';

    // تنسيق العنوان للملف والطباعة
    const formatDateForFileName = (dateString: string) => {
      if (!dateString) return 'جميع-التواريخ';
      try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch {
        return dateString.replace(/[\/\\:*?"<>|]/g, '-');
      }
    };

    const sectionNameForFile = sectionName.replace(/[\/\\:*?"<>|]/g, '-');
    const dateForFile = selectedDate ? formatDateForFileName(selectedDate) : 'جميع-التواريخ';
    const documentTitle = `سجل الحضور والغياب-${dateForFile}-${sectionNameForFile}`;

    // تحديد دالة getLessonInfo محلياً للاستخدام في الطباعة
    const getLessonInfoForPrint = (dateOrTimestamp: string | Date) => {
      try {
        const date = new Date(dateOrTimestamp);
        const hour = date.getHours();
        
        if (hour >= 8 && hour < 14) {
          return { period: 'صباحية', lessonNumber: Math.floor((hour - 8) / 2) + 1 };
        } else if (hour >= 14 && hour < 20) {
          return { period: 'مسائية', lessonNumber: Math.floor((hour - 14) / 2) + 1 };
        }
        return { period: 'غير محدد', lessonNumber: '-' };
      } catch {
        return { period: 'غير محدد', lessonNumber: '-' };
      }
    };

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>${documentTitle}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 20px;
            direction: rtl;
            text-align: right;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            border-bottom: 2px solid #333;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .info {
            font-size: 16px;
            margin: 5px 0;
          }
          .section {
            margin: 30px 0;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            padding: 10px;
            background-color: #f0f0f0;
            border-right: 4px solid #2196F3;
          }
          .present-title {
            background-color: #e8f5e8;
            border-right-color: #4caf50;
          }
          .absent-title {
            background-color: #ffeaea;
            border-right-color: #f44336;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 14px;
          }
          th, td {
            padding: 6px 8px;
            border: 1px solid #ddd;
            text-align: center;
            vertical-align: middle;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
            font-size: 13px;
          }
          /* تحديد عرض الأعمدة */
          th:nth-child(1), td:nth-child(1) { width: 8%; } /* الرقم الترتيبي */
          th:nth-child(2), td:nth-child(2) { width: 25%; } /* الاسم الكامل */
          th:nth-child(3), td:nth-child(3) { width: 15%; } /* القسم */
          th:nth-child(4), td:nth-child(4) { width: 20%; } /* التاريخ */
          th:nth-child(5), td:nth-child(5) { width: 15%; } /* الفترة */
          th:nth-child(6), td:nth-child(6) { width: 12%; } /* عدد الغيابات */
          .present-header {
            background-color: #c8e6c9;
          }
          .absent-header {
            background-color: #ffcdd2;
          }
          .stats {
            margin: 20px 0;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
          }
          .no-data {
            text-align: center;
            padding: 20px;
            color: #666;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${documentTitle}</div>
          <div class="info">القسم: ${sectionName}</div>
          <div class="info">التاريخ: ${dateStr}</div>
        </div>

        <div class="stats">
          <strong>إحصائيات الحضور:</strong><br>
          عدد الحاضرين: ${presentSorted.length} | 
          عدد الغائبين: ${absentSorted.length} | 
          إجمالي الطلاب: ${records.length} | 
          معدل الحضور: ${records.length > 0 ? Math.round((presentSorted.length / records.length) * 100) : 0}%
        </div>

        ${presentSorted.length > 0 ? `
        <div class="section">
          <div class="section-title present-title">الطلاب الحاضرون (${presentSorted.length})</div>
          <table>
            <thead>
              <tr class="present-header">
                <th>الرقم الترتيبي</th>
                <th>الاسم الكامل</th>
                <th>القسم</th>
                <th>التاريخ</th>
                <th>الفترة</th>
                <th>عدد الغيابات</th>
              </tr>
            </thead>
            <tbody>
              ${presentSorted.map(record => {
                const lessonInfo = getLessonInfoForPrint(record.createdAt || record.date);
                const recordSectionName = sections.find(s => s.id === record.sectionId)?.name || record.sectionId;
                return `
                <tr>
                  <td>${record.student?.classOrder || ''}</td>
                  <td>${record.student ? `${record.student.firstName} ${record.student.lastName}` : 'غير محدد'}</td>
                  <td>${recordSectionName}</td>
                  <td>${formatDateToArabic(record.date)}</td>
                  <td>${lessonInfo?.period || 'غير محدد'}</td>
                  <td>${record.absences || 0}</td>
                </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        ` : '<div class="no-data">لا يوجد طلاب حاضرون</div>'}

        ${absentSorted.length > 0 ? `
        <div class="section">
          <div class="section-title absent-title">الطلاب الغائبون (${absentSorted.length})</div>
          <table>
            <thead>
              <tr class="absent-header">
                <th>الرقم الترتيبي</th>
                <th>الاسم الكامل</th>
                <th>القسم</th>
                <th>التاريخ</th>
                <th>الفترة</th>
                <th>عدد الغيابات</th>
              </tr>
            </thead>
            <tbody>
              ${absentSorted.map(record => {
                const lessonInfo = getLessonInfoForPrint(record.createdAt || record.date);
                const recordSectionName = sections.find(s => s.id === record.sectionId)?.name || record.sectionId;
                return `
                <tr>
                  <td>${record.student?.classOrder || ''}</td>
                  <td>${record.student ? `${record.student.firstName} ${record.student.lastName}` : 'غير محدد'}</td>
                  <td>${recordSectionName}</td>
                  <td>${formatDateToArabic(record.date)}</td>
                  <td>${lessonInfo?.period || 'غير محدد'}</td>
                  <td>${record.absences || 0}</td>
                </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        ` : '<div class="no-data">لا يوجد طلاب غائبون</div>'}

        <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
          تم إنشاء هذا التقرير في: ${new Date().toLocaleString('ar-SA')}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'grey.50',
      position: 'relative'
    }} ref={printRef}>
      {/* Loading Backdrop */}
      <Backdrop open={isLoadingRecords} sx={{ zIndex: 9999, color: '#fff' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="inherit" />
          <Typography variant="body2" sx={{ mt: 2 }}>
            جاري تحميل البيانات...
          </Typography>
        </Box>
      </Backdrop>

      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, m: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            📊 سجل الحضور والغياب
          </Typography>
          <IconButton onClick={onClose} color="error">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Smart Lesson Indicator - يظهر فقط عند وجود حصة حالية */}
        {recommendedSectionId && selectedSectionId === recommendedSectionId && isTeachingTime && (
          <Alert 
            severity="success"
            sx={{ mb: 2, borderRadius: 2 }}
            icon={<PersonIcon />}
          >
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {displayMessage}
            </Typography>
          </Alert>
        )}

        {/* Filters Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            startIcon={<FilterIcon />}
            endIcon={filtersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            المرشحات والإعدادات
          </Button>
        </Box>

        {/* Filters Panel */}
        <Collapse in={filtersExpanded}>
          <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
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
                          weekday: 'short'
                        })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>القسم</InputLabel>
                  <Select
                    value={selectedSectionId}
                    label="القسم"
                    onChange={handleSectionChange}
                  >
                    <MenuItem value="">اختر القسم</MenuItem>
                    {sections.map(section => (
                      <MenuItem key={section.id} value={section.id}>
                        {section.name}
                      </MenuItem>
                    ))}
                    <MenuItem value="ALL">كل الأقسام</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Tooltip title="تحديث البيانات">
                  <span style={{ display: 'block', width: '100%' }}>
                    <Button 
                      variant="contained" 
                      onClick={fetchData} 
                      startIcon={<RefreshIcon />}
                      fullWidth
                      size="small"
                      sx={{ borderRadius: 2 }}
                    >
                      تحديث
                    </Button>
                  </span>
                </Tooltip>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Tooltip title="طباعة التقرير">
                  <span style={{ display: 'block', width: '100%' }}>
                    <Button
                      variant="outlined"
                      onClick={triggerPrint}
                      startIcon={<PrintIcon />}
                      fullWidth
                      size="small"
                      sx={{ borderRadius: 2 }}
                    >
                      طباعة
                    </Button>
                  </span>
                </Tooltip>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Tooltip title={selectedSectionId && selectedSectionId !== 'ALL' 
                  ? `حذف سجلات قسم ${selectedSection?.name || selectedSectionId}` 
                  : 'يرجى اختيار قسم محدد للحذف'
                }>
                  <span style={{ display: 'block', width: '100%' }}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setDeleteConfirmOpen(true)}
                      startIcon={<DeleteIcon />}
                      disabled={records.length === 0 || !selectedSectionId || selectedSectionId === 'ALL'}
                      fullWidth
                      size="small"
                      sx={{ borderRadius: 2 }}
                    >
                      {selectedSectionId && selectedSectionId !== 'ALL' ? 'حذف القسم' : 'حذف'}
                    </Button>
                  </span>
                </Tooltip>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1} sx={{ textAlign: 'center', borderRadius: 2 }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <PersonIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {presentSorted.length}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  الحاضرون
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1} sx={{ textAlign: 'center', borderRadius: 2 }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <PersonOffIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="error.main" sx={{ fontWeight: 'bold' }}>
                    {absentSorted.length}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  الغائبون
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1} sx={{ textAlign: 'center', borderRadius: 2 }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                  {records.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  إجمالي السجلات
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1} sx={{ textAlign: 'center', borderRadius: 2 }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h6" color="text.primary" sx={{ fontWeight: 'bold' }}>
                  {records.length > 0 ? Math.round((presentSorted.length / records.length) * 100) : 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  معدل الحضور
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Current Selection Info */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
          <Typography variant="body2" color="info.dark" sx={{ fontWeight: 'bold' }}>
            القسم: {selectedSectionId === 'ALL' ? 'كل الأقسام' : selectedSectionId ? (selectedSection?.name || 'قسم غير محدد') : 'غير محدد'} | 
            التاريخ: {selectedDate ? formatDateToArabic(selectedDate) : 'جميع التواريخ'}
          </Typography>
        </Box>
      </Paper>

      {/* Search Message */}
      {searchMessage && (
        <Alert severity="info" sx={{ mx: 2, mb: 2, borderRadius: 2 }}>
          {searchMessage}
        </Alert>
      )}

      {/* Data Content */}
      {records.length > 0 && (
        <Box sx={{ flex: 1, mx: 2, mb: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Tabs */}
          <Paper elevation={1} sx={{ borderRadius: '12px 12px 0 0' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              centered 
              sx={{ 
                '& .MuiTab-root': { 
                  fontWeight: 'bold',
                  borderRadius: '12px 12px 0 0'
                }
              }}
            >
              <Tab 
                label={`الحاضرون (${presentSorted.length})`} 
                icon={<PersonIcon />}
                iconPosition="start"
              />
              <Tab 
                label={`الغائبون (${absentSorted.length})`} 
                icon={<PersonOffIcon />}
                iconPosition="start"
              />
            </Tabs>
          </Paper>

          {/* Table Content - Unified Scroll */}
          <Paper 
            elevation={2} 
            sx={{ 
              flex: 1, 
              borderRadius: '0 0 12px 12px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: activeTab === 0 ? 'success.light' : 'error.light', 
                      color: activeTab === 0 ? 'success.contrastText' : 'error.contrastText',
                      width: '8%', 
                      textAlign: 'center' 
                    }}
                  >
                    ر.ت
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontWeight: 'bold', 
                        bgcolor: activeTab === 0 ? 'success.light' : 'error.light', 
                        color: activeTab === 0 ? 'success.contrastText' : 'error.contrastText',
                        width: '25%' 
                      }}
                    >
                      الاسم الكامل
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontWeight: 'bold', 
                        bgcolor: activeTab === 0 ? 'success.light' : 'error.light', 
                        color: activeTab === 0 ? 'success.contrastText' : 'error.contrastText',
                        width: '15%', 
                        textAlign: 'center' 
                      }}
                    >
                      القسم
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontWeight: 'bold', 
                        bgcolor: activeTab === 0 ? 'success.light' : 'error.light', 
                        color: activeTab === 0 ? 'success.contrastText' : 'error.contrastText',
                        width: '12%', 
                        textAlign: 'center' 
                      }}
                    >
                      التاريخ
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontWeight: 'bold', 
                        bgcolor: activeTab === 0 ? 'success.light' : 'error.light', 
                        color: activeTab === 0 ? 'success.contrastText' : 'error.contrastText',
                        width: '10%', 
                        textAlign: 'center' 
                      }}
                    >
                      الحصة
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontWeight: 'bold', 
                        bgcolor: activeTab === 0 ? 'success.light' : 'error.light', 
                        color: activeTab === 0 ? 'success.contrastText' : 'error.contrastText',
                        width: '10%', 
                        textAlign: 'center' 
                      }}
                    >
                      الفترة
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontWeight: 'bold', 
                        bgcolor: activeTab === 0 ? 'success.light' : 'error.light', 
                        color: activeTab === 0 ? 'success.contrastText' : 'error.contrastText',
                        width: '10%', 
                        textAlign: 'center' 
                      }}
                    >
                      عدد الغيابات
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontWeight: 'bold', 
                        bgcolor: activeTab === 0 ? 'success.light' : 'error.light', 
                        color: activeTab === 0 ? 'success.contrastText' : 'error.contrastText',
                        width: '10%', 
                        textAlign: 'center' 
                      }}
                    >
                      إجراء
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(activeTab === 0 ? presentSorted : absentSorted).map((record, idx) => {
                    const lessonInfo = getLessonInfo(record.createdAt || record.date);
                    const sectionName = sections.find(s => s.id === record.sectionId)?.name || record.sectionId;
                    
                    return (
                      <TableRow 
                        key={record.id} 
                        hover 
                        onDoubleClick={() => handleStudentDoubleClick(record)}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
                          {record.student?.classOrder ?? (idx + 1)}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.9rem' }}>
                          {`${record.student?.firstName ?? ''} ${record.student?.lastName ?? ''}`}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', fontSize: '0.85rem' }}>
                          {sectionName}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', fontSize: '0.85rem' }}>
                          {formatDateToArabic(record.date)}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', fontSize: '0.85rem' }}>
                          {lessonInfo ? lessonInfo.lessonNumber : '-'}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip 
                            label={lessonInfo?.period || 'غير محدد'}
                            size="small"
                            color={lessonInfo?.period === 'صباحية' ? 'primary' : 'secondary'}
                            sx={{ fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', fontSize: '0.9rem' }}>
                          {record.absences ?? 0}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Button 
                            variant="outlined" 
                            color={activeTab === 0 ? 'error' : 'success'}
                            size="small" 
                            onClick={() => togglePresence(record, !record.isPresent)}
                            sx={{ 
                              minWidth: 80, 
                              fontSize: '0.75rem',
                              borderRadius: 2
                            }}
                          >
                            {activeTab === 0 ? 'إلغاء الحضور' : 'إلغاء الغياب'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(activeTab === 0 ? presentSorted : absentSorted).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          {activeTab === 0 ? <PersonIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} /> : <PersonOffIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />}
                          <Typography variant="body1">
                            {activeTab === 0 ? 'لا يوجد طلاب حاضرون' : 'لا يوجد طلاب غائبون'} في هذا التاريخ
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          </Paper>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main', textAlign: 'center' }}>
          ⚠️ تأكيد حذف سجلات الحضور
        </DialogTitle>
        <DialogContent>
          {selectedSectionId && selectedSectionId !== 'ALL' ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                القسم المحدد: {selectedSection?.name || selectedSectionId}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedDate 
                  ? `سيتم حذف سجلات الحضور لهذا القسم في تاريخ: ${formatDateToArabic(selectedDate)}`
                  : 'سيتم حذف جميع سجلات الحضور لهذا القسم في جميع التواريخ'
                }
              </Typography>
              <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold' }}>
                هذا الإجراء لا يمكن التراجع عنه!
              </Typography>
            </Box>
          ) : (
            <Typography color="warning.main" sx={{ textAlign: 'center', py: 2 }}>
              يرجى اختيار قسم محدد أولاً. لا يمكن حذف جميع الأقسام لأسباب أمنية.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)}
            variant="outlined"
            size="large"
          >
            إلغاء
          </Button>
          {selectedSectionId && selectedSectionId !== 'ALL' && (
            <Button 
              onClick={handleDeleteAllRecords} 
              color="error" 
              variant="contained"
              disabled={isDeleting}
              size="large"
              sx={{ ml: 2 }}
            >
              {isDeleting ? 'جاري الحذف...' : `حذف سجلات ${selectedSection?.name || selectedSectionId}`}
            </Button>
          )}
        </DialogActions>
      </Dialog>

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
            gender: '',
            birthDate: '',
            total_xp: 0
          } : null}
          isOpen={true}
          onClose={() => setSelectedStudentForDetails(null)}
          onAssess={() => {}}
        />
      )}

      {/* Hidden print content */}
      <div ref={printRef} style={{ display: 'none' }}>
        {/* Print content remains the same */}
      </div>
    </Box>
  );
};

export default AbsenceHistoryContent;