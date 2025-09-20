import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  useMediaQuery,
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { useSections } from '../contexts/SectionsContext';
import { useReactToPrint } from 'react-to-print';

interface AttendanceRecord {
  id: number;
  studentId: number;
  sectionId: string;
  date: string;
  isPresent: boolean;
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
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const { sections } = useSections();

  // Find selected section object
  const selectedSection = useMemo(() => sections.find(s => s.id === selectedSectionId), [sections, selectedSectionId]);

  // Tab change handler
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    if (sections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(sections[0].id);
    }
  }, [sections, selectedSectionId]);

  const fetchData = async () => {
    if (!selectedSectionId) return;
    try {
      const sectionParam = encodeURIComponent(selectedSection?.name ?? selectedSectionId);
      const response = await fetch(`http://localhost:3000/api/attendance?sectionId=${sectionParam}&date=${encodeURIComponent(selectedDate)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setRecords([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSectionId, selectedDate]);

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

  // Print handling via react-to-print
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `سجل-الحضور-والغياب-${selectedSection?.name ?? 'قسم'}-${selectedDate}`,
    pageStyle: `@page { size: auto; margin: 12mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .print-container { width: 100%; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #000; padding: 6px; font-size: 12px; }
      thead th { background: #eee !important; }
      h1, h2, h3 { margin: 0 0 8px 0; }
    `,
  } as any);

  const handleDeleteDay = async () => {
    if (!selectedSectionId || !selectedDate) return;
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
            <TextField
              type="date"
              label="التاريخ"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 120 }}
            />
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>القسم</InputLabel>
              <Select
                value={selectedSectionId}
                label="القسم"
                onChange={(e) => setSelectedSectionId(e.target.value)}
              >
                {sections.map(section => (
                  <MenuItem key={section.id} value={section.id}>
                    {section.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" onClick={fetchData} sx={{ height: 56 }}>
              تحديث البيانات
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
        {/* Section and Date Info */}
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography variant="subtitle1" color="text.secondary">
            {selectedSection?.name || 'قسم غير محدد'} - {selectedDate}
          </Typography>
        </Box>
        {/* Tabs */}
        <Tabs value={activeTab} onChange={handleTabChange} centered sx={{ mb: 2 }}>
          <Tab label={`الحاضرون (${presentSorted.length})`} />
          <Tab label={`الغائبون (${absentSorted.length})`} />
        </Tabs>
        {/* Table Content */}
        <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
          {activeTab === 0 && (
            <TableContainer component={Paper} sx={{ mb: 2, boxShadow: 2 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'success.light', color: 'success.contrastText', width: '10%', textAlign: 'center' }}>
                      ر.ت
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'success.light', color: 'success.contrastText', width: '40%' }}>
                      الاسم الكامل
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'success.light', color: 'success.contrastText', width: '25%', textAlign: 'center' }}>
                      عدد الغيابات
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'success.light', color: 'success.contrastText', width: '25%', textAlign: 'center' }}>
                      إجراء
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {presentSorted.map((r, idx) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                        {r.student?.classOrder ?? (idx + 1)}
                      </TableCell>
                      <TableCell>
                        {`${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`}
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
                  ))}
                  {presentSorted.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        لا يوجد طلاب حاضرون في هذا التاريخ
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {activeTab === 1 && (
            <TableContainer component={Paper} sx={{ mb: 2, boxShadow: 2 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'error.light', color: 'error.contrastText', width: '10%', textAlign: 'center' }}>
                      ر.ت
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'error.light', color: 'error.contrastText', width: '40%' }}>
                      الاسم الكامل
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'error.light', color: 'error.contrastText', width: '25%', textAlign: 'center' }}>
                      عدد الغيابات
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'error.light', color: 'error.contrastText', width: '25%', textAlign: 'center' }}>
                      إجراء
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {absentSorted.map((r, idx) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                        {r.student?.classOrder ?? (idx + 1)}
                      </TableCell>
                      <TableCell>
                        {`${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`}
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
                  ))}
                  {absentSorted.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
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

      {/* Hidden print-only content: includes both tables without actions */}
      <Box ref={printRef} className="print-container" sx={{ display: 'none', p: 3, '@media print': { display: 'block' } }}>
        <Typography variant="h5" align="center" fontWeight="bold" sx={{ mb: 1 }}>سجل الحضور والغياب</Typography>
        <Typography variant="subtitle1" align="center" sx={{ mb: 3 }}>
          {selectedSection?.name || 'قسم غير محدد'} - {selectedDate}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>الحاضرون ({presentSorted.length})</Typography>
          <table>
            <thead>
              <tr>
                <th style={{ width: '10%' }}>ر.ت</th>
                <th style={{ width: '55%' }}>الاسم الكامل</th>
                <th style={{ width: '20%' }}>عدد الغيابات</th>
                <th style={{ width: '15%' }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {presentSorted.map((r, idx) => (
                <tr key={`p-${r.id}`}>
                  <td align="center">{r.student?.classOrder ?? (idx + 1)}</td>
                  <td>{`${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`}</td>
                  <td align="center">{r.absences ?? 0}</td>
                  <td align="center">حاضر</td>
                </tr>
              ))}
              {presentSorted.length === 0 && (
                <tr>
                  <td colSpan={4} align="center">لا يوجد طلاب حاضرون</td>
                </tr>
              )}
            </tbody>
          </table>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 1 }}>الغائبون ({absentSorted.length})</Typography>
          <table>
            <thead>
              <tr>
                <th style={{ width: '10%' }}>ر.ت</th>
                <th style={{ width: '55%' }}>الاسم الكامل</th>
                <th style={{ width: '20%' }}>عدد الغيابات</th>
                <th style={{ width: '15%' }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {absentSorted.map((r, idx) => (
                <tr key={`a-${r.id}`}>
                  <td align="center">{r.student?.classOrder ?? (idx + 1)}</td>
                  <td>{`${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`}</td>
                  <td align="center">{r.absences ?? 0}</td>
                  <td align="center">غائب</td>
                </tr>
              ))}
              {absentSorted.length === 0 && (
                <tr>
                  <td colSpan={4} align="center">لا يوجد طلاب غائبون</td>
                </tr>
              )}
            </tbody>
          </table>
        </Box>
      </Box>

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
          onClick={handlePrint}
          sx={{ minWidth: 100 }}
        >
          طباعة
        </Button>
      </Box>
    </Card>
  );
};

export default AbsenceHistoryContent;