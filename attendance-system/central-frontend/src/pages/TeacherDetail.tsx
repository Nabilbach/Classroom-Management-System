import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { useParams } from 'react-router-dom'

export default function TeacherDetail(){
  const { id } = useParams()
  const [teacher, setTeacher] = useState<any|null>(null)
  const [sections, setSections] = useState<any[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [msg, setMsg] = useState<string|null>(null)

  useEffect(()=>{(async ()=>{
    try{
  const t = await api.get(`/api/admin/users?role=teacher`)
      const found = t.data.find((u:any)=>u.id===id)
      setTeacher(found)
  const s = await api.get('/api/admin/sections')
      const sectionsData = s.data || []
      // fetch counts in parallel
      const counts = await Promise.all(sectionsData.map(async (sec:any) => {
  try{ const r = await api.get(`/api/admin/sections/${sec.id}/students-count`); return r.data.count }catch(e){ return 0 }
      }))
      const sectionsWithCounts = sectionsData.map((sec:any, idx:number)=> ({ ...sec, studentCount: counts[idx] }))
      setSections(sectionsWithCounts)
      setSelected((found?.Sections||[]).map((x:any)=>x.id))
    }catch(e:any){ console.error(e); setMsg('فشل في جلب بيانات المدرس أو الصفوف') }
  })()},[id])

  async function saveAssign(){
    try{
      setMsg('جارٍ حفظ الإسناد...')
      await api.post('/api/admin/assign-sections', { teacherId: id, sectionIds: selected })
      setMsg('تم حفظ الإسناد')
    }catch(e:any){ console.error(e); setMsg(e?.response?.data?.message || 'فشل الحفظ') }
  }

  async function createInstance(){
    try{
      setMsg('جارٍ إنشاء النسخة...')
      const res = await api.post('/api/admin/create-instance', { teacherId: id })
      setMsg(`تم إنشاء نسخة: ${res.data.path} (الطلاب: ${res.data.students})`)
    }catch(e:any){ console.error(e); setMsg(e?.response?.data?.message || 'فشل إنشاء النسخة') }
  }

  if(!teacher) return <div className="page">جارِ التحميل...</div>
  return (
    <div className="page">
      <h2>تفاصيل المدرس: {teacher.fullName || teacher.username}</h2>
      <h3>الأقسام المسندة</h3>
      <div>
        {sections.map(s=> (
          <label key={s.id} style={{display:'block'}}>
            <input type="checkbox" checked={selected.includes(s.id)} onChange={e=>{
              if(e.target.checked) setSelected(prev=>[...prev,s.id])
              else setSelected(prev=>prev.filter(x=>x!==s.id))
            }} /> {s.name} ({s.educationalLevel})
          </label>
        ))}
      </div>
      <div style={{marginTop:8}}>
        <button onClick={saveAssign}>حفظ إسناد الصفوف</button>
        <button onClick={createInstance} style={{marginLeft:8}}>إنشاء نسخة الأستاذ</button>
      </div>
      {msg && <div style={{marginTop:8}}>{msg}</div>}
    </div>
  )
}
