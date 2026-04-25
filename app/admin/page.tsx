'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Discipline, SlalomResult } from '@/lib/sorting'

const ADMIN_PASSWORD = 'waterski2024'

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [athletes, setAthletes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [classOrder, setClassOrder] = useState<string[]>([])

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
    else {
      const meta = data?.find((a: any) => a.name === '_metadata_')
      const actualAthletes = data?.filter((a: any) => a.name !== '_metadata_') || []
      setAthletes(actualAthletes)
      if (meta && meta.result_1?.classOrder) {
        setClassOrder(meta.result_1.classOrder)
      }
    }
    setLoading(false)
  }

  async function moveClass(cls: string, direction: 'up' | 'down') {
    try {
      const currentClasses = Array.from(new Set(athletes.map((a: any) => a.class)))
      let fullOrder = [...classOrder]
      
      // Ensure all current classes are represented in the order
      currentClasses.forEach(c => {
        if (!fullOrder.includes(c)) fullOrder.push(c)
      })
      
      const index = fullOrder.indexOf(cls)
      if (index === -1) return

      const newOrder = [...fullOrder]
      if (direction === 'up' && index > 0) {
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
      } else if (direction === 'down' && index < newOrder.length - 1) {
        [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]]
      } else {
        return // Already at the top/bottom
      }

      // Update local state immediately for snappy UI
      setClassOrder(newOrder)

      const { error } = await supabase.from('athletes').upsert({
        id: '00000000-0000-0000-0000-000000000001', // Use a consistent non-nil UUID
        name: '_metadata_',
        class: '_metadata_',
        discipline: 'slalom',
        result_1: { classOrder: newOrder }
      })

      if (error) {
        alert('Error saving new class order: ' + error.message)
        fetchAthletes() // Revert to server state
      } else {
        fetchAthletes() // Final sync
      }
    } catch (err) {
      console.error(err)
      alert('An unexpected error occurred while moving class')
    }
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

  const toggleStatus = (id: string, round: number, currentRes: any, newStatus: string) => {
    const status = currentRes.status === newStatus ? null : newStatus
    updateResult(id, round, 'slalom' as Discipline, { ...currentRes, status })
  }

  const renderResultInput = (athlete: any, round: number) => {
    const res = round === 1 ? athlete.result_1 : athlete.result_2
    const isSlalom = athlete.discipline === 'slalom'
    
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {isSlalom ? (
          <div style={{ display: 'flex' }}>
            <input className="result-input" placeholder="Sp" defaultValue={res.speed} onBlur={(e) => updateResult(athlete.id, round, 'slalom', { ...res, speed: Number(e.target.value) })} />
            <input className="result-input" placeholder="Li" defaultValue={res.line} onBlur={(e) => updateResult(athlete.id, round, 'slalom', { ...res, line: Number(e.target.value) })} />
            <input className="result-input" placeholder="Bu" defaultValue={res.buoys} onBlur={(e) => updateResult(athlete.id, round, 'slalom', { ...res, buoys: Number(e.target.value) })} />
          </div>
        ) : (
          <input className="result-input" type="number" placeholder="Val" defaultValue={res.value} onBlur={(e) => updateResult(athlete.id, round, athlete.discipline, { ...res, value: Number(e.target.value) })} />
        )}
        <button 
          onClick={() => toggleStatus(athlete.id, round, res, 'on water')}
          style={{ backgroundColor: res.status === 'on water' ? '#004a99' : '#ccc', color: 'white', border: 'none', padding: '4px 8px', marginLeft: '5px', borderRadius: '4px', cursor: 'pointer' }}
          title="On Water"
        >W</button>
        <button 
          onClick={() => toggleStatus(athlete.id, round, res, 'confirmed')}
          style={{ backgroundColor: res.status === 'confirmed' ? '#28a745' : '#ccc', color: 'white', border: 'none', padding: '4px 8px', marginLeft: '5px', borderRadius: '4px', cursor: 'pointer' }}
          title="Confirmed"
        >C</button>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
          <Link href="/" style={{ fontSize: '0.9rem', color: '#004a99', textDecoration: 'none', border: '1px solid #004a99', padding: '4px 8px', borderRadius: '4px' }}>Back to Leaderboard</Link>
        </div>
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
      <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
        <Link href="/" style={{ fontSize: '0.9rem', color: '#004a99', textDecoration: 'none', border: '1px solid #004a99', padding: '4px 8px', borderRadius: '4px' }}>Back to Leaderboard</Link>
      </div>
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
        {(() => {
          const distinctClasses = Array.from(new Set(athletes.map((a: any) => a.class)))
          const sortedClasses = [...distinctClasses].sort((a: any, b: any) => {
            const idxA = classOrder.indexOf(a)
            const idxB = classOrder.indexOf(b)
            if (idxA === -1 && idxB === -1) return a.localeCompare(b)
            if (idxA === -1) return 1
            if (idxB === -1) return -1
            return idxA - idxB
          })

          return sortedClasses.map((cls: any) => (
            <div key={cls} style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f4f4f4', padding: '10px', borderRadius: '4px' }}>
                <button onClick={() => moveClass(cls, 'up')} style={{ marginRight: '5px' }}>↑</button>
                <button onClick={() => moveClass(cls, 'down')} style={{ marginRight: '15px' }}>↓</button>
                <h3 style={{ margin: 0 }}>Class: {cls}</h3>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Club</th>
                    <th>Discipline</th>
                    <th>Round 1</th>
                    <th>Round 2</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {athletes.filter((a: any) => a.class === cls).map((a: any) => (
                    <tr key={a.id}>
                      <td>{a.name}</td>
                      <td>{a.club}</td>
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
            </div>
          ))
        })()}
      </section>
    </div>
  )
}
