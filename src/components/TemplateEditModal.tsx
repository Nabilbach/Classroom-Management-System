import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography, IconButton, Box, MenuItem, Select, InputLabel, FormControl, Stack, Paper, Grid, DialogContentText
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Warning as WarningIcon } from '@mui/icons-material';
import { LessonTemplate, LessonStage } from '../services/api/curriculumService';
import { useCurriculum } from '../contexts/CurriculumContext';

interface TemplateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: LessonTemplate | null;
}

const TemplateEditModal: React.FC<TemplateEditModalProps> = ({ isOpen, onClose, template }) => {
  const { addTemplate, updateLessonTemplate, deleteLessonTemplate } = useCurriculum();
  const [editedTemplate, setEditedTemplate] = useState<LessonTemplate | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (template) {
      setEditedTemplate(template);
    } else {
      setEditedTemplate({
        id: '',
        title: '',
        description: '',
        estimatedSessions: 1,
        stages: [],
        courseName: '',
        level: '',
        weekNumber: 1,
        scheduledSections: [],
      });
    }
  }, [template]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setEditedTemplate(prev => {
      if (!prev) return null;
      return { ...prev, [name as string]: value };
    });
  };

  const handleStageChange = (index: number, field: keyof LessonStage, value: any) => {
    setEditedTemplate(prev => {
      if (!prev) return null;
      const newStages = [...prev.stages];
      newStages[index] = { ...newStages[index], [field]: value };
      return { ...prev, stages: newStages };
    });
  };

  const handleAddStage = () => {
    setEditedTemplate(prev => {
      if (!prev) return null;
      return { ...prev, stages: [...prev.stages, { id: Date.now().toString(), title: '', isCompleted: false }] };
    });
  };

  const handleRemoveStage = (index: number) => {
    setEditedTemplate(prev => {
      if (!prev) return null;
      const newStages = prev.stages.filter((_, i) => i !== index);
      return { ...prev, stages: newStages };
    });
  };

  const handleSave = async () => {
    if (editedTemplate) {
      try {
        if (editedTemplate.id) {
          await updateLessonTemplate(editedTemplate.id, editedTemplate);
        } else {
          const { id, ...templateToAdd } = editedTemplate;
          await addTemplate(templateToAdd as Omit<LessonTemplate, 'id'>);
        }
        onClose();
      } catch (error) {
        console.error('Failed to save template:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (editedTemplate?.id) {
      try {
        await deleteLessonTemplate(editedTemplate.id);
        setDeleteConfirmOpen(false);
        onClose();
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  if (!editedTemplate) return null;

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>{editedTemplate.id ? `تعديل القالب: ${editedTemplate.title}` : 'إضافة قالب جديد'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>المعلومات الأساسية</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    name="title"
                    label="عنوان القالب"
                    value={editedTemplate.title}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="description"
                    label="الوصف"
                    value={editedTemplate.description}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>تفاصيل المقرر</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="courseName"
                    label="المادة الدراسية"
                    value={editedTemplate.courseName}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="level"
                    label="المستوى"
                    value={editedTemplate.level}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="weekNumber"
                    label="رقم الأسبوع"
                    type="number"
                    value={editedTemplate.weekNumber}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="estimatedSessions"
                    label="عدد الحصص المقدر"
                    type="number"
                    value={editedTemplate.estimatedSessions}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>مراحل الدرس</Typography>
              <Stack spacing={2}>
                {editedTemplate.stages.map((stage, index) => (
                  <Paper key={stage.id} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                      label={`المرحلة ${index + 1}`}
                      value={stage.title}
                      onChange={(e) => handleStageChange(index, 'title', e.target.value)}
                      fullWidth
                      variant="standard"
                    />
                    <FormControl sx={{ minWidth: 120 }}>
                      <InputLabel>الحالة</InputLabel>
                      <Select
                        value={stage.isCompleted ? 'true' : 'false'}
                        label="الحالة"
                        onChange={(e) => handleStageChange(index, 'isCompleted', e.target.value === 'true')}
                        variant="standard"
                      >
                        <MenuItem value="true">مكتملة</MenuItem>
                        <MenuItem value="false">غير مكتملة</MenuItem>
                      </Select>
                    </FormControl>
                    <IconButton onClick={() => handleRemoveStage(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Paper>
                ))}
              </Stack>
              <Button onClick={handleAddStage} startIcon={<AddIcon />} variant="text" sx={{ mt: 2 }}>
                إضافة مرحلة
              </Button>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px', justifyContent: 'space-between' }}>
          <Box>
            {editedTemplate.id && (
              <Button onClick={() => setDeleteConfirmOpen(true)} color="error" variant="outlined" startIcon={<DeleteIcon />}>
                حذف القالب
              </Button>
            )}
          </Box>
          <Stack direction="row" spacing={2}>
            <Button onClick={onClose} color="inherit">
              إلغاء
            </Button>
            <Button onClick={handleSave} color="primary" variant="contained">
              حفظ التغييرات
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <WarningIcon color="error" sx={{ mr: 1 }} />
          تأكيد الحذف
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من رغبتك في حذف هذا القالب؟ لا يمكن التراجع عن هذا الإجراء.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
            تراجع
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" autoFocus>
            تأكيد الحذف
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TemplateEditModal;