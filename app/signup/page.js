    'use client'
    import { useState } from 'react'
    import { supabase } from '@/lib/supabase'

    export default function SignUp() {
      const [email, setEmail] = useState('')
      const [password, setPassword] = useState('')
      const [message, setMessage] = useState('')

      const handleSignUp = async (e) => {
        e.preventDefault()
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) setMessage(error.message)
        else setMessage('Signed up successfully! You can now log in.')
      }

      return (
        <div style={{ padding: '20px' }}>
          <h1>Sign Up</h1>
          <form onSubmit={handleSignUp}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required /><br />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required /><br />
            <button type="submit">Sign Up</button>
          </form>
          <p>{message}</p>
        </div>
      )
    }