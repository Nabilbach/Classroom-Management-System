import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  Button,
  Typography
} from '@mui/material';

const DAYS = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00",
  "15:00", "16:00", "17:00", "18:00"
];

interface Props {
  open: boolean;
  onClose: () => void;
  editingSession: any;
  currentDay: string;
  setCurrentDay: (v: string) => void;
  currentTimeSlot: string;
  setCurrentTimeSlot: (v: string) => void;
  newSessionSectionId: string;
  setNewSessionSectionId: (v: string) => void;
  availableSections: any[];
  newSessionSubject: string;
  setNewSessionSubject: (v: string) => void;
  newSessionTeacher: string;
  setNewSessionTeacher: (v: string) => void;
  newSessionClassroom: string;
  setNewSessionClassroom: (v: string) => void;
  newSessionDuration: number;
  setNewSessionDuration: (v: number) => void;
  newSessionType: "official" | "extra" | "compensatory";
  setNewSessionType: (v: "official" | "extra" | "compensatory") => void;
  handleAddEditSessionSubmit: () => void;
}

const AddEditSessionModal: React.FC<Props> = ({
  open,
  onClose,
  editingSession,
  currentDay,
  setCurrentDay,
  currentTimeSlot,
  setCurrentTimeSlot,
  newSessionSectionId,
  setNewSessionSectionId,
  availableSections,
  newSessionSubject,
  setNewSessionSubject,
  newSessionTeacher,
  setNewSessionTeacher,
  newSessionClassroom,
  setNewSessionClassroom,
  newSessionDuration,
  setNewSessionDuration,
  newSessionType,
  setNewSessionType,
  handleAddEditSessionSubmit
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth dir="rtl">
    <DialogTitle sx={{ fontWeight: 'bold' }}>{editingSession ? 'تعديل حصة' : 'إضافة حصة جديدة'}</DialogTitle>
    <DialogContent dividers>
      {currentTimeSlot && (
        <div className="flex flex-col gap-4">
          <Select label="اليوم" value={currentDay} onChange={(e) => setCurrentDay(e.target.value as string)} fullWidth>
            {DAYS.map(day => (<MenuItem key={day} value={day}>{day}</MenuItem>))}
          </Select>
          <Select label="الوقت" value={currentTimeSlot} onChange={(e) => setCurrentTimeSlot(e.target.value as string)} fullWidth>
            {TIME_SLOTS.map(timeSlot => (<MenuItem key={timeSlot} value={timeSlot}>{timeSlot}</MenuItem>))}
          </Select>
          <Select label="القسم" value={newSessionSectionId} onChange={(e) => setNewSessionSectionId(e.target.value as string)} fullWidth disabled={availableSections.length === 0}>
            {Array.isArray(availableSections) && availableSections.length > 0 ? (
              availableSections.map(section => (<MenuItem key={section.id} value={section.id}>{section.name}</MenuItem>))
            ) : (
              <MenuItem disabled>لا يوجد أقسام متاحة</MenuItem>
            )}
          </Select>
          <TextField label="المادة" value={newSessionSubject} onChange={(e) => setNewSessionSubject(e.target.value)} fullWidth />
          <TextField label="الأستاذ" value={newSessionTeacher} onChange={(e) => setNewSessionTeacher(e.target.value)} fullWidth />
          <TextField label="رقم القاعة" value={newSessionClassroom} onChange={(e) => setNewSessionClassroom(e.target.value)} fullWidth />
          <TextField 
            label="المدة (بالساعات)" 
            type="number" 
            value={newSessionDuration} 
            onChange={(e) => setNewSessionDuration(Number(e.target.value))} 
            inputProps={{ min: 1, max: 4 }}
            fullWidth 
          />
          <div className="flex gap-4">
            <label><Checkbox checked={newSessionType === 'official'} onChange={() => setNewSessionType('official')} /> رسمية</label>
            <label><Checkbox checked={newSessionType === 'extra'} onChange={() => setNewSessionType('extra')} /> إضافية</label>
            <label><Checkbox checked={newSessionType === 'compensatory'} onChange={() => setNewSessionType('compensatory')} /> تعويضية</label>
          </div>
        </div>
      )}
    </DialogContent>
    <DialogActions>
      <Button variant="text" color="error" onClick={onClose} className="mr-1">إلغاء</Button>
      <Button variant="contained" color="success" onClick={handleAddEditSessionSubmit}>{editingSession ? 'تعديل' : 'إضافة'}</Button>
    </DialogActions>
  </Dialog>
);

export default AddEditSessionModal;
