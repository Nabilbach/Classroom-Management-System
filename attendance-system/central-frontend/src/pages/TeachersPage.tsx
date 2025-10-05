import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { Link } from 'react-router-dom'

export default function TeachersPage(){
  const [teachers, setTeachers] = useState<any[]>([])
  useEffect(()=>{(async ()=>{
    try{ const res = await api.get('/api/users?role=teacher'); setTeachers(res.data) }catch(e){ console.error(e) }
  })()},[])
  return (
    <div className="page">
      <h2>Teachers</h2>
      <table>
        <thead><tr><th>id</th><th>username</th><th>fullName</th><th>actions</th></tr></thead>
        <tbody>
          {teachers.map(t=> <tr key={t.id}><td>{t.id}</td><td>{t.username}</td><td>{t.fullName}</td><td><Link to={`/teachers/${t.id}`}>تفاصيل</Link></td></tr>)}
        </tbody>
      </table>
    </div>
  )
}
