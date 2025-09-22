import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  AutoAwesome as AutoIcon,
  Schedule as ScheduleIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

import { TextbookEntry, TextbookFilter, TextbookStats } from '../types/textbookTypes';
import { textbookService } from '../services/textbookService';
import { fetchSections } from '../services/api/sectionService';
import { Section } from '../contexts/SectionsContext';
import TextbookEditModal from '../components/TextbookEditModal';

interface TextbookPageProps {}

const TextbookPage: React.FC<TextbookPageProps> = () => {
  // State Management
  const [textbookEntries, setTextbookEntries] = useState<TextbookEntry[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TextbookStats | null>(null);

  // Filter State
  const [filter, setFilter] = useState<TextbookFilter>({
    sectionId: '',
    dateFrom: '',
    dateTo: '',
    teacherSignature: ''
  });

  // Dialog States
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [openStatsDialog, setOpenStatsDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);
  const [selectedEntry, setSelectedEntry] = useState<TextbookEntry | null>(null);
  const [isNewEntry, setIsNewEntry] = useState(false);

  // Generation State
  const [generateForm, setGenerateForm] = useState({
    type: 'period',
    sectionId: '',
    startDate: '',
    endDate: '',
    days: 7
  });

  // Load initial data
  useEffect(() => {
    loadSections();
    loadTextbookEntries();
    loadStats();
  }, []);

  // Load data when filter changes
  useEffect(() => {
    loadTextbookEntries();
    loadStats();
  }, [filter]);

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
      
      const entries = await textbookService.getTextbookEntries(filter);
      setTextbookEntries(entries);
    } catch (error) {
      setError('فشل في تحميل سجلات دفتر النصوص');
      console.error('خطأ في تحميل سجلات دفتر النصوص:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await textbookService.getTextbookStats(filter);
      setStats(statsData);
    } catch (error) {
      console.error('خطأ في تحميل الإحصائيات:', error);
    }
  };

  const loadSchedulerStatus = async () => {
    try {
      const status = await textbookService.getSchedulerStatus();
      setSchedulerStatus(status);
    } catch (error) {
      console.error('خطأ في تحميل حالة المجدول:', error);
    }
  };

  const handleFilterChange = (field: keyof TextbookFilter, value: string) => {
    setFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilter({
      sectionId: '',
      dateFrom: '',
      dateTo: '',
      teacherSignature: ''
    });
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      let result;

      switch (generateForm.type) {
        case 'period':
          result = await textbookService.generateEntriesForPeriod(
            generateForm.startDate,
            generateForm.endDate
          );
          break;
        case 'section':
          result = await textbookService.generateEntriesForSection(
            generateForm.sectionId,
            generateForm.startDate,
            generateForm.endDate
          );
          break;
        case 'auto':
          result = await textbookService.runAutoGeneration(generateForm.days);
          break;
        default:
          throw new Error('نوع التوليد غير مدعوم');
      }

      setOpenGenerateDialog(false);
      setError(null);
      alert(`${result.message}\\n تم توليد ${result.count} سجل`);
      
      // Reload data
      await loadTextbookEntries();
      await loadStats();
      
    } catch (error: any) {
      setError(error.message || 'فشل في توليد السجلات');
    } finally {
      setLoading(false);
    }
  };

  const handleRunImmediateGeneration = async () => {
    try {
      setLoading(true);
      const result = await textbookService.runImmediateGeneration(1);
      alert(`${result.message}\\n تم توليد ${result.count} سجل`);
      
      await loadTextbookEntries();
      await loadStats();
    } catch (error: any) {
      setError(error.message || 'فشل في التوليد الفوري');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEntry = (entry: TextbookEntry) => {
    setSelectedEntry(entry);
    setIsNewEntry(false);
    setOpenEditDialog(true);
  };

  const handleNewEntry = () => {
    setSelectedEntry(null);
    setIsNewEntry(true);
    setOpenEditDialog(true);
  };

  const handleSaveEntry = async (entry: TextbookEntry) => {
    try {
      if (isNewEntry) {
        await textbookService.createTextbookEntry(entry);
      } else {
        await textbookService.updateTextbookEntry(entry.id, entry);
      }
      
      await loadTextbookEntries();
      await loadStats();
      setOpenEditDialog(false);
    } catch (error: any) {
      throw new Error(error.message || 'فشل في حفظ السجل');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      return;
    }

    try {
      await textbookService.deleteTextbookEntry(id);
      await loadTextbookEntries();
      await loadStats();
    } catch (error: any) {
      setError(error.message || 'فشل في حذف السجل');
    }
  };

  const getSectionName = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    return section?.name || sectionId;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy/MM/dd', { locale: ar });
    } catch {
      return dateString;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ar}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
          دفتر النصوص
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* إحصائيات سريعة */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>إجمالي السجلات</Typography>
                  <Typography variant="h5">{stats.totalEntries}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>السجلات المولدة تلقائياً</Typography>
                  <Typography variant="h5" color="primary">{stats.autoGeneratedEntries}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>السجلات اليدوية</Typography>
                  <Typography variant="h5" color="secondary">{stats.manualEntries}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color=\"textSecondary\" gutterBottom>عدد الأقسام</Typography>
                  <Typography variant=\"h5\">{stats.sectionsStats.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* أدوات التحكم العلوية */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction=\"row\" spacing={2} sx={{ mb: 2 }}>
            <Button
              variant=\"contained\"
              startIcon={<AutoIcon />}
              onClick={() => setOpenGenerateDialog(true)}
              disabled={loading}
            >
              التوليد التلقائي
            </Button>
            <Button
              variant=\"outlined\"
              startIcon={<ScheduleIcon />}
              onClick={handleRunImmediateGeneration}
              disabled={loading}
            >
              توليد فوري
            </Button>
            <Button
              variant=\"outlined\"
              startIcon={<RefreshIcon />}
              onClick={loadTextbookEntries}
              disabled={loading}
            >
              تحديث
            </Button>
            <Button
              variant=\"outlined\"
              startIcon={<DownloadIcon />}
              disabled={loading}
            >
              تصدير
            </Button>
          </Stack>

          {/* فلاتر البحث */}
          <Grid container spacing={2} alignItems=\"center\">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size=\"small\">
                <InputLabel>القسم</InputLabel>
                <Select
                  value={filter.sectionId}
                  onChange={(e) => handleFilterChange('sectionId', e.target.value)}
                  label=\"القسم\"
                >
                  <MenuItem value=\"\">جميع الأقسام</MenuItem>
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
                size=\"small\"
                label=\"من تاريخ\"
                type=\"date\"
                value={filter.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size=\"small\"
                label=\"إلى تاريخ\"
                type=\"date\"
                value={filter.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size=\"small\"
                label=\"المعلم\"
                value={filter.teacherSignature}
                onChange={(e) => handleFilterChange('teacherSignature', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button
                variant=\"outlined\"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                size=\"small\"
                fullWidth
              >
                مسح
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* جدول السجلات */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>التاريخ</TableCell>
                <TableCell>القسم</TableCell>
                <TableCell>المادة</TableCell>
                <TableCell>عنوان الدرس</TableCell>
                <TableCell>المعلم</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>نسبة الإنجاز</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align=\"center\">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : textbookEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align=\"center\">
                    لا توجد سجلات
                  </TableCell>
                </TableRow>
              ) : (
                textbookEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell>{getSectionName(entry.sectionId)}</TableCell>
                    <TableCell>{entry.subject}</TableCell>
                    <TableCell>{entry.lessonTitle}</TableCell>
                    <TableCell>{entry.teacher}</TableCell>
                    <TableCell>
                      <Chip
                        label={entry.isAutoGenerated ? 'تلقائي' : 'يدوي'}
                        color={entry.isAutoGenerated ? 'primary' : 'secondary'}
                        size=\"small\"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${entry.completionRate}%`}
                        color={entry.completionRate >= 80 ? 'success' : entry.completionRate >= 60 ? 'warning' : 'error'}
                        size=\"small\"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size=\"small\" color=\"primary\">
                        <EditIcon />
                      </IconButton>
                      <IconButton size=\"small\" color=\"error\">
                        <DeleteIcon />
                      </IconButton>
                      <IconButton size=\"small\">
                        <PrintIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* حوار التوليد التلقائي */}
        <Dialog open={openGenerateDialog} onClose={() => setOpenGenerateDialog(false)} maxWidth=\"sm\" fullWidth>
          <DialogTitle>التوليد التلقائي لسجلات دفتر النصوص</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>نوع التوليد</InputLabel>
                  <Select
                    value={generateForm.type}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, type: e.target.value }))}
                    label=\"نوع التوليد\"
                  >
                    <MenuItem value=\"period\">فترة زمنية محددة</MenuItem>
                    <MenuItem value=\"section\">قسم معين</MenuItem>
                    <MenuItem value=\"auto\">آخر عدة أيام</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {generateForm.type === 'section' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>القسم</InputLabel>
                    <Select
                      value={generateForm.sectionId}
                      onChange={(e) => setGenerateForm(prev => ({ ...prev, sectionId: e.target.value }))}
                      label=\"القسم\"
                    >
                      {sections.map((section) => (
                        <MenuItem key={section.id} value={section.id}>
                          {section.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {(generateForm.type === 'period' || generateForm.type === 'section') && (
                <>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label=\"تاريخ البداية\"
                      type=\"date\"
                      value={generateForm.startDate}
                      onChange={(e) => setGenerateForm(prev => ({ ...prev, startDate: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label=\"تاريخ النهاية\"
                      type=\"date\"
                      value={generateForm.endDate}
                      onChange={(e) => setGenerateForm(prev => ({ ...prev, endDate: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}

              {generateForm.type === 'auto' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label=\"عدد الأيام\"
                    type=\"number\"
                    value={generateForm.days}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, days: parseInt(e.target.value) || 7 }))}
                    inputProps={{ min: 1, max: 30 }}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenGenerateDialog(false)}>إلغاء</Button>
            <Button onClick={handleGenerate} variant=\"contained\" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'توليد'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default TextbookPage;