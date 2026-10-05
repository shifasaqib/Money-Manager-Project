  'use client'
  import { useEffect, useState } from 'react'
  import { supabase } from '@/lib/supabase'
  import { useRouter } from 'next/navigation'

  export default function Dashboard() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [balance, setBalance] = useState(0)
    const [income, setIncome] = useState(0)
    const [expenses, setExpenses] = useState(0)
    const [budgets, setBudgets] = useState([])
    const [spendingByCategory, setSpendingByCategory] = useState({})
    const [goals, setGoals] = useState([])
    const router = useRouter()

    const currentMonth = new Date().toISOString().slice(0, 7) + '-01'

    useEffect(() => {
      const loadData = async () => {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/login')
          return
        }
        setUser(userData.user)

        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userData.user.id)
          .gte('date', currentMonth)

        if (transactions) {
          let inc = 0
          let exp = 0
          const catTotals = {}
          transactions.forEach((t) => {
            if (t.type === 'income') inc += parseFloat(t.amount)
            else {
              exp += parseFloat(t.amount)
              catTotals[t.category] = (catTotals[t.category] || 0) + parseFloat(t.amount)
            }
          })
          setIncome(inc)
          setExpenses(exp)
          setBalance(inc - exp)
          setSpendingByCategory(catTotals)
        }

        const { data: budgetData } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', userData.user.id)
          .eq('month', currentMonth)
        if (budgetData) setBudgets(budgetData)

        const { data: goalData } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', userData.user.id)
          .order('target_date', { ascending: true })
        if (goalData) setGoals(goalData)

        setLoading(false)
      }
      loadData()
    }, [])

    const handleLogout = async () => {
      await supabase.auth.signOut()
      router.push('/login')
    }

    if (loading) return <p style={{ padding: '20px', color: 'white' }}>Loading...</p>

    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <h1>Dashboard</h1>
          <div>
            <span style={{ marginRight: '15px' }}>{user?.email}</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>Log Out</button>
          </div>
        </div>

        <div style={styles.summaryGrid}>
          <div style={styles.card}>
            <h3>Balance</h3>
            <p style={styles.bigNumber}>{balance.toFixed(2)}</p>
          </div>
          <div style={styles.card}>
            <h3>Income</h3>
            <p style={{ ...styles.bigNumber, color: '#4caf50' }}>{income.toFixed(2)}</p>
          </div>
          <div style={styles.card}>
            <h3>Expenses</h3>
            <p style={{ ...styles.bigNumber, color: '#f44336' }}>{expenses.toFixed(2)}</p>
          </div>
        </div>

        <div style={styles.section}>
          <h2>Budgets vs Spending</h2>
          {budgets.length === 0 ? (
            <p>No budgets set for this month.</p>
          ) : (
            <table style={styles.table} border="1" cellPadding="8">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Limit</th>
                  <th>Spent</th>
                  <th>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b) => {
                  const spent = spendingByCategory[b.category] || 0
                  const remaining = b.monthly_limit - spent
                  return (
                    <tr key={b.id}>
                      <td>{b.category}</td>
                      <td>{b.monthly_limit}</td>
                      <td>{spent}</td>
                      <td style={{ color: remaining < 0 ? '#f44336' : '#4caf50' }}>{remaining}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={styles.section}>
          <h2>Goals</h2>
          {goals.length === 0 ? (
            <p>No goals set yet.</p>
          ) : (
            <table style={styles.table} border="1" cellPadding="8">
              <thead>
                <tr>
                  <th>Goal</th>
                  <th>Target</th>
                  <th>Saved</th>
                  <th>Progress</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((g) => (
                  <tr key={g.id}>
                    <td>{g.goal_name}</td>
                    <td>{g.target_amount}</td>
                    <td>{g.saved_amount}</td>
                    <td>{((g.saved_amount / g.target_amount) * 100).toFixed(1)}%</td>
                    <td>{g.target_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={styles.links}>
          <a href="/transactions" style={styles.link}>Manage Transactions</a>
          <a href="/budgets" style={styles.link}>Manage Budgets</a>
          <a href="/goals" style={styles.link}>Manage Goals</a>
          <a href="/insights" style={styles.link}>AI Insights</a>
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
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      borderBottom: '1px solid #333',
      paddingBottom: '10px',
    },
    logoutBtn: {
      padding: '6px 12px',
      cursor: 'pointer',
    },
    summaryGrid: {
      display: 'flex',
      gap: '15px',
      marginBottom: '30px',
    },
    card: {
      backgroundColor: '#1e1e1e',
      padding: '15px 20px',
      borderRadius: '8px',
      flex: 1,
      textAlign: 'center',
    },
    bigNumber: {
      fontSize: '28px',
      fontWeight: 'bold',
      margin: 0,
    },
    section: {
      marginBottom: '30px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      color: 'white',
    },
    links: {
      display: 'flex',
      gap: '20px',
      marginTop: '20px',
    },
    link: {
      color: '#4caf50',
      textDecoration: 'none',
      fontWeight: 'bold',
    },
  }