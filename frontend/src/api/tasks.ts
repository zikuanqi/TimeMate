const API_BASE = 'http://localhost:8000/api'

export interface TaskData {
  id?: number
  title: string
  description: string
  priority: number
  status: 'todo' | 'in_progress' | 'done'
  due_date: string | null
  estimated_minutes: number
  tags: string
  created_at?: string
}

export const tasksApi = {
  list: async (params: {
    status?: string
    priority?: number
    tag?: string
    due_before?: string
  } = {}): Promise<TaskData[]> => {
    const search = new URLSearchParams()
    if (params.status) search.set('status', params.status)
    if (params.priority !== undefined) search.set('priority', String(params.priority))
    if (params.tag) search.set('tag', params.tag)
    if (params.due_before) search.set('due_before', params.due_before)
    const res = await fetch(`${API_BASE}/tasks/?${search}`)
    if (!res.ok) throw new Error('Failed to fetch tasks')
    return res.json()
  },

  create: async (task: Omit<TaskData, 'id' | 'created_at'>): Promise<TaskData> => {
    const res = await fetch(`${API_BASE}/tasks/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    })
    if (!res.ok) throw new Error('Failed to create task')
    return res.json()
  },

  update: async (id: number, updates: Partial<TaskData>): Promise<TaskData> => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Failed to update task')
    return res.json()
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete task')
  },

  batchUpdateStatus: async (ids: number[], status: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/tasks/batch/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_ids: ids, status }),
    })
    if (!res.ok) throw new Error('Failed to batch update')
  },
}