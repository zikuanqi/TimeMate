import { useEffect, useRef, useCallback } from 'react'
import { useTimerStore } from '@/stores/timer-store'
import { Button } from '@/components/ui/button'
import { Play, Pause, RotateCcw, Coffee, CheckCircle, Settings, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { focusSessionsApi, DailyStats } from '@/api/focus-sessions'
import { useState } from 'react'

function formatSeconds(total: number): string {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function FocusSessionPanel() {
  const {
    isRunning,
    timerType,
    pomodoroCount,
    startTimer,
    pauseTimer,
    resetTimer,
    completeTimer,
    getProgress,
    getFormattedTimeLeft,
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
    updateFocusDuration,
    updateShortBreakDuration,
    updateLongBreakDuration,
  } = useTimerStore()

  const sessionIdRef = useRef<number | null>(null)
  const startTimeRef = useRef<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null)
  const [sessionHistory, setSessionHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const progress = getProgress()
  const formattedTime = getFormattedTimeLeft()
  const isFocus = timerType === 'focus'
  const isLongBreak = !isFocus && pomodoroCount % 4 === 3

  // Countdown tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const store = useTimerStore.getState()
        if (store.timeLeft <= 1) {
          handleTimerEnd()
        } else {
          store.tick()
        }
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  // Load daily stats on mount
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    focusSessionsApi.getDailyStats(today).then(setDailyStats).catch(() => {})
  }, [])

  const handleTimerEnd = useCallback(async () => {
    const store = useTimerStore.getState()
    store.pauseTimer()

    if (sessionIdRef.current) {
      try {
        await focusSessionsApi.update(sessionIdRef.current, {
          end_time: new Date().toISOString(),
          actual_duration: store.totalTime,
          completed: true,
        })
      } catch {}
    }

    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAf39/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f3+Af39/gH9/f4B/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/fw==')
    audio.play().catch(() => {})

    if (store.timerType === 'focus') {
      useTimerStore.setState({
        timerType: 'break',
        pomodoroCount: store.pomodoroCount + 1,
      })
    } else {
      useTimerStore.setState({ timerType: 'focus' })
    }
    store.resetTimer()
    sessionIdRef.current = null
  }, [])

  const handleStart = async () => {
    const startTime = new Date().toISOString()
    startTimeRef.current = startTime

    const duration = isFocus ? focusDuration
      : (pomodoroCount % 4 === 3 ? longBreakDuration : shortBreakDuration)

    try {
      const session = await focusSessionsApi.create({
        planned_duration: duration * 60,
        start_time: startTime,
      })
      sessionIdRef.current = session.id!
    } catch {}

    startTimer()
  }

  const handlePause = () => {
    pauseTimer()
  }

  const handleReset = () => {
    resetTimer()
    sessionIdRef.current = null
  }

  const handleComplete = async () => {
    if (sessionIdRef.current) {
      try {
        await focusSessionsApi.update(sessionIdRef.current, {
          end_time: new Date().toISOString(),
          completed: true,
        })
      } catch {}
    }
    completeTimer()
    sessionIdRef.current = null

    // Refresh stats & history
    const today = new Date().toISOString().slice(0, 10)
    focusSessionsApi.getDailyStats(today).then(setDailyStats).catch(() => {})
  }

  const handleInterrupt = async (reason: string) => {
    pauseTimer()
    if (sessionIdRef.current) {
      try {
        await focusSessionsApi.addInterruption(sessionIdRef.current, { reason })
      } catch {}
    }
  }

  const loadHistory = async () => {
    setShowHistory(!showHistory)
    if (!showHistory) {
      try {
        const sessions = await focusSessionsApi.list({ limit: 20 })
        setSessionHistory(sessions)
      } catch {}
    }
  }

  return (
    <div className="flex h-full">
      {/* Main timer area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
        {/* Timer circle */}
        <div className="relative w-64 h-64">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold tabular-nums">{formattedTime}</div>
              <div className="mt-2 text-lg font-medium">
                {isFocus ? '专注时间' : isLongBreak ? '长休息' : '短休息'}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                第 {pomodoroCount + 1} 个番茄钟
              </div>
            </div>
          </div>
          
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="128" cy="128" r="120"
              stroke="currentColor" strokeWidth="8" fill="none"
              className="text-muted/20"
            />
            <circle
              cx="128" cy="128" r="120"
              stroke="currentColor" strokeWidth="8" fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
              className={cn(
                'transition-all duration-1000',
                isFocus ? 'text-primary' : 'text-green-500'
              )}
            />
          </svg>
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-3">
          {!isRunning ? (
            <Button size="lg" onClick={handleStart} className="gap-2">
              <Play className="w-4 h-4" /> 开始
            </Button>
          ) : (
            <>
              <Button size="lg" variant="outline" onClick={handlePause} className="gap-2">
                <Pause className="w-4 h-4" /> 暂停
              </Button>
              <Button size="lg" variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="w-4 h-4" /> 重置
              </Button>
              <Button size="lg" variant="secondary" onClick={handleComplete} className="gap-2">
                {isFocus ? <><Coffee className="w-4 h-4" /> 休息</> : <><CheckCircle className="w-4 h-4" /> 继续</>}
              </Button>
            </>
          )}
        </div>

        {/* Interruption buttons */}
        {isRunning && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">被打断了？</p>
            <div className="flex gap-2">
              {['消息通知', '紧急事务', '分心了', '生理需求'].map((reason) => (
                <Button key={reason} size="sm" variant="ghost" onClick={() => handleInterrupt(reason)}>
                  {reason}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Today's stats summary */}
        {dailyStats && (
          <div className="pt-4 border-t border-border w-full max-w-sm">
            <div className="flex gap-4 justify-center text-sm text-muted-foreground">
              <span>专注 {formatSeconds(dailyStats.total_focus_seconds)}</span>
              <span>{dailyStats.completed_sessions} / {dailyStats.total_sessions} 次</span>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar: Settings & History */}
      <div className="w-72 border-l border-border p-4 space-y-4 overflow-y-auto">
        {/* Settings toggle */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 text-sm font-medium w-full text-left"
        >
          <Settings className="w-4 h-4" />
          番茄钟设置
        </button>

        {showSettings && (
          <div className="space-y-3 pl-6">
            <label className="flex items-center justify-between text-sm">
              专注时长 (分)
              <input
                type="number"
                value={focusDuration}
                min={5} max={120}
                onChange={(e) => updateFocusDuration(Number(e.target.value))}
                className="w-16 px-2 py-1 border border-border rounded bg-background text-sm"
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              短休息 (分)
              <input
                type="number"
                value={shortBreakDuration}
                min={1} max={30}
                onChange={(e) => updateShortBreakDuration(Number(e.target.value))}
                className="w-16 px-2 py-1 border border-border rounded bg-background text-sm"
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              长休息 (分)
              <input
                type="number"
                value={longBreakDuration}
                min={5} max={60}
                onChange={(e) => updateLongBreakDuration(Number(e.target.value))}
                className="w-16 px-2 py-1 border border-border rounded bg-background text-sm"
              />
            </label>
          </div>
        )}

        {/* History toggle */}
        <button
          onClick={loadHistory}
          className="flex items-center gap-2 text-sm font-medium w-full text-left"
        >
          <BarChart3 className="w-4 h-4" />
          专注记录
        </button>

        {showHistory && (
          <div className="space-y-2">
            {sessionHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground pl-6">暂无记录</p>
            ) : (
              sessionHistory.map((s: any) => (
                <div key={s.id} className="pl-6 py-1 border-b border-border/50">
                  <div className="flex justify-between text-sm">
                    <span className={s.completed ? 'text-green-600' : 'text-muted-foreground'}>
                      {s.completed ? '完成' : '未完成'}
                    </span>
                    <span className="text-muted-foreground">
                      {s.actual_duration ? formatSeconds(s.actual_duration) : `${s.planned_duration / 60}m 计划`}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(s.start_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    {s.interruptions?.length > 0 && ` · ${s.interruptions.length} 次中断`}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}