import React, { useEffect, useState } from 'react'
// نسخ للنص
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  alert('تم النسخ!')
}
import api from '../services/api'
import { Link } from 'react-router-dom'

export default function TeachersPage(){
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ firstName: '', lastName: '', subject: '' })
  // حفظ بيانات آخر أستاذ تم إنشاؤه
  const [lastCredentials, setLastCredentials] = useState<{id: string, username: string, password: string} | null>(null)

  const loadTeachers = async () => {
    try{ const res = await api.get('/api/admin/users?role=teacher'); setTeachers(res.data) }catch(e){ console.error(e) }
  }

  useEffect(()=>{ loadTeachers() },[])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('الرجاء إدخال الاسم الشخصي والاسم العائلي')
      return
    }

    setLoading(true)
    setError(null)
    try {
  const response = await api.post('/api/admin/users', formData)
  const { user, credentials } = response.data

  // حفظ بيانات الدخول لعرضها في الجدول
  setLastCredentials({ id: user.id, username: credentials.username, password: credentials.password })

  // Show success message with generated credentials
  const message = `تم إنشاء الأستاذ بنجاح!\n\nاسم المستخدم: ${credentials.username}\nكلمة المرور: ${credentials.password}\n\nيرجى حفظ هذه المعلومات`
  alert(message)

  setFormData({ firstName: '', lastName: '', subject: '' })
  setShowForm(false)
  loadTeachers()
    } catch (err: any) {
      console.error(err)
      const msg = err?.response?.data?.message || 'فشل في إنشاء الأستاذ'
      setError(msg)
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  // حذف الأستاذ
  const handleDeleteTeacher = async (teacher: any) => {
    if (!window.confirm(`هل أنت متأكد من حذف الأستاذ "${teacher.fullName}"؟`)) return;
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/api/admin/users/${teacher.id}`);
      alert('تم حذف الأستاذ بنجاح');
      loadTeachers();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || 'فشل في حذف الأستاذ';
      setError(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="page">
      <h2>الأساتذة</h2>
      {error && <div style={{color: 'red', marginBottom: 10}}>{error}</div>}
      
      <button 
        onClick={() => setShowForm(!showForm)}
        style={{
          background: '#2563eb',
          color: '#fff',
          padding: '8px 16px',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 14,
          marginBottom: 16
        }}
      >
        {showForm ? 'إخفاء النموذج' : '+ إضافة أستاذ جديد'}
      </button>
      
      {showForm && (
        <form onSubmit={handleCreate} style={{
          background: '#f9fafb',
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>أستاذ جديد</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>الاسم الشخصي *</label>
            <input 
              type="text" 
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              placeholder="الاسم الشخصي"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                fontSize: 14
              }}
              required
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>الاسم العائلي *</label>
            <input 
              type="text" 
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              placeholder="الاسم العائلي"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                fontSize: 14
              }}
              required
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>المادة *</label>
            <select
              value={formData.subject}
              onChange={e => setFormData({...formData, subject: e.target.value})}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                fontSize: 14
              }}
            >
              <option value="">اختر المادة</option>
              <option value="الرياضيات">الرياضيات</option>
              <option value="الفرنسية">الفرنسية</option>
              <option value="العربية">العربية</option>
              <option value="الإنجليزية">الإنجليزية</option>
              <option value="التربية الإسلامية">التربية الإسلامية</option>
              <option value="الإجتماعيات">الإجتماعيات</option>
              <option value="التربية البدنية">التربية البدنية</option>
              <option value="علوم الحياة والأرض">علوم الحياة والأرض</option>
              <option value="الفيزياء والكيمياء">الفيزياء والكيمياء</option>
              <option value="الفلسفة">الفلسفة</option>
              <option value="المعلوميات">المعلوميات</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              type="submit"
              disabled={loading}
              style={{
                background: '#2563eb',
                color: '#fff',
                padding: '8px 20px',
                border: 'none',
                borderRadius: 4,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14
              }}
            >
              {loading ? 'جاري الإنشاء...' : 'إنشاء الأستاذ'}
            </button>
            <button 
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                background: '#6b7280',
                color: '#fff',
                padding: '8px 20px',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      )}
      
      <table>
        <thead>
          <tr>
            <th>id</th>
            <th>اسم المستخدم</th>
            <th>كلمة المرور</th>
            <th>الاسم الكامل</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map(t => {
            // إذا كان هذا هو آخر أستاذ تم إنشاؤه، أظهر كلمة المرور
            const showPassword = lastCredentials && lastCredentials.id === t.id;
            return (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>
                  {t.username}
                  <button style={{marginLeft:4}} onClick={()=>copyToClipboard(t.username)}>نسخ</button>
                </td>
                <td>
                  {showPassword ? (
                    <>
                      {lastCredentials.password}
                      <button style={{marginLeft:4}} onClick={()=>copyToClipboard(lastCredentials.password)}>نسخ</button>
                    </>
                  ) : (
                    <span style={{color:'#888'}}>غير متوفر</span>
                  )}
                </td>
                <td>{t.fullName}</td>
                <td style={{display: 'flex', gap: 8}}>
                  <Link to={`/teachers/${t.id}`}>تفاصيل</Link>
                  <button 
                    onClick={() => handleDeleteTeacher(t)}
                    disabled={loading}
                    style={{
                      background: '#dc2626',
                      color: '#fff',
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: 4,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: 14
                    }}
                  >
                    {loading ? 'جاري الحذف...' : 'حذف'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
