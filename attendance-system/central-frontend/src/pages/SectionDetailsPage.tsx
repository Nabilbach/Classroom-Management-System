import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const studentFields = [
  { key: 'order', label: 'ر.ت' },
  { key: 'code', label: 'الرمز' },
  { key: 'lastName', label: 'النسب' },
  { key: 'firstName', label: 'الاسم' },
  { key: 'gender', label: 'النوع' },
  { key: 'birthDate', label: 'تاريخ الازدياد' }
];

export default function SectionDetailsPage() {
  const { id } = useParams();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    order: '', code: '', lastName: '', firstName: '', gender: '', birthDate: ''
  });
  const [sectionName, setSectionName] = useState<string>('');

  useEffect(() => {
    loadStudents();
    loadSectionName();
  }, [id]);

  const loadStudents = async () => {
    setLoading(true);
    try {
  const res = await api.get(`/admin/students?section_id=${id}`);
      setStudents(res.data);
    } catch (e) {
      setError('فشل في جلب التلاميذ');
    } finally {
      setLoading(false);
    }
  };

  const loadSectionName = async () => {
    try {
  const res = await api.get(`/admin/sections/${id}`);
      setSectionName(res.data.name || '');
    } catch (e) {
      setSectionName('');
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
  await api.post('/admin/students', { ...formData, section_id: id });
      setFormData({ order: '', code: '', lastName: '', firstName: '', gender: '', birthDate: '' });
      setShowForm(false);
      loadStudents();
    } catch (e) {
      setError('فشل في إضافة التلميذ');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: any) => {
    if (!window.confirm('هل أنت متأكد من حذف التلميذ؟')) return;
    setLoading(true);
    try {
  await api.delete(`/admin/students/${studentId}`);
      loadStudents();
    } catch (e) {
      setError('فشل في حذف التلميذ');
    } finally {
      setLoading(false);
    }
  };

  // رفع ملف اكسيل مع شرط مطابقة اسم الملف لاسم القسم ورفع فعلي للباكند
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    const normalizedFileName = fileName.replace(/\s+/g, "").toLowerCase();
    const normalizedSectionName = sectionName.replace(/\s+/g, "").toLowerCase();
    if (normalizedFileName !== normalizedSectionName) {
      alert('يجب أن يكون اسم الملف مطابقاً لاسم القسم: ' + sectionName);
      e.target.value = '';
      return;
    }
    // رفع الملف للباكند
    const formData = new FormData();
    formData.append('file', file);
    try {
  const res = await api.post(`/excel/upload-students/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message || 'تم رفع وإضافة الطلاب بنجاح');
      loadStudents();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'فشل في رفع الملف');
    }
    e.target.value = '';
  };

  return (
    <div className="page">
      <h2>تفاصيل القسم: {sectionName}</h2>
      <Link to="/sections">رجوع للأقسام</Link>
      <div style={{ margin: '16px 0' }}>
        <button onClick={() => setShowForm(!showForm)} style={{ marginLeft: 8 }}>
          {showForm ? 'إخفاء النموذج' : '+ إضافة تلميذ جديد'}
        </button>
        <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} style={{ marginLeft: 16 }} />
      </div>
      {showForm && (
        <form onSubmit={handleAddStudent} style={{ background: '#f9fafb', padding: 16, borderRadius: 8, marginBottom: 20, border: '1px solid #e5e7eb' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>تلميذ جديد</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {studentFields.map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>{f.label}</label>
                <input
                  type={f.key === 'birthDate' ? 'date' : 'text'}
                  value={formData[f.key as keyof typeof formData]}
                  onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                  style={{ width: '120px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 }}
                  required={f.key !== 'code'}
                />
              </div>
            ))}
          </div>
          <button type="submit" disabled={loading} style={{ background: '#2563eb', color: '#fff', padding: '8px 20px', border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14 }}>
            {loading ? 'جاري الإضافة...' : 'إضافة التلميذ'}
          </button>
        </form>
      )}
      <table>
        <thead>
          <tr>
            {studentFields.map(f => <th key={f.key}>{f.label}</th>)}
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={studentFields.length + 1} style={{ textAlign: 'center' }}>لا يوجد تلاميذ</td>
              </tr>
            ) : (
              students.map((st, idx) => (
                <tr key={st.id ?? idx}>
                  <td>{st.order}</td>
                  <td>{st.code}</td>
                  <td>{st.lastName}</td>
                  <td>{st.firstName}</td>
                  <td>{st.gender}</td>
                  <td>{st.birthDate}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleDeleteStudent(st.id)} style={{ background: '#dc2626', color: '#fff', padding: '6px 12px', border: 'none', borderRadius: 4 }}>حذف</button>
                    <button style={{ background: '#2563eb', color: '#fff', padding: '6px 12px', border: 'none', borderRadius: 4 }}>تفاصيل</button>
                    <button style={{ background: '#6b7280', color: '#fff', padding: '6px 12px', border: 'none', borderRadius: 4 }}>تفاصيل الغياب</button>
                  </td>
                </tr>
              ))
            )}
        </tbody>
      </table>
      {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
    </div>
  );
}
