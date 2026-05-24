import { create } from 'zustand'

interface AIChatState {
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
  isTyping: boolean
  
  addMessage: (role: 'user' | 'assistant', content: string) => void
  clearMessages: () => void
  setIsTyping: (typing: boolean) => void
}

export const useAIChatStore = create<AIChatState>((set) => ({
  messages: [
    {
      id: '1',
      role: 'assistant',
      content: '早上好！我是你的时间管理助手。今天有什么计划？',
      timestamp: new Date().toISOString(),
    },
  ],
  isTyping: false,
  
  addMessage: (role, content) => set((state) => ({
    messages: [
      ...state.messages,
      {
        id: Date.now().toString(),
        role,
        content,
        timestamp: new Date().toISOString(),
      },
    ],
  })),
  clearMessages: () => set({ messages: [] }),
  setIsTyping: (typing) => set({ isTyping: typing }),
}))