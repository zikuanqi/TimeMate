const API_BASE = 'http://localhost:8000/api'

export interface OverviewData {
  today: {
    date: string
    focus_seconds: number
    focus_sessions: number
    focus_completed: number
    tasks_total: number
    tasks_done: number
    blocks_total: number
    blocks_completed: number
  }
  week: {
    start: string
    end: string
    focus_seconds: number
    focus_sessions: number
    focus_completed: number
    tasks_total: number
    tasks_done: number
    interruption_daily: { date: string; count: number }[]
    top_interruption_reasons: { reason: string; count: number }[]
  }
}

export interface DailyFocus {
  date: string
  total_seconds: number
  sessions: number
  completed: number
}

export interface TaskDistribution {
  by_status: { status: string; count: number }[]
  by_priority: { priority: number; count: number }[]
  by_tag: { tags: string; count: number }[]
}

export interface ProductiveHour {
  hour: number
  total_seconds: number
  sessions: number
}

export interface TimeBlockTypeStat {
  type: string
  count: number
  completed: number
}

export const analyticsApi = {
  getOverview: async (): Promise<OverviewData> => {
    const res = await fetch(`${API_BASE}/analytics/overview`)
    if (!res.ok) throw new Error('Failed to fetch overview')
    return res.json()
  },

  getDailyFocus: async (days: number = 14): Promise<DailyFocus[]> => {
    const res = await fetch(`${API_BASE}/analytics/daily-focus?days=${days}`)
    if (!res.ok) throw new Error('Failed to fetch daily focus')
    return res.json()
  },

  getTaskDistribution: async (): Promise<TaskDistribution> => {
    const res = await fetch(`${API_BASE}/analytics/task-distribution`)
    if (!res.ok) throw new Error('Failed to fetch task distribution')
    return res.json()
  },

  getProductiveHours: async (days: number = 30): Promise<ProductiveHour[]> => {
    const res = await fetch(`${API_BASE}/analytics/productive-hours?days=${days}`)
    if (!res.ok) throw new Error('Failed to fetch productive hours')
    return res.json()
  },

  getTimeBlockTypes: async (days: number = 30): Promise<TimeBlockTypeStat[]> => {
    const res = await fetch(`${API_BASE}/analytics/time-block-types?days=${days}`)
    if (!res.ok) throw new Error('Failed to fetch time block types')
    return res.json()
  },
}