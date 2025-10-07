import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function SectionsPage(){
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', educationalLevel: '', specialization: '' })
  const [toast, setToast] = useState<string | null>(null)
  
  const loadSections = async () => {
    try{ 
  const res = await api.get('/admin/sections')
      setSections(res.data)
    } catch(e: any){ 
      console.error(e)
      setError('فشل في تحميل الأقسام')
    }
  }
  
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('الرجاء إدخال اسم القسم')
      return
    }
    
    setLoading(true)
    setError(null)
    try {
  await api.post('/admin/sections', formData)
  setToast('تم إنشاء القسم بنجاح')
  setFormData({ name: '', educationalLevel: '', specialization: '' })
  setShowForm(false)
  loadSections()
  setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      console.error(err)
      const msg = err?.response?.data?.message || 'فشل في إنشاء القسم'
      setError(msg)
      alert(msg)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadSections()
  }, [])
  
  const handleDelete = async (section: any) => {
    if (!window.confirm(`هل أنت متأكد من حذف القسم "${section.name}"؟`)) {
      return
    }
    
    setLoading(true)
    setError(null)
    try {
  await api.delete(`/admin/sections/${section.id}`)
      alert('تم حذف القسم بنجاح')
      loadSections() // Reload sections
    } catch (err: any) {
      console.error(err)
      const msg = err?.response?.data?.message || 'فشل في حذف القسم'
      setError(msg)
      alert(msg)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="page">
      <h2>الأقسام</h2>
      {error && <div style={{color: 'red', marginBottom: 10}}>{error}</div>}
      {toast && <div style={{position:'fixed',top:20,right:20,background:'#16a34a',color:'#fff',padding:'12px 24px',borderRadius:8,zIndex:1000,fontSize:16}}>{toast}</div>}
      
      <button 
        onClick={() => setShowForm(!showForm)}
        style={{
          background: '#16a34a',
          color: '#fff',
          padding: '8px 16px',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 14,
          marginBottom: 16
        }}
      >
        {showForm ? 'إخفاء النموذج' : '+ إضافة قسم جديد'}
      </button>
      
      {showForm && (
        <form onSubmit={handleCreate} style={{
          background: '#f9fafb',
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>قسم جديد</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>اسم القسم *</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="مثال: TCSF-1"
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
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>المستوى التعليمي</label>
            <select
              value={formData.educationalLevel}
              onChange={(e) => setFormData({...formData, educationalLevel: e.target.value})}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                fontSize: 14
              }}
              required
            >
              <option value="">اختر المستوى</option>
              <option value="جذع مشترك">جذع مشترك</option>
              <option value="أولى بكالوريا">أولى بكالوريا</option>
              <option value="ثانية بكالوريا">ثانية بكالوريا</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>التخصص</label>
            <select
              value={formData.specialization}
              onChange={(e) => setFormData({...formData, specialization: e.target.value})}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                fontSize: 14
              }}
              required
            >
              <option value="">اختر التخصص</option>
              <option value="علمي خيار عربية">علمي خيار عربية</option>
              <option value="علمي خيار فرنسية">علمي خيار فرنسية</option>
              <option value="آداب وعلوم إنسانية">آداب وعلوم إنسانية</option>
              <option value="علوم فيزيائية">علوم فيزيائية</option>
              <option value="علوم الحياة والأرض">علوم الحياة والأرض</option>
              <option value="علوم تجريبية">علوم تجريبية</option>
              <option value="علوم إنسانية">علوم إنسانية</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              type="submit"
              disabled={loading}
              style={{
                background: '#16a34a',
                color: '#fff',
                padding: '8px 20px',
                border: 'none',
                borderRadius: 4,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14
              }}
            >
              {loading ? 'جاري الإنشاء...' : 'إنشاء القسم'}
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
            <th>المعرف</th>
            <th>الاسم</th>
            <th>المستوى</th>
            <th>التخصص</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {sections.map(s => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.name}</td>
              <td>{s.educationalLevel}</td>
              <td>{s.specialization || '-'}</td>
              <td style={{display:'flex',gap:8}}>
                <a href={`/sections/${s.id}`} style={{background:'#2563eb',color:'#fff',padding:'6px 12px',border:'none',borderRadius:4,textDecoration:'none',fontSize:14}}>تفاصيل</a>
                <button 
                  onClick={() => handleDelete(s)}
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
          ))}
        </tbody>
      </table>
      {sections.length === 0 && <p style={{marginTop: 20}}>لا توجد أقسام حالياً</p>}
    </div>
  )
}
