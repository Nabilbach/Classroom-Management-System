import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Tabs,
  Tab,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Card,
  CardContent,
  IconButton,
  Snackbar,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useSections } from '../../contexts/SectionsContext';
import { useSettings } from '../../contexts/SettingsContext';
import type { Student as UnifiedStudent } from '../../types/student';

interface AssessmentRecord {
  date: string;
  scores: { [elementId: string]: string };
  notes: string;
}

// Use unified student type and extend with optional assessments for this modal
interface Student extends UnifiedStudent {
  assessments?: AssessmentRecord[];
}

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onAssess: (student: Student) => void;
}

function StudentDetailModal({ isOpen, onClose, student, onAssess }: StudentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const { sections } = useSections();
  const { assessmentElements } = useSettings();
  const [copied, setCopied] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  if (!student) return null;

  // Ensure matching even if sectionId types differ (string vs number)
  const section = sections.find(s => String(s.id) === String(student.sectionId));

  const fullName = `${student.firstName} ${student.lastName}`.trim();
  const pathway = student.pathwayNumber || student.trackNumber || '';

  const handleCopy = async (key: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setSnackbarOpen(true);
      setTimeout(() => setCopied(null), 1500);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
      alert('تعذر النسخ إلى الحافظة.');
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <>
      <Dialog 
        open={isOpen} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        dir="rtl"
        PaperProps={{
          sx: { direction: 'rtl' }
        }}
      >
        <DialogTitle sx={{ textAlign: 'right', fontWeight: 'bold' }}>
          تفاصيل الطالب: {student.firstName} {student.lastName}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ width: '100%' }}>
            <Tabs value={activeTab} onChange={handleTabChange} centered>
              <Tab label="نظرة عامة" />
              <Tab label="التقييمات" />
              <Tab label="سجل السلوك" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ mt: 2 }}>
            {activeTab === 0 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  معلومات الطالب
                </Typography>
                <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', width: '30%' }}>
                          الاسم الكامل
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography>{fullName || '—'}</Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleCopy('name', fullName)}
                              title="نسخ الاسم"
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                          رمز مسار
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography>{pathway || '—'}</Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleCopy('pathway', String(pathway))}
                              title="نسخ رمز مسار"
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                          القسم
                        </TableCell>
                        <TableCell>{section ? section.name : 'غير محدد'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                          النوع
                        </TableCell>
                        <TableCell>{student.gender || '—'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                          تاريخ الازدياد
                        </TableCell>
                        <TableCell>{student.birthDate || student.dateOfBirth || '—'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                          رقم الترتيب (ر.ت)
                        </TableCell>
                        <TableCell>{typeof student.classOrder === 'number' ? student.classOrder : '—'}</TableCell>
                      </TableRow>
                      {typeof student.score !== 'undefined' && (
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                            النقطة الحالية
                          </TableCell>
                          <TableCell>{student.score}</TableCell>
                        </TableRow>
                      )}
                      {typeof student.absences !== 'undefined' && (
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                            عدد الغيابات
                          </TableCell>
                          <TableCell>{student.absences}</TableCell>
                        </TableRow>
                      )}
                      {student.badge && (
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                            الشارة
                          </TableCell>
                          <TableCell>{student.badge}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {activeTab === 1 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  التقييمات السابقة
                </Typography>
                {student.assessments && student.assessments.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {student.assessments.map((assessment, index) => (
                      <Card key={index} sx={{ p: 2 }}>
                        <CardContent>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            التاريخ: {assessment.date}
                          </Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 1 }}>
                            {Object.entries(assessment.scores).map(([elementId, score]) => {
                              const element = assessmentElements.find(el => el.id === elementId);
                              return element ? (
                                <Typography key={elementId} variant="body2">
                                  {element.name}: {score}
                                </Typography>
                              ) : null;
                            })}
                          </Box>
                          {assessment.notes && (
                            <Typography variant="body2">
                              ملاحظات: {assessment.notes}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary">
                    لا توجد تقييمات سابقة لهذا الطالب.
                  </Typography>
                )}
                <Button variant="contained" sx={{ mt: 2 }} onClick={() => onAssess(student)}>
                  إجراء تقييم جديد
                </Button>
              </Box>
            )}

            {activeTab === 2 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  سجل السلوك
                </Typography>
                <Typography color="text.secondary">
                  سيظهر هنا لاحقًا أي إنذارات، تنويهات، أو ملاحظات خاصة بالتلميذ. (Placeholder)
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-start', p: 2 }}>
          <Button variant="outlined" color="error" onClick={onClose}>
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        message="تم نسخ النص بنجاح"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}

export default StudentDetailModal;
