import React, { useState } from 'react'
import api from '../services/api'

const LEVELS = ['جذع مشترك', 'أولى بكالوريا', 'ثانية بكالوريا']
const SPECIALIZATIONS = ['آداب وعلوم إنسانية', 'علوم خيار فرنسية', 'علوم خيار عربية', 'علوم الحياة والأرض', 'علوم فيزيائية', 'علوم إنسانية']

export default function AddSectionPage(){
  const [name, setName] = useState('')
  const [level, setLevel] = useState(LEVELS[0])
  const [specialization, setSpecialization] = useState(SPECIALIZATIONS[0])
  const [msg, setMsg] = useState<string|null>(null)
  const [fileMsg, setFileMsg] = useState<string|null>(null)

  async function submit(e:any){
    e.preventDefault()
    try{
      const res = await api.post('/api/admin/sections', { name, educationalLevel: level, specialization })
      setMsg('تم إنشاء الصف: ' + res.data.section.id)
    }catch(e:any){ console.error(e); setMsg(e?.response?.data?.message || 'فشل') }
  }

  // bulk upload: accept JSON or CSV (simple)
  async function handleFile(e:any){
    setFileMsg(null)
    const f = e.target.files && e.target.files[0]
    if(!f) return
    const text = await f.text()
    let arr:any[] = []
    try{
      if(f.name.endsWith('.json')) arr = JSON.parse(text)
      else {
        // simple CSV: name,level,specialization (header optional)
        const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean)
        // if header
        if(lines[0] && /name/i.test(lines[0])) lines.shift()
        arr = lines.map(l=>{
          const parts = l.split(',')
          return { name: parts[0]?.trim(), educationalLevel: parts[1]?.trim(), specialization: parts[2]?.trim() }
        })
      }
    }catch(err){ setFileMsg('فشل في قراءة الملف'); return }
    try{
      const res = await api.post('/api/admin/sections/bulk', { sections: arr })
      setFileMsg('تم إنشاء الصفوف: ' + res.data.count)
    }catch(err:any){ console.error(err); setFileMsg(err?.response?.data?.message || 'فشل في رفع الملف') }
  }

  return (
    <div className="page">
      <h2>إضافة صف</h2>
      <form onSubmit={submit} style={{maxWidth:400}}>
        <div><label>الاسم</label><input value={name} onChange={e=>setName(e.target.value)} /></div>
        <div><label>المستوى</label>
          <select value={level} onChange={e=>setLevel(e.target.value)}>
            {LEVELS.map(l=> <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div><label>التخصص</label>
          <select value={specialization} onChange={e=>setSpecialization(e.target.value)}>
            {SPECIALIZATIONS.map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{marginTop:8}}><button type="submit">إنشاء</button></div>
        {msg && <div style={{marginTop:8}}>{msg}</div>}
      </form>

      <hr />
      <h3>رفع دفعي للصفوف (CSV أو JSON)</h3>
      <input type="file" accept=".csv,.json" onChange={handleFile} />
      {fileMsg && <div style={{marginTop:8}}>{fileMsg}</div>}
    </div>
  )
}
