import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Typography,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

interface ElementScore {
  [key: string]: number | null;
}

interface GridRow {
  studentId: number;
  familyName: string;
  fullName: string;
  pathwayNumber: string;
  classOrder: number | null;
  latestAssessmentDate: string | null;
  elementScores: ElementScore;
  finalScore: number | null;
}

interface AssessmentGridRTLProps {
  sectionId: string | number;
}

const getScoreColor = (score: number | null): string => {
  if (score === null) return '#999';
  if (score >= 9) return '#4caf50'; // Green
  if (score >= 7) return '#ffb74d'; // Orange
  if (score >= 5) return '#ff9800'; // Orange
  return '#f44336'; // Red
};

const AssessmentGridRTL: React.FC<AssessmentGridRTLProps> = ({ sectionId }) => {
  const [grid, setGrid] = useState<GridRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [columnKeys, setColumnKeys] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'pdf' | null>(null);

  const keyMap: { [key: string]: string } = {
    attendance: 'الحضور',
    attendance_score: 'الحضور',
    presence: 'الحضور',
    notebook: 'الدفتر',
    notebook_score: 'الدفتر',
    homework: 'الواجب',
    homework_score: 'الواجب',
    portfolio_score: 'الملف',
    assignments: 'الواجب',
    behavior: 'السلوك',
    behavior_score: 'السلوك',
    quiz: 'اختبار',
    test: 'اختبار',
    project: 'مشروع'
  };

  useEffect(() => {
    fetchGrid();
  }, [sectionId]);

  const fetchGrid = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/sections/${sectionId}/assessment-grid`);
      if (!response.ok) {
        throw new Error('فشل تحميل شبكة التقييم');
      }
      const data = await response.json();
      setGrid(data.grid || []);

      // Extract all unique column keys from element scores
      const allKeys = new Set<string>();
      data.grid?.forEach((row: GridRow) => {
        Object.keys(row.elementScores || {}).forEach(k => allKeys.add(k));
      });
      setColumnKeys(Array.from(allKeys));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  };

  const handleExportClick = (type: 'excel' | 'pdf') => {
    setExportType(type);
    setConfirmDialog(true);
  };

  const handleConfirmExport = async () => {
    if (!exportType) return;
    
    setConfirmDialog(false);
    setExporting(true);
    
    try {
      const endpoint = `/api/sections/${sectionId}/assessment-grid.${exportType === 'excel' ? 'xlsx' : 'pdf'}`;
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`فشل التحميل: ${response.statusText}`);
      }

      // Get filename from header or generate default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = contentDisposition
        ? contentDisposition.split('filename="')[1]?.split('"')[0] || `assessment-grid.${exportType === 'excel' ? 'xlsx' : 'pdf'}`
        : `assessment-grid.${exportType === 'excel' ? 'xlsx' : 'pdf'}`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`خطأ: ${err instanceof Error ? err.message : 'فشل التحميل'}`);
    } finally {
      setExporting(false);
      setExportType(null);
    }
  };

  if (loading) {
    return (
      <Card sx={{ mt: 2 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (grid.length === 0) {
    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Alert severity="info">لا توجد بيانات تقييمات لهذا القسم</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent sx={{ dir: 'rtl' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            شبكة التقييم - جميع الطلاب ({grid.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={exporting && exportType === 'excel' ? <CircularProgress size={20} /> : <DownloadIcon />}
              onClick={() => handleExportClick('excel')}
              disabled={exporting}
            >
              📊 تحميل Excel
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={exporting && exportType === 'pdf' ? <CircularProgress size={20} /> : <DownloadIcon />}
              onClick={() => handleExportClick('pdf')}
              disabled={exporting}
            >
              📋 تحميل PDF
            </Button>
          </Box>
        </Box>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
          <DialogTitle>تأكيد التحميل</DialogTitle>
          <DialogContent>
            <Typography>
              هل تريد تحميل شبكة التقييم بصيغة {exportType === 'excel' ? 'Excel' : 'PDF'}؟
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialog(false)}>إلغاء</Button>
            <Button onClick={handleConfirmExport} variant="contained">
              تحميل
            </Button>
          </DialogActions>
        </Dialog>

        {/* Responsive Table with RTL Layout */}
        <TableContainer sx={{ overflowX: 'auto', dir: 'rtl' }}>
          <Table sx={{ minWidth: 800 }} aria-label="assessment grid">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    minWidth: 80
                  }}
                >
                  النقطة النهائية
                </TableCell>
                {columnKeys.reverse().map((key) => (
                  <TableCell
                    key={key}
                    align="center"
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: '#2196f3',
                      color: 'white',
                      minWidth: 60
                    }}
                  >
                    {keyMap[key] || key}
                  </TableCell>
                ))}
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    minWidth: 100
                  }}
                >
                  آخر تقييم
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    minWidth: 120
                  }}
                >
                  الاسم العائلي
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    minWidth: 100
                  }}
                >
                  الاسم الشخصي
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    minWidth: 60
                  }}
                >
                  الرمز
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    minWidth: 50
                  }}
                >
                  الرقم
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {grid.map((row, idx) => (
                <TableRow
                  key={row.studentId}
                  sx={{
                    backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#fff',
                    '&:hover': { backgroundColor: '#f0f7ff' }
                  }}
                >
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 'bold',
                      fontSize: 14,
                      color: getScoreColor(row.finalScore),
                      backgroundColor: 'rgba(0,0,0,0.02)'
                    }}
                  >
                    {row.finalScore !== null ? row.finalScore.toFixed(2) : '-'}
                  </TableCell>
                  {columnKeys.reverse().map((key) => {
                    const score = row.elementScores[key];
                    return (
                      <TableCell
                        key={`${row.studentId}-${key}`}
                        align="center"
                        sx={{
                          color: getScoreColor(score),
                          fontWeight: '600'
                        }}
                      >
                        {score !== null ? score.toFixed(2) : '-'}
                      </TableCell>
                    );
                  })}
                  <TableCell align="right" sx={{ fontSize: 13 }}>
                    {row.latestAssessmentDate
                      ? new Date(row.latestAssessmentDate).toLocaleDateString('ar-SA')
                      : '-'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: '500' }}>
                    {row.familyName}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: '500' }}>
                    {row.fullName.split(' ')[0]}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: '600', color: '#0288d1' }}>
                    {row.pathwayNumber}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: 'rgba(33, 150, 243, 0.1)',
                      borderRadius: 1
                    }}
                  >
                    {row.classOrder || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Legend */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>
            مفتاح الألوان:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip label="ممتاز (9-10)" sx={{ backgroundColor: '#4caf50', color: 'white' }} />
            <Chip label="جيد جداً (7-9)" sx={{ backgroundColor: '#ffb74d', color: 'white' }} />
            <Chip label="جيد (5-7)" sx={{ backgroundColor: '#ff9800', color: 'white' }} />
            <Chip label="ضعيف (<5)" sx={{ backgroundColor: '#f44336', color: 'white' }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AssessmentGridRTL;
