    'use client'
    import { useState } from 'react'
    import { supabase } from '@/lib/supabase'
    import { useRouter } from 'next/navigation'

    export default function Login() {
      const [email, setEmail] = useState('')
      const [password, setPassword] = useState('')
      const [message, setMessage] = useState('')
      const router = useRouter()

      const handleLogin = async (e) => {
        e.preventDefault()
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setMessage(error.message)
        else router.push('/dashboard')
      }

      return (
        <div style={{ padding: '20px' }}>
          <h1>Login</h1>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required /><br />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required /><br />
            <button type="submit">Log In</button>
          </form>
          <p>{message}</p>
        </div>
      )
    }