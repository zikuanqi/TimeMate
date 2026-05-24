import { useState, useEffect, useRef } from 'react'
import { useAIChatStore } from '@/stores/ai-chat-store'
import { chatApi, type ChatSession } from '@/api/chat'
import { Button } from '@/components/ui/button'
import { Send, Sparkles, Plus, Trash2, MessageSquare, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const AI_API = 'http://localhost:8000/api/ai/chat'

interface AIAction {
  action_type: string
  params: Record<string, unknown>
  response_text: string
}

export function ChatPanel() {
  const { messages, isTyping, addMessage, setIsTyping, setMessages } = useAIChatStore()
  const [input, setInput] = useState('')
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadSessions() }, [])
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSessions = async () => {
    try {
      const list = await chatApi.listSessions()
      setSessions(list)
    } catch (e) {
      console.error('Failed to load sessions:', e)
    }
  }

  const createNewSession = async () => {
    try {
      const { session_id } = await chatApi.createSession()
      setActiveSessionId(session_id)
      setMessages([])
      await loadSessions()
    } catch (e) {
      console.error('Failed to create session:', e)
    }
  }

  const switchSession = async (sessionId: string) => {
    try {
      const msgs = await chatApi.getMessages(sessionId)
      setActiveSessionId(sessionId)
      setMessages(msgs.map(m => ({
        id: String(m.id || Date.now()),
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.timestamp,
      })))
    } catch (e) {
      console.error('Failed to switch session:', e)
    }
  }

  const deleteSession = async (sessionId: string) => {
    try {
      await chatApi.deleteSession(sessionId)
      if (activeSessionId === sessionId) {
        setActiveSessionId(null)
        setMessages([])
      }
      await loadSessions()
    } catch (e) {
      console.error('Failed to delete session:', e)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    let sessionId = activeSessionId
    if (!sessionId) {
      try {
        const { session_id } = await chatApi.createSession()
        sessionId = session_id
        setActiveSessionId(session_id)
        await loadSessions()
      } catch (e) {
        console.error('Failed to create session:', e)
        return
      }
    }

    const userContent = input.trim()
    addMessage('user', userContent)
    setInput('')

    // Save user message to backend
    chatApi.addMessage(sessionId, 'user', userContent).catch(console.error)

    setIsTyping(true)
    try {
      const aiMessages = messages.concat({ id: '', role: 'user' as const, content: userContent, timestamp: '' })
      const res = await fetch(AI_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          messages: aiMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const responseText = data.response || '收到！有什么我可以帮你的吗？'
        addMessage('assistant', responseText)
        chatApi.addMessage(sessionId!, 'assistant', responseText).catch(console.error)

        // Execute actions if any
        const actions: AIAction[] = data.actions || []
        for (const action of actions) {
          await executeAction(action)
        }
      } else {
        // Fallback
        const fallback = '收到！有什么我可以帮你的吗？（AI 服务暂不可用）'
        addMessage('assistant', fallback)
        chatApi.addMessage(sessionId!, 'assistant', fallback).catch(console.error)
      }
    } catch {
      const fallback = '收到！有什么我可以帮你的吗？（网络错误）'
      addMessage('assistant', fallback)
      chatApi.addMessage(sessionId!, 'assistant', fallback).catch(console.error)
    } finally {
      setIsTyping(false)
      loadSessions()
    }
  }

  const executeAction = async (action: AIAction) => {
    const base = 'http://localhost:8000/api'
    try {
      switch (action.action_type) {
        case 'create_task':
          await fetch(`${base}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: action.params.title || '未命名任务',
              priority: action.params.priority || 2,
              tags: action.params.tags || '',
              status: 'todo',
            }),
          })
          break
        case 'create_time_block':
          await fetch(`${base}/time-blocks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: action.params.title,
              start_time: action.params.start_time,
              end_time: action.params.end_time,
              date: action.params.date || new Date().toISOString().slice(0, 10),
              type: action.params.type || 'work',
            }),
          })
          break
        default:
          console.log('Unhandled action type:', action.action_type)
      }
    } catch (e) {
      console.error('Failed to execute action:', action.action_type, e)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className={cn(
        'border-r border-border flex flex-col transition-all duration-200',
        showSidebar ? 'w-60' : 'w-0 overflow-hidden'
      )}>
        <div className="p-3 border-b border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={createNewSession}
          >
            <Plus className="w-4 h-4" />
            新对话
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => switchSession(s.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 cursor-pointer group hover:bg-muted/50 transition-colors',
                activeSessionId === s.id && 'bg-muted'
              )}
            >
              <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm truncate flex-1">{s.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteSession(s.id) }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">暂无对话</p>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform', !showSidebar && 'rotate-180')} />
          </button>
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-semibold">AI 助手</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              开始新对话，让 AI 帮你管理时间
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-4 py-2 text-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2 text-sm">
                <span className="animate-pulse">...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="告诉 AI 添加任务或调整计划..."
              className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="sm" onClick={handleSend}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}