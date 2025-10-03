import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Select, MenuItem, FormControl, InputLabel, Paper, Chip } from '@mui/material';
import { CheckCircle, Circle } from '@mui/icons-material';

interface Student {
  id: number;
  name: string;
  section_id: number;
  attendance_number: number;
}

interface Section {
  id: number;
  name: string;
}

interface AttendanceRecord {
  id: number;
  student_id: number;
  section_id: number;
  date: string;
  status: 'present' | 'absent';
  student_name: string;
}

const AttendanceTracker: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<{ [key: number]: 'present' | 'absent' }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [todaysAttendance, setTodaysAttendance] = useState<AttendanceRecord[]>([]);
  const [isAttendanceRecorded, setIsAttendanceRecorded] = useState(false);

  useEffect(() => {
    fetchSections();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedSectionId) {
      checkTodaysAttendance();
    }
  }, [selectedSectionId]);

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/sections');
      const data = await response.json();
      setSections(data);
    } catch (error) {
      console.error('خطأ في جلب الأقسام:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('خطأ في جلب الطلاب:', error);
    }
  };

  const checkTodaysAttendance = async () => {
    if (!selectedSectionId) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('Checking attendance for date:', today, 'section:', selectedSectionId);
      const response = await fetch(`/api/attendance?date=${today}&section_id=${selectedSectionId}`);
      const data = await response.json();
      console.log('Attendance data received:', data);
      setTodaysAttendance(data);
      setIsAttendanceRecorded(data.length > 0);
    } catch (error) {
      console.error('خطأ في جلب الحضور:', error);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!selectedSectionId) return [];
    return students.filter(student => student.section_id === selectedSectionId);
  }, [students, selectedSectionId]);

  const handleAttendanceChange = (studentId: number, status: 'present' | 'absent') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedSectionId) return;

    setIsSaving(true);
    try {
      const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: parseInt(studentId),
        section_id: selectedSectionId,
        status,
        date: new Date().toISOString().split('T')[0]
      }));

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attendance: attendanceData }),
      });

      if (response.ok) {
        alert('تم حفظ الحضور بنجاح');
        setAttendance({});
        checkTodaysAttendance();
      } else {
        alert('خطأ في حفظ الحضور');
      }
    } catch (error) {
      console.error('خطأ في حفظ الحضور:', error);
      alert('خطأ في حفظ الحضور');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAttendance = async (attendanceId: number) => {
    if (!window.confirm('هل تريد إلغاء سجل الحضور هذا؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/attendance/${attendanceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('تم إلغاء سجل الحضور بنجاح');
        checkTodaysAttendance();
      } else {
        alert('خطأ في إلغاء سجل الحضور');
      }
    } catch (error) {
      console.error('خطأ في إلغاء سجل الحضور:', error);
      alert('خطأ في إلغاء سجل الحضور');
    }
  };

  const selectedSection = sections.find(section => section.id === selectedSectionId);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        تسجيل الحضور والغياب
      </Typography>

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>اختر القسم</InputLabel>
          <Select
            value={selectedSectionId || ''}
            onChange={(e) => setSelectedSectionId(Number(e.target.value))}
            label="اختر القسم"
          >
            {sections.map((section) => (
              <MenuItem key={section.id} value={section.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {section.name}
                  {selectedSectionId === section.id && (
                    <Chip
                      icon={isAttendanceRecorded ? <CheckCircle /> : <Circle />}
                      label={isAttendanceRecorded ? 'مسجل' : 'غير مسجل'}
                      color={isAttendanceRecorded ? 'success' : 'default'}
                      size="small"
                    />
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {selectedSectionId && selectedSection && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6">
              {selectedSection.name}
            </Typography>
            <Chip
              icon={isAttendanceRecorded ? <CheckCircle /> : <Circle />}
              label={isAttendanceRecorded ? 'تم تسجيل الحضور' : 'لم يتم تسجيل الحضور'}
              color={isAttendanceRecorded ? 'success' : 'warning'}
              size="small"
            />
          </Box>

          {!isAttendanceRecorded ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                قم بتسجيل الحضور لتاريخ اليوم
              </Typography>
              
              {filteredStudents.map((student) => (
                <Box key={student.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {student.name} (رقم {student.attendance_number})
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant={attendance[student.id] === 'present' ? 'contained' : 'outlined'}
                      color="success"
                      onClick={() => handleAttendanceChange(student.id, 'present')}
                    >
                      حاضر
                    </Button>
                    <Button
                      variant={attendance[student.id] === 'absent' ? 'contained' : 'outlined'}
                      color="error"
                      onClick={() => handleAttendanceChange(student.id, 'absent')}
                    >
                      غائب
                    </Button>
                  </Box>
                </Box>
              ))}

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveAttendance}
                  disabled={isSaving || !selectedSectionId || filteredStudents.length === 0}
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ الحضور'}
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                سجل الحضور لتاريخ اليوم:
              </Typography>
              
              {console.log('Rendering attendance records:', todaysAttendance)}
              {todaysAttendance.length === 0 ? (
                <Typography variant="body1" color="textSecondary">
                  لا توجد سجلات حضور لهذا اليوم
                </Typography>
              ) : (
                todaysAttendance.map((record) => (
                  <Box key={record.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body1">
                          {record.student_name}
                        </Typography>
                        <Chip
                          label={record.status === 'present' ? 'حاضر' : 'غائب'}
                          color={record.status === 'present' ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleDeleteAttendance(record.id)}
                        >
                          إلغاء
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default AttendanceTracker;