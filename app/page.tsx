'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { sortAthletes, getBestResult, SlalomResult } from '@/lib/sorting'

export default function PublicPage() {
  const [athletes, setAthletes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [classOrder, setClassOrder] = useState<string[]>([])

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
      const meta = data?.find((a: any) => a.name === '_metadata_')
      const actualAthletes = data?.filter((a: any) => a.name !== '_metadata_') || []
      setAthletes(sortAthletes(actualAthletes))
      if (meta && meta.result_1?.classOrder) {
        setClassOrder(meta.result_1.classOrder)
      }
    }
    setLoading(false)
  }

  const formatResult = (discipline: string, res: any, showStatus: boolean = true) => {
    let resultStr = ''
    if (res && JSON.stringify(res) !== '{}') {
      if (discipline === 'slalom') {
        const s = res as SlalomResult
        if (s.speed && s.line && s.buoys != null) {
          resultStr = `${s.buoys}/${s.line}/${s.speed}`
        }
      } else if (res.value != null) {
        resultStr = `${res.value}`
      }
    }
    
    if (showStatus && res?.status) {
      const isConfirmed = res.status === 'confirmed'
      const label = isConfirmed ? 'Confirmed' : 'On water'
      const color = isConfirmed ? '#28a745' : '#004a99'
      const statusSpan = <span style={{ color, fontWeight: 'bold' }}>{label}</span>
      return resultStr ? <span>{resultStr} - {statusSpan}</span> : statusSpan
    }
    return resultStr
  }

  if (loading) return <p>Loading results...</p>

  // Group by Class
  // Group by Class
  const distinctClasses = Array.from(new Set(athletes.map((a: any) => a.class)))
  const classes = [...distinctClasses].sort((a: any, b: any) => {
    const idxA = classOrder.indexOf(a)
    const idxB = classOrder.indexOf(b)
    if (idxA === -1 && idxB === -1) return a.localeCompare(b)
    if (idxA === -1) return 1
    if (idxB === -1) return -1
    return idxA - idxB
  })

  return (
    <div>
      <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
        <Link href="/admin" style={{ fontSize: '0.9rem', color: '#004a99', textDecoration: 'none', border: '1px solid #004a99', padding: '4px 8px', borderRadius: '4px' }}>Admin / Editor</Link>
      </div>
      {[1, 2].map(round => (
        <div key={round} style={{ marginBottom: '4rem' }}>
          <h2 style={{ background: '#004a99', color: '#fff', padding: '10px', borderRadius: '4px' }}>ROUND {round}</h2>
          {classes.map(cls => (
            <div key={`${round}-${cls}`}>
              <h3 style={{ padding: '0 1rem' }}>Class {cls}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Club</th>
                    <th>Discipline</th>
                    <th>Result (Round {round})</th>
                    <th>Best</th>
                  </tr>
                </thead>
                <tbody>
                  {athletes.filter((a: any) => a.class === cls).map((athlete: any) => {
                    const res = round === 1 ? athlete.result_1 : athlete.result_2
                    const best = getBestResult(athlete.discipline, athlete.result_1, athlete.result_2)
                    return (
                      <tr key={`${round}-${athlete.id}`}>
                        <td>{athlete.name}</td>
                        <td>{athlete.club}</td>
                        <td>{athlete.discipline.toUpperCase()}</td>
                        <td>{formatResult(athlete.discipline, res)}</td>
                        <td><strong>{formatResult(athlete.discipline, best, false)}</strong></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
      <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
        Update 2.2
      </div>
    </div>
  )
}
