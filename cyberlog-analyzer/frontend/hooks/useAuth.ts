import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api, tokenStorage } from '@/services/api'
import { User } from '@/types'

export function useAuth(requireAuth = true) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = tokenStorage.get()

    if (!token) {
      if (requireAuth) {
        router.push('/login')
      }
      setLoading(false)
      return
    }

    api.auth
      .me()
      .then(res => setUser(res.user))
      .catch(() => {
        tokenStorage.clear()
        if (requireAuth) {
          router.push('/login')
        }
      })
      .finally(() => setLoading(false))
  }, [requireAuth, router])

  const logout = async () => {
    await api.auth.logout()
    router.push('/login')
  }

  return { user, loading, logout }
}
