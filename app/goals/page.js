  'use client'
  import { useEffect, useState } from 'react'
  import { supabase } from '@/lib/supabase'
  import { useRouter } from 'next/navigation'

  export default function Goals() {
    const [goalName, setGoalName] = useState('')
    const [targetAmount, setTargetAmount] = useState('')
    const [targetDate, setTargetDate] = useState('')
    const [message, setMessage] = useState('')
    const [goals, setGoals] = useState([])
    const router = useRouter()

    const fetchGoals = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('target_date', { ascending: true })

      if (!error) setGoals(data)
    }

    useEffect(() => {
      const loadData = async () => {
        await fetchGoals()
      }
      loadData()
    }, [])

    const handleAddGoal = async (e) => {
      e.preventDefault()

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

      const { error } = await supabase.from('goals').insert({
        user_id: userData.user.id,
        goal_name: goalName,
        target_amount: parseFloat(targetAmount),
        saved_amount: 0,
        target_date: targetDate,
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Goal added!')
        setGoalName('')
        setTargetAmount('')
        setTargetDate('')
        fetchGoals()
      }
    }

    const handleAddSavings = async (id, currentSaved) => {
      const amount = prompt('How much do you want to add to savings?')
      if (!amount) return

      const newSaved = currentSaved + parseFloat(amount)
      const { error } = await supabase
        .from('goals')
        .update({ saved_amount: newSaved })
        .eq('id', id)

      if (!error) fetchGoals()
    }

    const handleDelete = async (id) => {
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (!error) fetchGoals()
    }

    const calculateMonthlyRequired = (goal) => {
      const today = new Date()
      const deadline = new Date(goal.target_date)
      const monthsLeft = Math.max(
        (deadline.getFullYear() - today.getFullYear()) * 12 + (deadline.getMonth() - today.getMonth()),
        1
      )
      const remaining = goal.target_amount - goal.saved_amount
      return remaining > 0 ? (remaining / monthsLeft).toFixed(2) : 0
    }

    return (
      <div style={{ padding: '20px', color: 'white' }}>
        <h1>Financial Goals</h1>

        <form onSubmit={handleAddGoal}>
          <input type="text" placeholder="Goal Name (e.g. Emergency Fund)" value={goalName} onChange={(e) => setGoalName(e.target.value)} required /><br />
          <input type="number" step="0.01" placeholder="Target Amount" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required /><br />
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required /><br />
          <button type="submit">Add Goal</button>
        </form>
        <p>{message}</p>

        <h2>Your Goals</h2>
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Goal</th>
              <th>Target</th>
              <th>Saved</th>
              <th>Progress</th>
              <th>Deadline</th>
              <th>Required/Month</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {goals.map((g) => {
              const progress = ((g.saved_amount / g.target_amount) * 100).toFixed(1)
              return (
                <tr key={g.id}>
                  <td>{g.goal_name}</td>
                  <td>{g.target_amount}</td>
                  <td>{g.saved_amount}</td>
                  <td>{progress}%</td>
                  <td>{g.target_date}</td>
                  <td>{calculateMonthlyRequired(g)}</td>
                  <td>
                    <button onClick={() => handleAddSavings(g.id, g.saved_amount)}>Add Savings</button>
                    <button onClick={() => handleDelete(g.id)}>Delete</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }