const API_BASE = 'http://localhost:8000/api'

export interface TimeBlockData {
  id?: number
  title: string
  type: string
  start_time: string
  end_time: string
  date: string
  completed: boolean
}

export const timeBlocksApi = {
  list: async (startDate?: string, endDate?: string): Promise<TimeBlockData[]> => {
    const params = new URLSearchParams()
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    const res = await fetch(`${API_BASE}/time-blocks/?${params}`)
    if (!res.ok) throw new Error('Failed to fetch time blocks')
    return res.json()
  },

  create: async (block: Omit<TimeBlockData, 'id'>): Promise<TimeBlockData> => {
    const res = await fetch(`${API_BASE}/time-blocks/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(block),
    })
    if (!res.ok) throw new Error('Failed to create time block')
    return res.json()
  },

  update: async (id: number, updates: Partial<TimeBlockData>): Promise<TimeBlockData> => {
    const res = await fetch(`${API_BASE}/time-blocks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Failed to update time block')
    return res.json()
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/time-blocks/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete time block')
  },
}