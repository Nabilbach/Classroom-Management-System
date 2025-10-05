import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function SectionsPage(){
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const loadSections = async () => {
    try{ 
      const res = await api.get('/api/sections')
      setSections(res.data)
    } catch(e: any){ 
      console.error(e)
      setError('فشل في تحميل الأقسام')
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
      await api.delete(`/api/admin/sections/${section.id}`)
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
              <td>
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
