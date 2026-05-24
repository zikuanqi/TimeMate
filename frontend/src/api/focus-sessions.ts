const API_BASE = 'http://localhost:8000/api'

export interface InterruptionData {
  id?: number
  session_id?: number
  reason: string
  note?: string
  time?: string
}

export interface FocusSessionData {
  id?: number
  time_block_id?: number | null
  task_id?: number | null
  start_time: string
  end_time?: string | null
  planned_duration: number
  actual_duration?: number | null
  completed: boolean
  created_at?: string
  interruptions?: InterruptionData[]
}

export interface DailyStats {
  date: string
  total_focus_seconds: number
  total_sessions: number
  completed_sessions: number
  interruption_stats: { reason: string; count: number }[]
}

export const focusSessionsApi = {
  list: async (params: {
    date?: string
    completed?: boolean
    limit?: number
  } = {}): Promise<FocusSessionData[]> => {
    const search = new URLSearchParams()
    if (params.date) search.set('date', params.date)
    if (params.completed !== undefined) search.set('completed', String(params.completed))
    if (params.limit) search.set('limit', String(params.limit))
    const res = await fetch(`${API_BASE}/focus-sessions/?${search}`)
    if (!res.ok) throw new Error('Failed to fetch focus sessions')
    return res.json()
  },

  getActive: async (): Promise<FocusSessionData | null> => {
    const res = await fetch(`${API_BASE}/focus-sessions/active`)
    if (!res.ok) throw new Error('Failed to get active session')
    const data = await res.json()
    return data || null
  },

  create: async (session: {
    time_block_id?: number | null
    task_id?: number | null
    planned_duration: number
    start_time: string
  }): Promise<FocusSessionData> => {
    const res = await fetch(`${API_BASE}/focus-sessions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    })
    if (!res.ok) throw new Error('Failed to create focus session')
    return res.json()
  },

  update: async (id: number, updates: {
    end_time?: string
    actual_duration?: number
    completed?: boolean
  }): Promise<FocusSessionData> => {
    const res = await fetch(`${API_BASE}/focus-sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Failed to update focus session')
    return res.json()
  },

  addInterruption: async (sessionId: number, interruption: {
    reason: string
    note?: string
  }): Promise<InterruptionData> => {
    const res = await fetch(`${API_BASE}/focus-sessions/${sessionId}/interruptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interruption),
    })
    if (!res.ok) throw new Error('Failed to add interruption')
    return res.json()
  },

  getDailyStats: async (date: string): Promise<DailyStats> => {
    const res = await fetch(`${API_BASE}/focus-sessions/stats/daily?date=${date}`)
    if (!res.ok) throw new Error('Failed to get daily stats')
    return res.json()
  },
}