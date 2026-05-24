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
  setMessages: (messages: AIChatState['messages']) => void
  clearMessages: () => void
  setIsTyping: (typing: boolean) => void
}

export const useAIChatStore = create<AIChatState>((set) => ({
  messages: [],
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
  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [] }),
  setIsTyping: (typing) => set({ isTyping: typing }),
}))