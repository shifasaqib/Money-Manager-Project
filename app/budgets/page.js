  'use client'
  import { useEffect, useState } from 'react'
  import { supabase } from '@/lib/supabase'
  import { useRouter } from 'next/navigation'

  export default function Budgets() {
    const [category, setCategory] = useState('')
    const [monthlyLimit, setMonthlyLimit] = useState('')
    const [message, setMessage] = useState('')
    const [budgets, setBudgets] = useState([])
    const [spendingByCategory, setSpendingByCategory] = useState({})
    const router = useRouter()

    // Use the 1st of the current month as the "month" value
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01'

    const fetchBudgets = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('month', currentMonth)

      if (!error) setBudgets(data)
    }

    const fetchSpending = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const startOfMonth = currentMonth
      const { data, error } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('user_id', userData.user.id)
        .eq('type', 'expense')
        .gte('date', startOfMonth)

      if (!error) {
        const totals = {}
        data.forEach((t) => {
          totals[t.category] = (totals[t.category] || 0) + parseFloat(t.amount)
        })
        setSpendingByCategory(totals)
      }
    }

    useEffect(() => {
      const loadData = async () => {
        await fetchBudgets()
        await fetchSpending()
      }
      loadData()
    }, [])

    const handleAddBudget = async (e) => {
      e.preventDefault()

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

      const { error } = await supabase.from('budgets').insert({
        user_id: userData.user.id,
        category,
        monthly_limit: parseFloat(monthlyLimit),
        month: currentMonth,
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Budget added!')
        setCategory('')
        setMonthlyLimit('')
        fetchBudgets()
      }
    }

    const handleDelete = async (id) => {
      const { error } = await supabase.from('budgets').delete().eq('id', id)
      if (!error) fetchBudgets()
    }

    return (
      <div style={{ padding: '20px' ,  color: 'white'}}>
        <h1>Monthly Budgets ({currentMonth.slice(0, 7)})</h1>

        <form onSubmit={handleAddBudget}>
          <input type="text" placeholder="Category (e.g. Food)" value={category} onChange={(e) => setCategory(e.target.value)} required /><br />
          <input type="number" step="0.01" placeholder="Monthly Limit" value={monthlyLimit} onChange={(e) => setMonthlyLimit(e.target.value)} required /><br />
          <button type="submit">Set Budget</button>
        </form>
        <p>{message}</p>

        <h2>Your Budgets vs Spending</h2>
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Category</th>
              <th>Limit</th>
              <th>Spent</th>
              <th>Remaining</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((b) => {
              const spent = spendingByCategory[b.category] || 0
              const remaining = b.monthly_limit - spent
              return (
                <tr key={b.id} style={{ color: remaining < 0 ? 'red' : 'white' }}>
                  <td>{b.category}</td>
                  <td>{b.monthly_limit}</td>
                  <td>{spent}</td>
                  <td>{remaining}</td>
                  <td><button onClick={() => handleDelete(b.id)}>Delete</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }