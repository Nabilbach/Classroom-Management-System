import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Select, MenuItem, FormControl, InputLabel, Paper, Chip } from '@mui/material';
import { useStudents } from '../contexts/StudentsContext';
import { useSections } from '../contexts/SectionsContext';
import { useAttendance } from '../contexts/AttendanceContext';
import { Student } from '../types/studentTypes'; // Assuming studentTypes defines Student interface
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

interface AttendanceTrackerProps {
  // Props can be added here if needed, e.g., onSave, onClose
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = () => {
  const { students } = useStudents();
  const { sections } = useSections();
  const { recordAttendance, fetchAttendance, attendanceRecords } = useAttendance();

  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentAttendance, setCurrentAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [absentStudentsList, setAbsentStudentsList] = useState<Student[]>([]);
  const [isAbsentListModalOpen, setIsAbsentListModalOpen] = useState(false);

  const filteredStudents = useMemo(() => {
    if (!selectedSectionId) {
      return [];
    }
    return students.filter(student => student.sectionId === selectedSectionId);
  }, [students, selectedSectionId]);

  useEffect(() => {
    // When section or date changes, fetch existing attendance for that day/section
    if (selectedSectionId && attendanceDate) {
      fetchAttendance(selectedSectionId, attendanceDate);
    }
  }, [selectedSectionId, attendanceDate, fetchAttendance]);

  useEffect(() => {
    // Populate currentAttendance with fetched records
    const initialAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
    if (attendanceRecords && attendanceRecords.length > 0) {
      attendanceRecords.forEach(record => {
        initialAttendance[record.studentId] = record.status;
      });
    } else {
      // If no records, default all students in the selected section to 'present'
      filteredStudents.forEach(student => {
        initialAttendance[student.id] = 'present';
      });
    }
    setCurrentAttendance(initialAttendance);
  }, [attendanceRecords, filteredStudents]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setCurrentAttendance(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    try {
      const recordsToSave = Object.entries(currentAttendance).map(([studentId, status]) => ({
        studentId,
        sectionId: selectedSectionId,
        date: attendanceDate,
        status,
      }));
      await recordAttendance(recordsToSave);
      alert('Attendance saved successfully!'); // Replace with Snackbar later

      // Identify absent students
      const absent = filteredStudents.filter(student => currentAttendance[student.id] === 'absent');
      setAbsentStudentsList(absent);
      setIsAbsentListModalOpen(true); // Open the modal

    } catch (error) {
      console.error('Failed to save attendance:', error);
      alert('Failed to save attendance.'); // Replace with Snackbar later
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>تسجيل الحضور والغياب</Typography>

      <FormControl fullWidth margin="normal">
        <InputLabel id="section-select-label">القسم</InputLabel>
        <Select
          labelId="section-select-label"
          value={selectedSectionId}
          label="القسم"
          onChange={(e) => setSelectedSectionId(e.target.value as string)}
        >
          {sections.map(section => (
            <MenuItem key={section.id} value={section.id}>{section.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal">
        <InputLabel shrink>التاريخ</InputLabel>
        <input
          type="date"
          value={attendanceDate}
          onChange={(e) => setAttendanceDate(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', marginTop: '8px' }}
        />
      </FormControl>

      <Box sx={{ mt: 3 }}>
        {filteredStudents.length === 0 ? (
          <Typography>الرجاء اختيار قسم لعرض الطلاب.</Typography>
        ) : (
          <Box>
            {filteredStudents.map(student => (
              <Paper key={student.id} sx={{ p: 2, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>{student.first_name} {student.last_name}</Typography>
                <Box>
                  <Button
                    variant={currentAttendance[student.id] === 'present' ? 'contained' : 'outlined'}
                    color="success"
                    size="small"
                    onClick={() => handleStatusChange(student.id, 'present')}
                    sx={{ mr: 1 }}
                  >
                    حاضر
                  </Button>
                  <Button
                    variant={currentAttendance[student.id] === 'absent' ? 'contained' : 'outlined'}
                    color="error"
                    size="small"
                    onClick={() => handleStatusChange(student.id, 'absent')}
                  >
                    غائب
                  </Button>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={handleSaveAttendance}
        disabled={isSaving || !selectedSectionId || filteredStudents.length === 0}
        sx={{ mt: 3 }}
      >
        {isSaving ? 'جاري الحفظ...' : 'حفظ الحضور'}
      </Button>

      {/* Display absent students list here after saving */}
      <Dialog open={isAbsentListModalOpen} onClose={() => setIsAbsentListModalOpen(false)}>
        <DialogTitle>الطلاب الغائبون</DialogTitle>
        <DialogContent>
          {absentStudentsList.length === 0 ? (
            <Typography>لا يوجد طلاب غائبون في هذا اليوم.</Typography>
          ) : (
            <Box>
              {absentStudentsList.map(student => (
                <Typography key={student.id}>{student.first_name} {student.last_name}</Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAbsentListModalOpen(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendanceTracker;