import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { sortAthletes, getBestResult, SlalomResult } from '@/lib/sorting'

export default function PublicPage() {
  const [athletes, setAthletes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAthletes()
    
    // Simple polling or realtime (if enabled in Supabase)
    const channel = supabase.channel('athletes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'athletes' }, () => {
        fetchAthletes()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchAthletes() {
    const { data, error } = await supabase.from('athletes').select('*')
    if (error) {
      console.error('Error fetching data:', error)
    } else {
      setAthletes(sortAthletes(data))
    }
    setLoading(false)
  }

  const formatResult = (discipline: string, res: any) => {
    if (!res || JSON.stringify(res) === '{}') return '-'
    if (discipline === 'slalom') {
      const s = res as SlalomResult
      return `${s.speed}km/${s.line}m/${s.buoys}`
    }
    return `${res.value}`
  }

  if (loading) return <p>Loading results...</p>

  // Group by Class
  const classes = Array.from(new Set(athletes.map(a => a.class))).sort()

  return (
    <div>
      <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
        <Link href="/admin" style={{ fontSize: '0.9rem', color: '#004a99', textDecoration: 'none', border: '1px solid #004a99', padding: '4px 8px', borderRadius: '4px' }}>Admin / Editor</Link>
      </div>
      {classes.map(cls => (
        <div key={cls}>
          <h2>Class {cls}</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Club</th>
                <th>Discipline</th>
                <th>Round 1</th>
                <th>Round 2</th>
                <th>Best</th>
              </tr>
            </thead>
            <tbody>
              {athletes.filter(a => a.class === cls).map(athlete => {
                const best = getBestResult(athlete.discipline, athlete.result_1, athlete.result_2)
                return (
                  <tr key={athlete.id}>
                    <td>{athlete.name}</td>
                    <td>{athlete.club}</td>
                    <td>{athlete.discipline.toUpperCase()}</td>
                    <td>{formatResult(athlete.discipline, athlete.result_1)}</td>
                    <td>{formatResult(athlete.discipline, athlete.result_2)}</td>
                    <td><strong>{formatResult(athlete.discipline, best)}</strong></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
