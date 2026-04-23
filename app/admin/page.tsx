'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Discipline, SlalomResult } from '@/lib/sorting'

const ADMIN_PASSWORD = 'waterski2024'

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [athletes, setAthletes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [name, setName] = useState('')
  const [club, setClub] = useState('')
  const [athleteClass, setAthleteClass] = useState('')
  const [discipline, setDiscipline] = useState<Discipline>('jump')

  useEffect(() => {
    if (isLoggedIn) {
      fetchAthletes()
    }
  }, [isLoggedIn])

  async function fetchAthletes() {
    const { data, error } = await supabase.from('athletes').select('*').order('name')
    if (error) console.error(error)
    else setAthletes(data || [])
    setLoading(false)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true)
    } else {
      alert('Incorrect password')
    }
  }

  async function addAthlete(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('athletes').insert([
      { name, club, class: athleteClass, discipline, result_1: {}, result_2: {} }
    ])
    if (error) {
      console.error(error)
      alert('Error adding athlete: ' + error.message)
    } else {
      setName('')
      setClub('')
      setAthleteClass('')
      fetchAthletes()
    }
  }

  async function updateResult(id: string, round: number, discipline: Discipline, value: any) {
    const field = round === 1 ? 'result_1' : 'result_2'
    const { error } = await supabase.from('athletes').update({ [field]: value }).eq('id', id)
    if (error) alert('Error updating result')
    else fetchAthletes()
  }

  const renderResultInput = (athlete: any, round: number) => {
    const res = round === 1 ? athlete.result_1 : athlete.result_2
    if (athlete.discipline === 'slalom') {
      const s = res as SlalomResult
      return (
        <div style={{ display: 'flex' }}>
          <input className="result-input" placeholder="Sp" defaultValue={s.speed} onBlur={(e) => updateResult(athlete.id, round, 'slalom', { ...s, speed: Number(e.target.value) })} />
          <input className="result-input" placeholder="Li" defaultValue={s.line} onBlur={(e) => updateResult(athlete.id, round, 'slalom', { ...s, line: Number(e.target.value) })} />
          <input className="result-input" placeholder="Bu" defaultValue={s.buoys} onBlur={(e) => updateResult(athlete.id, round, 'slalom', { ...s, buoys: Number(e.target.value) })} />
        </div>
      )
    }
    return (
      <input className="result-input" type="number" placeholder="Val" defaultValue={res.value} onBlur={(e) => updateResult(athlete.id, round, athlete.discipline, { value: Number(e.target.value) })} />
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <h1>Admin Login</h1>
        <form onSubmit={handleLogin}>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <button type="submit">Login</button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      
      <section>
        <h2>Add Athlete</h2>
        <form onSubmit={addAthlete}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
          <input value={club} onChange={e => setClub(e.target.value)} placeholder="Club" />
          <input value={athleteClass} onChange={e => setAthleteClass(e.target.value)} placeholder="Class (e.g. U17, Open)" required />
          <select value={discipline} onChange={e => setDiscipline(e.target.value as Discipline)}>
            <option value="jump">Jump</option>
            <option value="trick">Trick</option>
            <option value="slalom">Slalom</option>
          </select>
          <button type="submit">Add</button>
        </form>
      </section>

      <section>
        <h2>Results Management</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Class</th>
              <th>Discipline</th>
              <th>Round 1</th>
              <th>Round 2</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {athletes.map(a => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.class}</td>
                <td>{a.discipline.toUpperCase()}</td>
                <td>{renderResultInput(a, 1)}</td>
                <td>{renderResultInput(a, 2)}</td>
                <td>
                  <button onClick={async () => {
                    if (confirm('Delete?')) {
                      await supabase.from('athletes').delete().eq('id', a.id)
                      fetchAthletes()
                    }
                  }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section style={{ marginTop: '2rem', fontSize: '0.7rem', color: '#999' }}>
        v1.4 URL Fix
      </section>
    </div>
  )
}
