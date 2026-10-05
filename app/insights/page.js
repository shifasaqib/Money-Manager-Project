  'use client'
  import { useEffect, useState } from 'react'
  import { supabase } from '@/lib/supabase'
  import { useRouter } from 'next/navigation'

  export default function Insights() {
    const [loading, setLoading] = useState(true)
    const [spendingData, setSpendingData] = useState({})
    const [insights, setInsights] = useState('')
    const [error, setError] = useState('')
    const router = useRouter()

    const fetchInsights = async () => {
      setLoading(true)
      setError('')

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userData.user.id }),
        })
        const data = await res.json()

        if (data.error) {
          setError(data.error)
        } else {
          setSpendingData(data.spendingData)
          setInsights(data.insights)
        }
      } catch (err) {
        setError(err.message)
      }

      setLoading(false)
    }

    useEffect(() => {
      fetchInsights()
    }, [])

    return (
      <div style={styles.page}>
        <h1>AI Spending Insights</h1>

        <button onClick={fetchInsights} disabled={loading} style={styles.refreshBtn}>
          {loading ? 'Analyzing...' : 'Refresh Insights'}
        </button>

        {error && <p style={{ color: '#f44336' }}>{error}</p>}

        <div style={styles.section}>
          <h2>This Month's Spending by Category</h2>
          {Object.keys(spendingData).length === 0 ? (
            <p>No spending data yet.</p>
          ) : (
            <table style={styles.table} border="1" cellPadding="8">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(spendingData).map(([cat, amt]) => (
                  <tr key={cat}>
                    <td>{cat}</td>
                    <td>{amt.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={styles.section}>
          <h2>AI Insights</h2>
          {loading ? (
            <p>Thinking...</p>
          ) : (
            <pre style={styles.insightsBox}>{insights}</pre>
          )}
        </div>
      </div>
    )
  }

  const styles = {
    page: {
      padding: '20px',
      color: 'white',
      backgroundColor: '#111',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
    },
    refreshBtn: {
      padding: '8px 16px',
      marginBottom: '20px',
      cursor: 'pointer',
    },
    section: {
      marginBottom: '30px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      color: 'white',
    },
    insightsBox: {
      backgroundColor: '#1e1e1e',
      padding: '15px',
      borderRadius: '8px',
      whiteSpace: 'pre-wrap',
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
    },
  }