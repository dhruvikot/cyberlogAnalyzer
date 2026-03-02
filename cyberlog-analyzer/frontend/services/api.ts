const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options?.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...options?.headers,
    },
  })

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error((error as any).error || `Request failed: ${res.status}`)
  }

  return res.json() as Promise<T>
}

export const api = {
  auth: {
    // Silent check — never redirects on 401, just returns true/false
    checkAuth: async (): Promise<boolean> => {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/me`, {
          credentials: 'include',
        })
        return res.ok
      } catch {
        return false
      }
    },
    login: (email: string, password: string) =>
      request<{ success: boolean; user: { email: string } }>(
        '/api/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      ),
    logout: () =>
      request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
    me: () =>
      request<{ success: boolean; user: import('@/types').User }>(
        '/api/auth/me'
      ),
    signup: (email: string, password: string, name?: string) =>
      request<{ success: boolean; user: { email: string } }>(
        '/api/auth/signup',
        {
          method: 'POST',
          body: JSON.stringify({ email, password, confirmPassword: password, name }),
        }
      ),
  },

  sessions: {
    create: (name?: string) =>
      request<{ success: boolean; session: import('@/types').UploadSession }>(
        '/api/sessions',
        { method: 'POST', body: JSON.stringify({ name }) }
      ),
    getOne: (id: string) =>
      request<{ success: boolean; session: import('@/types').UploadSession }>(
        `/api/sessions/${id}`
      ),
    getAll: () =>
      request<{
        success: boolean
        sessions: import('@/types').UploadSession[]
      }>('/api/sessions'),
    deleteSession: (sessionId: string) =>
      request<{ success: boolean }>(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      }),
    correlations: (id: string) =>
      request<{
        success: boolean
        correlations: import('@/types').Correlation[]
      }>(`/api/sessions/${id}/correlations`),
  },

  files: {
    upload: (sessionId: string, file: File) => {
      const form = new FormData()
      form.append('file', file)
      return request<{
        success: boolean
        file: { id: string; name: string; status: string; logType: string }
      }>(`/api/sessions/${sessionId}/files`, {
        method: 'POST',
        body: form,
      })
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
    deleteFile: (fileId: string) =>
      request<{ success: boolean }>(`/api/files/${fileId}`, {
        method: 'DELETE',
      }),
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
  },
}
