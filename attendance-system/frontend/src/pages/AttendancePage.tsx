import React, { useEffect, useState } from 'react';

interface Section {
  id: string;
  name: string;
}
interface Student {
  id: number;
  first_name: string;
  last_name: string;
  section_id: string;
}

const AttendancePage = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<{ [id: number]: 'present' | 'absent' }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/sections')
      .then(res => res.json())
      .then(data => setSections(Array.isArray(data) ? data : (data.value || [])))
      .catch(() => setSections([]));
  }, []);

  useEffect(() => {
    if (selectedSectionId) {
      fetch(`/api/students?sectionId=${selectedSectionId}`)
        .then(res => res.json())
        .then(data => setStudents(Array.isArray(data) ? data : (data.value || [])))
        .catch(() => setStudents([]));
      setAttendance({});
      fetchAttendance();
    }
    // eslint-disable-next-line
  }, [selectedSectionId]);

  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [attendanceError, setAttendanceError] = useState('');

  const fetchAttendance = async () => {
    if (!selectedSectionId) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      const res = await fetch(`/api/attendance?date=${today}&sectionId=${selectedSectionId}`);
      const data = await res.json();
      setAttendanceRecords(Array.isArray(data) ? data : (data.value || []));
    } catch (err) {
      setAttendanceRecords([]);
    }
  };

  const handleAttendanceChange = (studentId: number, status: 'present' | 'absent') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    setSaving(true);
    setAttendanceError('');
    const today = new Date().toISOString().split('T')[0];
    const attendanceData = students.map(student => ({
      studentId: student.id,
      sectionId: selectedSectionId,
      isPresent: attendance[student.id] === 'present',
      date: today
    }));
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance: attendanceData })
      });
      if (res.ok) {
        await fetchAttendance();
        alert('تم حفظ الحضور بنجاح');
      } else {
        setAttendanceError('خطأ في حفظ الحضور');
      }
    } catch (err) {
      setAttendanceError('خطأ في الاتصال بالسيرفر');
    }
    setSaving(false);
  };

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 24 }}>مرحباً أستاذ</h2>
      <div style={{ marginBottom: 24 }}>
        <label htmlFor="section">اختر القسم:</label>
        <select
          id="section"
          value={selectedSectionId}
          onChange={e => setSelectedSectionId(e.target.value)}
          style={{ marginLeft: 12, padding: 6 }}
        >
          <option value="">-- اختر القسم --</option>
          {sections.map(section => (
            <option key={section.id} value={section.id}>{section.name}</option>
          ))}
        </select>
      </div>

      {selectedSectionId && (
        <div>
          <h3>قائمة الطلاب</h3>
          {students.length === 0 ? (
            <p>لا يوجد طلاب في هذا القسم.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ccc', padding: 8 }}>الاسم</th>
                  <th style={{ border: '1px solid #ccc', padding: 8 }}>الحضور</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id}>
                    <td style={{ border: '1px solid #ccc', padding: 8 }}>{student.first_name} {student.last_name}</td>
                    <td style={{ border: '1px solid #ccc', padding: 8 }}>
                      <button
                        style={{ marginRight: 8, background: attendance[student.id] === 'present' ? '#4caf50' : '#eee', color: attendance[student.id] === 'present' ? '#fff' : '#000', padding: '4px 12px', border: 'none', borderRadius: 4 }}
                        onClick={() => handleAttendanceChange(student.id, 'present')}
                      >حاضر</button>
                      <button
                        style={{ background: attendance[student.id] === 'absent' ? '#f44336' : '#eee', color: attendance[student.id] === 'absent' ? '#fff' : '#000', padding: '4px 12px', border: 'none', borderRadius: 4 }}
                        onClick={() => handleAttendanceChange(student.id, 'absent')}
                      >غائب</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button
            style={{ marginTop: 24, padding: '8px 24px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, fontSize: 16 }}
            onClick={handleSave}
            disabled={saving || students.length === 0}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ الحضور'}
          </button>
          {attendanceError && <div style={{ color: 'red', marginTop: 12 }}>{attendanceError}</div>}
          <div style={{ marginTop: 32 }}>
            <h4>سجل الحضور لهذا اليوم</h4>
            {attendanceRecords.length === 0 ? (
              <p>لا توجد سجلات حضور لهذا اليوم.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ccc', padding: 8 }}>الطالب</th>
                    <th style={{ border: '1px solid #ccc', padding: 8 }}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record, idx) => (
                    <tr key={idx}>
                      <td style={{ border: '1px solid #ccc', padding: 8 }}>{record.student_name || record.student?.first_name + ' ' + record.student?.last_name}</td>
                      <td style={{ border: '1px solid #ccc', padding: 8 }}>{record.isPresent || record.status === 'present' ? 'حاضر' : 'غائب'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
