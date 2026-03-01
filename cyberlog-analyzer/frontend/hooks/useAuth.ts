import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import { User } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.auth
      .me()
      .then(res => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const logout = async () => {
    await api.auth.logout()
    window.location.href = '/login'
  }

  return { user, loading, logout }
}
