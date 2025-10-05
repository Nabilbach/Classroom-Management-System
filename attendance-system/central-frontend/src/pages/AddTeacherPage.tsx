import React, { useState } from 'react'
import api from '../services/api'

export default function AddTeacherPage(){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [msg, setMsg] = useState<string|null>(null)

  async function submit(e:any){
    e.preventDefault()
    try{
      const res = await api.post('/api/admin/users', { username, password, fullName, role: 'teacher' })
      setMsg('تم إنشاء المستخدم: ' + res.data.user.id)
    }catch(e:any){ console.error(e); setMsg(e?.response?.data?.message || 'فشل') }
  }

  return (
    <div className="page">
      <h2>إضافة أستاذ</h2>
      <form onSubmit={submit} style={{maxWidth:400}}>
        <div><label>اسم المستخدم</label><input value={username} onChange={e=>setUsername(e.target.value)} /></div>
        <div><label>كلمة المرور</label><input value={password} onChange={e=>setPassword(e.target.value)} /></div>
        <div><label>الاسم الكامل</label><input value={fullName} onChange={e=>setFullName(e.target.value)} /></div>
        <div style={{marginTop:8}}><button type="submit">إنشاء</button></div>
        {msg && <div style={{marginTop:8}}>{msg}</div>}
      </form>
    </div>
  )
}
