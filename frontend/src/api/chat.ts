const API_BASE = 'http://localhost:8000/api'

export interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
}

export interface ChatMessage {
  id?: number
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  session_id: string
}

export const chatApi = {
  createSession: async (title: string = '新对话'): Promise<{ session_id: string; title: string; created_at: string }> => {
    const res = await fetch(`${API_BASE}/chat/sessions?title=${encodeURIComponent(title)}`, { method: 'POST' })
    if (!res.ok) throw new Error('Failed to create session')
    return res.json()
  },

  listSessions: async (limit: number = 20, offset: number = 0): Promise<ChatSession[]> => {
    const res = await fetch(`${API_BASE}/chat/sessions?limit=${limit}&offset=${offset}`)
    if (!res.ok) throw new Error('Failed to list sessions')
    return res.json()
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete session')
  },

  addMessage: async (sessionId: string, role: 'user' | 'assistant', content: string) => {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, content, session_id: sessionId, timestamp: new Date().toISOString() }),
    })
    if (!res.ok) throw new Error('Failed to add message')
    return res.json()
  },

  getMessages: async (sessionId: string, limit: number = 50): Promise<ChatMessage[]> => {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages?limit=${limit}`)
    if (!res.ok) throw new Error('Failed to get messages')
    return res.json()
  },

  updateTitle: async (sessionId: string, title: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/title?title=${encodeURIComponent(title)}`, { method: 'PUT' })
    if (!res.ok) throw new Error('Failed to update title')
  },
}