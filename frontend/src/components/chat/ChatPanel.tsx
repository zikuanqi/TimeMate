import { useState } from 'react'
import { useAIChatStore } from '@/stores/ai-chat-store'
import { Button } from '@/components/ui/button'
import { Send, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ChatPanel() {
  const { messages, isTyping, addMessage, setIsTyping } = useAIChatStore()
  const [input, setInput] = useState('')

  const handleSend = async () => {
    if (!input.trim()) return
    
    addMessage('user', input.trim())
    setInput('')
    
    // Simulate AI response for now
    setIsTyping(true)
    setTimeout(() => {
      addMessage(
        'assistant',
        '好的，我已记录！你可以继续调整计划。'
      )
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Sparkles className="w-5 h-5 text-primary" />
        <span className="font-semibold">AI 助手</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
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
  )
}