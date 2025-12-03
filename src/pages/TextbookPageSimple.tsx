import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Stack
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';

import { fetchSections } from '../services/api/sectionService';
import { Section } from '../contexts/SectionsContext';

interface TextbookEntry {
  id: string;
  date: string;
  startTime: string;
  sectionId: string;
  sectionName: string;
  lessonNumber: string;
  subjectDetails: string;
  teacherSignature: string;
  completedStagesCount: number;
  totalStages: number;
}

const TextbookPage: React.FC = () => {
  // State Management
  const [textbookEntries, setTextbookEntries] = useState<TextbookEntry[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [didBackfill, setDidBackfill] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [sectionId, setSectionId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [quickDateFilter, setQuickDateFilter] = useState<string>('');

  // Print reference
  const printRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    loadSections();
    loadTextbookEntries();
  }, []);

  const loadSections = async () => {
    try {
      const sectionsData = await fetchSections();
      setSections(sectionsData);
    } catch (error) {
      console.error('خطأ في تحميل الأقسام:', error);
    }
  };

  const loadTextbookEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // بناء رابط API مع المعاملات
      const params = new URLSearchParams();
      if (sectionId && sectionId !== 'all') {
        params.append('sectionId', sectionId);
      }
      if (levelFilter && levelFilter !== 'all') {
        params.append('level', levelFilter);
      }
      if (dateFrom) {
        params.append('dateFrom', dateFrom);
      }
      if (dateTo) {
        params.append('dateTo', dateTo);
      }
      
      const response = await fetch(`http://localhost:4200/api/scheduled-lessons/textbook?${params.toString()}`);
      if (!response.ok) {
        throw new Error('فشل في تحميل البيانات');
      }
      
      const entries = await response.json();
      // إذا لم توجد بيانات وحاولنا لمرة واحدة التوليد، قم بنداء backfill ثم أعد التحميل
      if ((!entries || entries.length === 0) && !didBackfill) {
        try {
          await fetch(`http://localhost:4200/api/scheduled-lessons/textbook/backfill`, { method: 'POST' });
          setDidBackfill(true);
          // أعد التحميل بعد التوليد
          const retryResp = await fetch(`http://localhost:4200/api/scheduled-lessons/textbook?${params.toString()}`);
          if (retryResp.ok) {
            const retryEntries = await retryResp.json();
            setTextbookEntries(retryEntries);
          } else {
            setTextbookEntries(entries);
          }
        } catch (e) {
          console.warn('Backfill call failed:', e);
          setTextbookEntries(entries);
        }
      } else {
        setTextbookEntries(entries);
      }
    } catch (error: any) {
      setError('فشل في تحميل سجلات دفتر النصوص');
      console.error('خطأ في تحميل سجلات دفتر النصوص:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSectionId('');
    setLevelFilter('');
    setDateFrom('');
    setDateTo('');
    setQuickDateFilter('');
  };

  // دالة لحساب الفترات السريعة
  const applyQuickDateFilter = (filterType: string) => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = new Date(today);

    switch (filterType) {
      case 'current-week':
        // الأسبوع الحالي (من الأحد إلى السبت)
        const currentDayOfWeek = today.getDay(); // 0 = أحد, 1 = إثنين, إلخ
        startDate = new Date(today);
        startDate.setDate(today.getDate() - currentDayOfWeek);
        endDate.setDate(today.getDate() + (6 - currentDayOfWeek));
        break;

      case 'last-week':
        // الأسبوع السابق
        const lastWeekStart = new Date(today);
        const lastWeekDayOfWeek = today.getDay();
        lastWeekStart.setDate(today.getDate() - lastWeekDayOfWeek - 7);
        startDate = lastWeekStart;
        endDate = new Date(lastWeekStart);
        endDate.setDate(lastWeekStart.getDate() + 6);
        break;

      case 'current-month':
        // الشهر الحالي
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;

      case 'last-3-months':
        // آخر 3 أشهر
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 3);
        startDate.setDate(1);
        endDate = new Date(today);
        break;

      default:
        return;
    }

    // تحويل التواريخ لصيغة YYYY-MM-DD
    const formatDateForInput = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    setDateFrom(formatDateForInput(startDate));
    setDateTo(formatDateForInput(endDate));
    setQuickDateFilter(filterType);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // استخدام التقويم الميلادي بصراحة
      return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).split('/').reverse().join('/'); // تحويل من DD/MM/YYYY إلى YYYY/MM/DD للعرض العربي
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return timeString.split(':').slice(0, 2).join(':');
    } catch {
      return timeString;
    }
  };

  const formatTimeRange = (start?: string, end?: string) => {
    const s = start ? formatTime(start) : '';
    const e = end ? formatTime(end) : '';
    if (s && e) return `${s}-${e}`;
    return s || '';
  };

  const getWeekRange = () => {
    if (!textbookEntries.length) return '';
    
    const dates = textbookEntries.map(entry => new Date(entry.date)).sort((a, b) => a.getTime() - b.getTime());
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    
    const formatDateForWeek = (date: Date) => {
      // استخدام التقويم الميلادي مع أسماء الأشهر بالعربية
      const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      
      return `${day} ${month} ${year}`;
    };
    
    // إضافة بادئة حسب نوع الفلتر السريع المستخدم
    let prefix = '';
    switch (quickDateFilter) {
      case 'current-week':
        prefix = 'الأسبوع الحالي: ';
        break;
      case 'last-week':
        prefix = 'الأسبوع السابق: ';
        break;
      case 'current-month':
        prefix = 'الشهر الحالي: ';
        break;
      case 'last-3-months':
        prefix = 'آخر 3 أشهر: ';
        break;
    }
    
    // إذا كان المستخدم حدد فترة زمنية محددة من الفلاتر
    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      if (dateFrom === dateTo) {
        return `${prefix}اليوم: ${formatDateForWeek(fromDate)}`;
      } else {
        return `${prefix}الفترة المحددة من: ${formatDateForWeek(fromDate)} إلى: ${formatDateForWeek(toDate)}`;
      }
    }
    
    // إذا كان المستخدم حدد تاريخ "من" فقط
    if (dateFrom && !dateTo) {
      const fromDate = new Date(dateFrom);
      return `${prefix}من تاريخ: ${formatDateForWeek(fromDate)} إلى: ${formatDateForWeek(endDate)}`;
    }
    
    // إذا كان المستخدم حدد تاريخ "إلى" فقط
    if (!dateFrom && dateTo) {
      const toDate = new Date(dateTo);
      return `${prefix}من: ${formatDateForWeek(startDate)} إلى تاريخ: ${formatDateForWeek(toDate)}`;
    }
    
    // الحالة الافتراضية: عرض الفترة الكاملة للبيانات المتاحة
    if (startDate.getTime() === endDate.getTime()) {
      // إذا كان يوم واحد فقط
      return `${prefix}اليوم: ${formatDateForWeek(startDate)}`;
    } else {
      // إذا كان أسبوع أو فترة متعددة الأيام
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) {
        return `${prefix}الأسبوع من: ${formatDateForWeek(startDate)} إلى: ${formatDateForWeek(endDate)}`;
      } else {
        return `${prefix}الفترة من: ${formatDateForWeek(startDate)} إلى: ${formatDateForWeek(endDate)} (${daysDiff} يوم)`;
      }
    }
  };

  // Helper function to get selected section name for print title
  const getSelectedSectionName = () => {
    if (sectionId) {
      const section = sections.find(s => s.id === sectionId);
      return section ? section.name : 'قسم-محدد';
    }
    if (levelFilter) {
      return levelFilter.replace(' ', '-');
    }
    return 'جميع-الأقسام';
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `دفتر-النصوص-${getSelectedSectionName()}-${formatDate(new Date().toISOString())}`,
    pageStyle: `
      @page { 
        size: A4 portrait; 
        margin: 15mm 10mm; 
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact; 
          font-family: 'Arial', sans-serif;
          direction: rtl;
          text-align: right;
          margin: 0;
          padding: 0;
        }
        .no-print { display: none !important; }
        .print-container { 
          width: 100%; 
          max-width: none;
          margin: 0;
          padding: 0;
        }
        table { 
          border-collapse: collapse; 
          width: 100%; 
          margin: 0;
        }
        th, td { 
          border: 1px solid #000; 
          padding: 6px 4px; 
          font-size: 10px;
          text-align: center;
          vertical-align: middle;
          word-wrap: break-word;
        }
        thead th { 
          background: #f0f0f0 !important; 
          font-weight: bold;
          font-size: 11px;
        }
        .print-header {
          text-align: center;
          margin-bottom: 10px;
          font-size: 16px;
          font-weight: bold;
        }
        .print-subtitle {
          text-align: center;
          margin-bottom: 15px;
          font-size: 12px;
        }
        .week-range {
          text-align: center;
          margin-bottom: 15px;
          font-size: 14px;
          font-weight: bold;
          border: 1px solid #ccc;
          padding: 8px;
          background: #f9f9f9;
        }
        .subject-details {
          text-align: right !important;
          padding-right: 8px !important;
          font-size: 9px;
          line-height: 1.2;
        }
      }
    `,
  } as any);

  // تحميل البيانات عند تغيير الفلاتر
  useEffect(() => {
    loadTextbookEntries();
  }, [sectionId, levelFilter, dateFrom, dateTo, quickDateFilter]);

  return (
    <Box sx={{ p: 3 }} dir="rtl">
      <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        دفتر النصوص
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* أدوات التحكم والفلاتر */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadTextbookEntries}
            disabled={loading}
          >
            تحديث
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={loading}
          >
            طباعة
          </Button>
        </Stack>

        {/* فلاتر البحث */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>المستوى التعليمي</InputLabel>
              <Select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                label="المستوى التعليمي"
              >
                <MenuItem value="">جميع المستويات</MenuItem>
                <MenuItem value="جذع مشترك">جذع مشترك</MenuItem>
                <MenuItem value="أولى بكالوريا">أولى بكالوريا</MenuItem>
                <MenuItem value="ثانية بكالوريا">ثانية بكالوريا</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>القسم</InputLabel>
              <Select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                label="القسم"
              >
                <MenuItem value="">جميع الأقسام</MenuItem>
                {sections
                  .filter(section => {
                    if (!levelFilter) return true;
                    const normalize = (s?: string) => {
                      if (typeof s !== 'string') return '';
                      let t = s.normalize('NFC').replace(/\s+/g, '');
                      t = t.replace(/باكالوريا/g, 'بكالوريا');
                      return t.trim();
                    };
                    return normalize(section.educationalLevel) === normalize(levelFilter);
                  })
                  .map((section) => (
                  <MenuItem key={section.id} value={section.id}>
                    {section.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>فترة سريعة</InputLabel>
              <Select
                value={quickDateFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    applyQuickDateFilter(value);
                  } else {
                    setQuickDateFilter('');
                    setDateFrom('');
                    setDateTo('');
                  }
                }}
                label="فترة سريعة"
              >
                <MenuItem value="">اختيار يدوي</MenuItem>
                <MenuItem value="current-week">الأسبوع الحالي</MenuItem>
                <MenuItem value="last-week">الأسبوع السابق</MenuItem>
                <MenuItem value="current-month">الشهر الحالي</MenuItem>
                <MenuItem value="last-3-months">آخر 3 أشهر</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="من تاريخ"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setQuickDateFilter(''); // إلغاء الفلتر السريع عند التعديل اليدوي
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="إلى تاريخ"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setQuickDateFilter(''); // إلغاء الفلتر السريع عند التعديل اليدوي
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              size="small"
              fullWidth
            >
              مسح الفلاتر
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* عرض الأسبوع */}
      {textbookEntries.length > 0 && (
        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', color: 'primary.main' }}>
          {getWeekRange()}
        </Typography>
      )}

      {/* جدول دفتر النصوص */}
      <TableContainer component={Paper} sx={{ direction: 'rtl' }}>
        <Table sx={{ direction: 'rtl' }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>التاريخ</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>التوقيت</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>القسم</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>الحصة</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>تفصيل الموضوع</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>التوقيع/الملاحظات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : textbookEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  لا توجد حصص مع مراحل منجزة للفترة المحددة
                </TableCell>
              </TableRow>
            ) : (
              textbookEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell align="center">{formatDate(entry.date)}</TableCell>
                  <TableCell align="center">{formatTimeRange((entry as any).startTime, (entry as any).endTime)}</TableCell>
                  <TableCell align="center">{entry.sectionName}</TableCell>
                  <TableCell align="center">{entry.lessonNumber}</TableCell>
                  <TableCell sx={{ maxWidth: 300, whiteSpace: 'pre-line', textAlign: 'right' }}>
                    {entry.subjectDetails}
                  </TableCell>
                  <TableCell sx={{ width: 150 }} align="center">
                    {/* فارغ للملء اليدوي */}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* محتوى الطباعة المخفي */}
      <Box 
        ref={printRef} 
        className="print-container" 
        sx={{ 
          display: 'none', 
          direction: 'rtl',
          '@media print': { 
            display: 'block',
            margin: 0,
            padding: 0,
            width: '100%'
          } 
        }}
      >
        <div className="print-header">دفتر النصوص</div>
        <div className="print-subtitle">
          {sectionId ? 
            `القسم: ${sections.find(s => s.id === sectionId)?.name || 'غير محدد'}` : 
            levelFilter ? 
              `المستوى: ${levelFilter}` : 
              'جميع الأقسام'
          }
          {(dateFrom || dateTo) && (
            <span> - الفترة: {dateFrom || 'البداية'} إلى {dateTo || 'النهاية'}</span>
          )}
        </div>
        
        {/* عرض معلومات الأسبوع */}
        {textbookEntries.length > 0 && (
          <div className="week-range">
            {getWeekRange()}
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '10%', border: '1px solid #000', padding: '6px' }}>التاريخ</th>
              <th style={{ width: '12%', border: '1px solid #000', padding: '6px' }}>التوقيت</th>
              <th style={{ width: '12%', border: '1px solid #000', padding: '6px' }}>القسم</th>
              <th style={{ width: '8%', border: '1px solid #000', padding: '6px' }}>الحصة</th>
              <th style={{ width: '43%', border: '1px solid #000', padding: '6px' }}>تفصيل الموضوع</th>
              <th style={{ width: '15%', border: '1px solid #000', padding: '6px' }}>التوقيع/الملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {textbookEntries.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ border: '1px solid #000', padding: '20px', textAlign: 'center' }}>
                  لا توجد حصص مع مراحل منجزة للفترة المحددة
                </td>
              </tr>
            ) : (
              textbookEntries.map((entry) => (
                <tr key={`print-${entry.id}`}>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                    {formatDate(entry.date)}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                    {formatTimeRange((entry as any).startTime, (entry as any).endTime)}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                    {entry.sectionName}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                    {entry.lessonNumber}
                  </td>
                  <td className="subject-details" style={{ border: '1px solid #000', padding: '6px' }}>
                    {entry.subjectDetails}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                    {/* فارغ للملء اليدوي */}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Box>
    </Box>
  );
};

export default TextbookPage;