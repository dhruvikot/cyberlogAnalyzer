const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// Token management using sessionStorage
const TOKEN_KEY = 'cyberlog_token'

export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null
    return sessionStorage.getItem(TOKEN_KEY)
  },
  set: (token: string): void => {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(TOKEN_KEY, token)
  },
  clear: (): void => {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(TOKEN_KEY)
  },
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.get()

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData
      ? {}
      : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    tokenStorage.clear()
    if (
      typeof window !== 'undefined' &&
      !window.location.pathname.includes('/login')
    ) {
      window.location.href = '/login'
    }
    const error = await response.json().catch(() => ({ message: 'Unauthorized' }))
    throw new Error(error.message || 'Unauthorized')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(
      (error as any).error || error.message || `HTTP ${response.status}`
    )
  }

  return response.json() as Promise<T>
}

export const api = {
  auth: {
    // Silent check — reads from storage, no network call needed
    checkAuth: (): boolean => {
      return tokenStorage.get() !== null
    },

    login: async (email: string, password: string) => {
      const res = await request<{
        success: boolean
        token: string
        user: { email: string; name?: string }
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (res.token) tokenStorage.set(res.token)
      return res
    },

    signup: async (email: string, password: string, name?: string) => {
      const res = await request<{
        success: boolean
        token: string
        user: { email: string }
      }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, confirmPassword: password, name }),
      })
      if (res.token) tokenStorage.set(res.token)
      return res
    },

    logout: async () => {
      try {
        await request('/api/auth/logout', { method: 'POST' })
      } finally {
        tokenStorage.clear()
      }
    },

    me: () =>
      request<{ success: boolean; user: import('@/types').User }>(
        '/api/auth/me'
      ),
  },

  sessions: {
    create: (name?: string) =>
      request<{ success: boolean; session: import('@/types').UploadSession }>(
        '/api/sessions',
        { method: 'POST', body: JSON.stringify({ name }) }
      ),
    getAll: () =>
      request<{ success: boolean; sessions: import('@/types').UploadSession[] }>(
        '/api/sessions'
      ),
    getOne: (id: string) =>
      request<{ success: boolean; session: import('@/types').UploadSession }>(
        `/api/sessions/${id}`
      ),
    correlations: (id: string) =>
      request<{ success: boolean; correlations: import('@/types').Correlation[] }>(
        `/api/sessions/${id}/correlations`
      ),
    deleteSession: (sessionId: string) =>
      request<{ success: boolean }>(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      }),
  },

  files: {
    upload: (sessionId: string, file: File) => {
      const form = new FormData()
      form.append('file', file)
      const token = tokenStorage.get()
      return fetch(`${BASE_URL}/api/sessions/${sessionId}/files`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      }).then(res => res.json())
    },
    getFile: (fileId: string) =>
      request<{ success: boolean; file: import('@/types').LogFile }>(
        `/api/files/${fileId}`
      ),
    getAnalysis: (fileId: string) =>
      request<{ success: boolean; analysis: import('@/types').Analysis }>(
        `/api/files/${fileId}/analysis`
      ),
    getAnomalies: (fileId: string) =>
      request<{ success: boolean; anomalies: import('@/types').Anomaly[] }>(
        `/api/files/${fileId}/anomalies`
      ),
    getEntries: (fileId: string, params: Record<string, string>) => {
      const qs = new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== '')
        )
      ).toString()
      return request<{
        success: boolean
        entries: import('@/types').LogEntry[]
        pagination: {
          page: number
          limit: number
          total: number
          totalPages: number
        }
      }>(`/api/files/${fileId}/entries?${qs}`)
    },
    deleteFile: (fileId: string) =>
      request<{ success: boolean }>(`/api/files/${fileId}`, {
        method: 'DELETE',
      }),
  },
}
