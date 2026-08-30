    'use client'
    import { useEffect, useState } from 'react'
    import { supabase } from '@/lib/supabase'
    import { useRouter } from 'next/navigation'

    export default function Dashboard() {
      const [user, setUser] = useState(null)
      const [loading, setLoading] = useState(true)
      const router = useRouter()

      useEffect(() => {
        const checkUser = async () => {
          const { data } = await supabase.auth.getUser()
          if (!data.user) {
            router.push('/login')
          } else {
            setUser(data.user)
          }
          setLoading(false)
        }
        checkUser()
      }, [])

      const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
      }

      if (loading) return <p style={{ padding: '20px' }}>Loading...</p>

      return (
        <div style={{ padding: '20px' }}>
          <h1>Welcome to your Dashboard</h1>
          <p>Logged in as: {user?.email}</p>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      )
    }