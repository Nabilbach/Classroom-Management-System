import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Select, MenuItem, FormControl, InputLabel, Paper, Chip } from '@mui/material';

interface Student {
  id: number;
  name: string;
  section_id: string | number;
  attendance_number: number;
}

interface Section {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id: number;
  student_id: number;
  section_id: string;
  date: string;
  status: 'present' | 'absent';
  student_name: string;
}

const AttendanceTracker: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
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

  // (indicator removed) no global sections check

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/sections');
      const data = await response.json();
      // normalize: the API may return { value: [...] } or array directly
      const rawSections = Array.isArray(data) ? data : (data.value || []);
      const normalized = rawSections.map((s: any) => ({ id: String(s.id).trim(), name: s.name }));
      setSections(normalized);
    } catch (error) {
      console.error('خطأ في جلب الأقسام:', error);
    }
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('خطأ في جلب الطلاب:', error);
    }
  };

  // (indicator removed) no per-section status function

  const checkTodaysAttendance = async () => {
    if (!selectedSectionId) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const sid = String(selectedSectionId).trim();
      const response = await fetch(`/api/attendance?date=${today}&sectionId=${encodeURIComponent(sid)}`);
      const data = await response.json();
      const records = Array.isArray(data) ? data : (data.value || data.records || []);
      setTodaysAttendance(records as AttendanceRecord[]);
      setIsAttendanceRecorded(records.length > 0);

      // تحديث حالة القسم الحالي في الخريطة
      setSectionsAttendanceStatus(prev => ({
        ...prev,
        [sid]: records.length > 0
      }));
    } catch (error) {
      console.error('خطأ في جلب الحضور:', error);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!selectedSectionId) return [];
    return students.filter(student => String(student.section_id) === String(selectedSectionId));
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
        studentId: parseInt(studentId, 10),
        sectionId: selectedSectionId,
        isPresent: status === 'present',
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
        const err = await response.json().catch(() => null);
        console.error('Save attendance failed:', err);
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

  const selectedSection = sections.find(section => String(section.id) === String(selectedSectionId));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        تسجيل الحضور والغياب
      </Typography>

      <Box sx={{ mb: 3 }}>
            {/* حالة تسجيل الحضور للصف محددة داخل منطقة السجل (تمت إزالتها من العنوان) */}
          >
            {sections.map((section) => (
              <MenuItem key={section.id} value={section.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <span>{section.name}</span>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* مؤشر الحضور الكامل محذوف */}
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
              
              {todaysAttendance.length === 0 ? (
                <Typography variant="body1" color="textSecondary">لا توجد سجلات حضور لهذا اليوم</Typography>
              ) : (
                todaysAttendance.map((record) => (
                  <Box key={record.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body1">{record.student_name}</Typography>
                        <Chip label={record.status === 'present' ? 'حاضر' : 'غائب'} color={record.status === 'present' ? 'success' : 'error'} size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="outlined" color="error" size="small" onClick={() => handleDeleteAttendance(record.id)}>إلغاء</Button>
                      </Box>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          )}
        </Paper>
      )}

      {/* debug info removed */}
    </Box>
  );
};

export default AttendanceTracker;