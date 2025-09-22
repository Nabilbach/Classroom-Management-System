import React, { useState, useEffect } from 'react';
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
      if (dateFrom) {
        params.append('dateFrom', dateFrom);
      }
      if (dateTo) {
        params.append('dateTo', dateTo);
      }
      
      const response = await fetch(`http://localhost:3000/api/scheduled-lessons/textbook?${params.toString()}`);
      if (!response.ok) {
        throw new Error('فشل في تحميل البيانات');
      }
      
      const entries = await response.json();
      // إذا لم توجد بيانات وحاولنا لمرة واحدة التوليد، قم بنداء backfill ثم أعد التحميل
      if ((!entries || entries.length === 0) && !didBackfill) {
        try {
          await fetch(`http://localhost:3000/api/scheduled-lessons/textbook/backfill`, { method: 'POST' });
          setDidBackfill(true);
          // أعد التحميل بعد التوليد
          const retryResp = await fetch(`http://localhost:3000/api/scheduled-lessons/textbook?${params.toString()}`);
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
    setDateFrom('');
    setDateTo('');
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ar');
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

  const formatTimeRange = (start?: string, end?: string, duration?: number) => {
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
    
    return `الأسبوع من: ${formatDate(startDate.toISOString())} إلى: ${formatDate(endDate.toISOString())}`;
  };

  const handlePrint = () => {
    window.print();
  };

  // تحميل البيانات عند تغيير الفلاتر
  useEffect(() => {
    loadTextbookEntries();
  }, [sectionId, dateFrom, dateTo]);

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
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>القسم</InputLabel>
              <Select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                label="القسم"
              >
                <MenuItem value="">جميع الأقسام</MenuItem>
                {sections.map((section) => (
                  <MenuItem key={section.id} value={section.id}>
                    {section.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="من تاريخ"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="إلى تاريخ"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
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
                  <TableCell align="center">{formatTimeRange((entry as any).startTime, (entry as any).endTime, (entry as any).duration)}</TableCell>
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
    </Box>
  );
};

export default TextbookPage;