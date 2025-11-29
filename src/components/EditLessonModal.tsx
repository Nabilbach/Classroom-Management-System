import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal, Box, Typography, Button, TextField, Checkbox, IconButton, Stack, List, ListItem, ListItemText } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useSections } from '../contexts/SectionsContext';
import { AdaptedLesson, LessonStage } from '../types/lessonLogTypes';
import { Delete as DeleteIcon, AddComment as AddCommentIcon } from '@mui/icons-material';
import { DateTime } from 'luxon';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MenuIcon from '@mui/icons-material/Menu';

// Local UI note type that tolerates missing id and adds one for rendering
type UINote = { id?: string; text: string; timestamp: string };

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
  '&::-webkit-scrollbar': {
    width: '8px'
  },
  '&::-webkit-scrollbar-track': {
    background: '#f1f1f1',
    borderRadius: '10px'
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#888',
    borderRadius: '10px',
    '&:hover': {
      background: '#555'
    }
  }
};

const SortableStageItem: React.FC<SortableStageItemProps> = ({
  stage,
  index,
  onCompletionToggle,
  onTitleChange,
  onRemove,
  onKeyDown,
  isLast,
  newStageInputRef,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCore = stage.isCore;

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        bgcolor: isCore ? 'primary.50' : 'grey.50',
        borderRadius: 1,
        border: '1px solid',
        borderColor: isCore ? 'primary.200' : 'grey.200',
        mb: 1,
      }}
    >
      <IconButton {...attributes} {...listeners} size="small" sx={{ cursor: 'grab' }}>
        <MenuIcon />
      </IconButton>
      <Typography
        variant="caption"
        sx={{
          bgcolor: isCore ? 'primary.main' : 'secondary.main',
          color: 'white',
          px: 1,
          py: 0.5,
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '0.7rem',
          whiteSpace: 'nowrap',
        }}
      >
        {isCore ? 'رئيسية' : 'إضافية'}
      </Typography>
      <Checkbox
        checked={stage.isCompleted}
        onChange={() => onCompletionToggle(index)}
        color={isCore ? 'primary' : 'secondary'}
      />
      <TextField
        fullWidth
        variant="standard"
        value={stage.title}
        onChange={(e) => onTitleChange(index, e.target.value)}
        placeholder={isCore ? 'عنوان المرحلة الرئيسية' : 'عنوان المرحلة الإضافية'}
        disabled={!!stage.templateStageId && isCore}
        onKeyDown={(e) => onKeyDown(e, index)}
        inputRef={isLast ? newStageInputRef : null}
      />
      {stage.completionDate && (
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: '70px' }}>
          {stage.completionDate}
        </Typography>
      )}
      {!stage.templateStageId && (
        <IconButton onClick={() => onRemove(index)} color="error" size="small">
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
};

const EditLessonModal: React.FC<EditLessonModalProps> = ({ lesson, onClose, onSave }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { sections } = useSections();

  const sectionName = useMemo(() => {
    if (!lesson) return '';
    // Try to infer the section by scanning sections that might reference this lesson id in lessonProgress
    const found = sections.find(s => (s as any).lessonProgress && (s as any).lessonProgress[lesson.id]);
    return found ? found.name : '';
  }, [lesson, sections]);

  const ensureStageIds = (stages: LessonStage[] | undefined): LessonStage[] => {
    if (!stages || stages.length === 0) {
      return []; // Return empty array instead of creating a default stage
    }
    return stages.map(stage => ({
      ...stage,
      id: stage.id || Date.now().toString(), // Generate ID if missing
    }));
  };

  const [editedLessonTitle, setEditedLessonTitle] = useState('');
  const [currentStatus, setCurrentStatus] = useState<AdaptedLesson['status']>('not-planned');
  const [manualSessionNumber, setManualSessionNumber] = useState<number | undefined>(undefined);
  const [lessonNotes, setLessonNotes] = useState<UINote[]>([]);
  const [newNote, setNewNote] = useState('');

  const [lessonStages, setLessonStages] = useState<LessonStage[]>([]);
  const newStageInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!open) return;
    
    if (lesson) {
      setEditedLessonTitle(lesson.lessonTitle || '');
      setManualSessionNumber(lesson.manualSessionNumber);
      setCurrentStatus(lesson.status || 'not-planned'); // Set initial status from lesson
      // Map incoming notes to UI notes with ids
      const mappedNotes: UINote[] = (lesson.notes || []).map((n, idx) => ({ id: n.timestamp || `${idx}`, text: n.text, timestamp: n.timestamp }));
      setLessonNotes(mappedNotes);
      setLessonStages(ensureStageIds(lesson.stages));
    }
  }, [lesson, open]);

  if (!lesson) {
    return null;
  }

  const calculatedProgress = useMemo(() => {
    const validStages = lessonStages.filter(stage => stage.title.trim() !== '');
    if (validStages.length === 0) return 0;
    const completedStages = validStages.filter(stage => stage.isCompleted).length;
    return Math.round((completedStages / validStages.length) * 100);
  }, [lessonStages]);

  // Compute status automatically from stages
  useEffect(() => {
    const validStages = lessonStages.filter(s => s.title.trim() !== '');
    if (validStages.length === 0) {
      setCurrentStatus('not-planned'); // Changed to 'not-planned' when no stages
    } else {
      const completed = validStages.filter(s => s.isCompleted).length;
      if (completed === 0) setCurrentStatus('planned');
      else if (completed === validStages.length) setCurrentStatus('completed');
      else setCurrentStatus('in-progress');
    }
  }, [lessonStages]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setLessonStages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over!.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

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
  // Map UI notes back to domain notes shape
  notes: lessonNotes.map(n => ({ text: n.text, timestamp: n.timestamp })),
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

  const handleKeyDownOnStage = (e: React.KeyboardEvent, index: number) => {
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

        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: currentStatus === 'not-planned' ? 'grey.500' : 'text.primary',
              fontWeight: currentStatus === 'not-planned' ? 'normal' : 'medium'
            }}
          >
            الحالة: {
              currentStatus === 'not-planned' ? 'غير مخطط' : 
              currentStatus === 'planned' ? 'مخطط' : 
              currentStatus === 'in-progress' ? 'قيد التنفيذ' : 
              'مكتمل'
            }
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            التقدم: {calculatedProgress}%
          </Typography>
          <Box sx={{ width: '100%', bgcolor: 'grey.300', borderRadius: '9999px', height: '6px', mb: 2 }}>
            <Box sx={{ bgcolor: 'primary.main', height: '100%', borderRadius: 'inherit', width: `${calculatedProgress}%`, transition: 'width 0.3s ease-in-out' }} />
          </Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            مراحل الدرس
          </Typography>
          
          {lessonStages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                لا توجد مراحل للدرس بعد
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => setLessonStages([{ id: Date.now().toString(), title: '', isCompleted: false, isCore: false }])}
              >
                إضافة المرحلة الأولى
              </Button>
            </Box>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={lessonStages}
                strategy={verticalListSortingStrategy}
              >
                {lessonStages.map((stage, index) => (
                  <SortableStageItem
                    key={stage.id}
                    stage={stage}
                    index={index}
                    onCompletionToggle={handleStageCompletion}
                    onTitleChange={handleStageTitleChange}
                    onRemove={handleRemoveStage}
                    onKeyDown={handleKeyDownOnStage}
                    isLast={index === lessonStages.length - 1}
                    newStageInputRef={newStageInputRef}
                  />
                ))}
              </SortableContext>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<AddCommentIcon />}
                onClick={() =>
                  setLessonStages((prev) => [
                    ...prev,
                    {
                      id: Date.now().toString(),
                      title: '',
                      isCompleted: false,
                      isCore: false,
                    },
                  ])
                }
                sx={{ mt: 2 }}
              >
                إضافة مرحلة إضافية
              </Button>
            </DndContext>
          )}
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
