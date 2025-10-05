import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Dashboard(){
  const [stats, setStats] = useState<any>({})
  useEffect(()=>{
    (async ()=>{
      try{
        const [students, sections, teachers] = await Promise.all([
          axios.get('/api/students'),
          axios.get('/api/sections'),
          axios.get('/api/users?role=teacher')
        ])
        setStats({ students: students.data.length, sections: sections.data.length, teachers: teachers.data.length })
      }catch(e){ console.error(e) }
    })()
  },[])
  return (
    <div className="page">
      <h1>Central Admin</h1>
      <div className="cards">
        <div className="card">Students<br/>{stats.students ?? '...'} </div>
        <div className="card">Sections<br/>{stats.sections ?? '...'} </div>
        <div className="card">Teachers<br/>{stats.teachers ?? '...'} </div>
      </div>
    </div>
  )
}
