import { useState } from 'react'
import { WeekView } from '@/components/calendar/WeekView'
import { TaskPanel } from '@/components/TaskPanel'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { FocusSessionPanel } from '@/components/FocusSessionPanel'
import { Calendar, TimerIcon, BarChart3, MessageSquare, ListChecks } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'calendar' | 'tasks' | 'timer' | 'analytics' | 'chat'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('calendar')

  const tabs = [
    { id: 'calendar' as Tab, label: '日历', icon: Calendar },
    { id: 'tasks' as Tab, label: '任务', icon: ListChecks },
    { id: 'timer' as Tab, label: '番茄钟', icon: TimerIcon },
    { id: 'analytics' as Tab, label: '分析', icon: BarChart3 },
    { id: 'chat' as Tab, label: 'AI', icon: MessageSquare },
  ]

  return (
    <div className="h-screen flex flex-col">
      {/* App header */}
      <header className="border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">TimeMate</h1>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            专注中 · 已连续 3 天
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="border-b border-border px-6">
        <div className="flex gap-4">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 py-2.5 px-1 text-sm font-medium border-b-2 transition-colors -mb-[1px]',
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'calendar' && <WeekView />}
        {activeTab === 'tasks' && <TaskPanel />}
        {activeTab === 'timer' && <FocusSessionPanel />}
        {activeTab === 'analytics' && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            分析仪表盘即将上线
          </div>
        )}
        {activeTab === 'chat' && <ChatPanel />}
      </main>
    </div>
  )
}

export default App
