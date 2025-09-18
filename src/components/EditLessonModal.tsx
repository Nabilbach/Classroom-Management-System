import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal, Box, Typography, Button, TextField, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Checkbox, IconButton, Stack, List, ListItem, ListItemText, Divider } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useSections } from '../contexts/SectionsContext';
import { Delete as DeleteIcon, AddComment as AddCommentIcon } from '@mui/icons-material';
import { DateTime } from 'luxon';

// Define LessonStage interface
interface LessonStage {
  id: string;
  title: string;
  isCompleted: boolean;
  completionDate?: string;
}

// Define Note interface
interface Note {
  id: string;
  text: string;
  timestamp: string;
}

// Update AdaptedLesson interface
interface AdaptedLesson {
  id: string;
  lessonTitle: string;
  status: 'planned' | 'in-progress' | 'completed';
  stages?: LessonStage[]; // Re-add stages
  assignedSections?: string[];
  section?: string; // Add the correct property
  notes?: string;
}

import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

interface EditLessonModalProps {
  open: boolean;
  onClose: () => void;
  lesson: AdaptedLesson | null;
  onSave: (updatedLesson: AdaptedLesson) => void;
  sections: Section[];
  lessonTemplates: LessonTemplate[];
  scheduledLessons: AdaptedLesson[]; // Added prop for scheduled lessons
}

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600, // Increased width for stages
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  textAlign: 'right' as 'right',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const EditLessonModal: React.FC<EditLessonModalProps> = ({ lesson, onClose, onSave, scheduledLessons }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { sections } = useSections();

  const sectionName = useMemo(() => {
    if (!lesson || !lesson.section) {
      return '';
    }
    const sectionId = lesson.section;
    const section = sections.find(s => s.id === sectionId);
    return section ? section.name : '';
  }, [lesson, sections]);

  const ensureStageIds = (stages: LessonStage[] | undefined): LessonStage[] => {
    if (!stages || stages.length === 0) {
      return [{ id: Date.now().toString(), title: '', isCompleted: false }];
    }
    return stages.map(stage => ({
      ...stage,
      id: stage.id || Date.now().toString(), // Generate ID if missing
    }));
  };

  const [editedLessonTitle, setEditedLessonTitle] = useState('');
  const [currentStatus, setCurrentStatus] = useState<AdaptedLesson['status']>('planned');
  const [manualSessionNumber, setManualSessionNumber] = useState<number | undefined>(undefined);
  const [lessonNotes, setLessonNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');

  const [lessonStages, setLessonStages] = useState<LessonStage[]>([]);
  const newStageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lesson) {
      setEditedLessonTitle(lesson.lessonTitle || '');
      setCurrentStatus(lesson.status || 'planned');
      setManualSessionNumber(lesson.manualSessionNumber);
      setLessonNotes(lesson.notes || []);
      setLessonStages(ensureStageIds(lesson.stages));
    }
  }, [lesson]);

  if (!lesson) {
    return null;
  }

  const calculatedProgress = useMemo(() => {
    const validStages = lessonStages.filter(stage => stage.title.trim() !== '');
    if (validStages.length === 0) return 0;
    const completedStages = validStages.filter(stage => stage.isCompleted).length;
    return Math.round((completedStages / validStages.length) * 100);
  }, [lessonStages]);

  const handleAddNote = () => {
    if (newNote.trim()) {
      setLessonNotes(prev => [...prev, {
        id: Date.now().toString(),
        text: newNote,
        timestamp: new Date().toISOString()
      }]);
      setNewNote('');
    }
  };

  const handleSave = () => {
    if (!lesson) return;

    const updatedLesson: AdaptedLesson = {
      ...lesson,
      lessonTitle: editedLessonTitle,
      status: currentStatus,
      stages: lessonStages,
      notes: lessonNotes,
      manualSessionNumber: manualSessionNumber,
    };

    if (calculatedProgress < 100) {
      enqueueSnackbar('التقدم أقل من 100%. هل تحتاج إلى حصة إضافية؟', { variant: 'warning', autoHideDuration: 5000 });
    }

    onSave(updatedLesson);
    onClose();
  };

  const handleStageCompletion = (index: number) => {
    const newStages = [...lessonStages];
    newStages[index].isCompleted = !newStages[index].isCompleted;
    newStages[index].completionDate = newStages[index].isCompleted ? new Date().toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: '2-digit', numberingSystem: 'latn' }) : undefined;
    setLessonStages(newStages);
  };

  const handleStageTitleChange = (index: number, newTitle: string) => {
    const newStages = [...lessonStages];
    newStages[index].title = newTitle;
    setLessonStages(newStages);
  };

  const handleRemoveStage = (index: number) => {
    const newStages = lessonStages.filter((_, i) => i !== index);
    setLessonStages(newStages);
  };

  const handleKeyDownOnStage = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentStageTitle = (e.target as HTMLInputElement).value;
      if (index === lessonStages.length - 1) {
        handleStageTitleChange(index, currentStageTitle);
        if (currentStageTitle.trim()) {
          const newStage: LessonStage = {
            id: Date.now().toString(),
            title: '',
            isCompleted: false,
          };
          setLessonStages(prevStages => [...prevStages, newStage]);
        }
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (newStageInputRef.current) {
        newStageInputRef.current.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [lessonStages.length]);

  return (
    <Modal
      open={!!lesson}
      onClose={onClose}
      aria-labelledby="edit-lesson-modal-title"
      aria-describedby="edit-lesson-modal-description"
    >
      <Box sx={modalStyle}>
        <Typography id="edit-lesson-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>
          تعديل الدرس لقسم: {sectionName}
        </Typography>

        <TextField
          label="عنوان الدرس"
          fullWidth
          variant="outlined"
          value={editedLessonTitle}
          onChange={(e) => setEditedLessonTitle(e.target.value)}
          sx={{ mb: 3 }}
        />

        <TextField
          label="رقم الحصة (اختياري)"
          fullWidth
          variant="outlined"
          type="number"
          value={manualSessionNumber || ''}
          onChange={(e) => {
            const newValue = e.target.value ? parseInt(e.target.value) : undefined;
            setManualSessionNumber(newValue);
          }}
          sx={{ mb: 3 }}
          inputProps={{ min: 1 }}
        />

        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ textAlign: 'right' }}>الحالة</FormLabel>
          <RadioGroup
            row
            value={currentStatus}
            onChange={(event) => setCurrentStatus(event.target.value as AdaptedLesson['status'])}
            sx={{ justifyContent: 'flex-end' }}
          >
            <FormControlLabel value="planned" control={<Radio />} label="مخطط" />
            <FormControlLabel value="in-progress" control={<Radio />} label="جاري التنفيذ" />
            <FormControlLabel value="completed" control={<Radio />} label="مكتمل" />
          </RadioGroup>
        </FormControl>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            التقدم: {calculatedProgress}%
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            مراحل الدرس
          </Typography>
          <Stack spacing={2}>
            {lessonStages.map((stage, index) => (
              <Box key={stage.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox
                  checked={stage.isCompleted}
                  onChange={() => handleStageCompletion(index)}
                />
                <TextField
                  fullWidth
                  variant="standard"
                  value={stage.title}
                  onChange={(e) => handleStageTitleChange(index, e.target.value)}
                  placeholder="عنوان المرحلة"
                  onKeyDown={(e) => handleKeyDownOnStage(e, index)}
                  inputRef={index === lessonStages.length - 1 ? newStageInputRef : null}
                />
                {stage.completionDate && (
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: '70px' }}>
                    {stage.completionDate}
                  </Typography>
                )}
                <IconButton onClick={() => handleRemoveStage(index)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            ملاحظات
          </Typography>
          <List dense>
            {lessonNotes.map((note) => (
              <ListItem key={note.id} disableGutters>
                <ListItemText
                  primary={note.text}
                  secondary={DateTime.fromISO(note.timestamp).toLocaleString(DateTime.DATETIME_SHORT)}
                />
              </ListItem>
            ))}
          </List>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <TextField
              label="إضافة ملاحظة جديدة"
              fullWidth
              variant="outlined"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
            />
            <Button onClick={handleAddNote} variant="contained" startIcon={<AddCommentIcon />}>
              إضافة
            </Button>
          </Stack>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button variant="outlined" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="contained" onClick={handleSave}>
            حفظ
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};
export default EditLessonModal;
