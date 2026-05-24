import { useTimerStore } from '@/stores/timer-store'
import { Button } from '@/components/ui/button'
import { Play, Pause, RotateCcw, CheckCircle, Coffee } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Timer() {
  const {
    isRunning,
    timeLeft,
    timerType,
    pomodoroCount,
    startTimer,
    pauseTimer,
    resetTimer,
    completeTimer,
    getProgress,
    getFormattedTimeLeft,
  } = useTimerStore()

  const progress = getProgress()
  const formattedTime = getFormattedTimeLeft()
  const isFocus = timerType === 'focus'
  const isLongBreak = !isFocus && pomodoroCount % 4 === 3

  const handleStart = () => {
    startTimer()
  }

  const handleComplete = () => {
    completeTimer()
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
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
        
        {/* Progress ring */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted/20"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
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
          <Button
            size="lg"
            onClick={handleStart}
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            开始
          </Button>
        ) : (
          <Button
            size="lg"
            variant="outline"
            onClick={pauseTimer}
            className="gap-2"
          >
            <Pause className="w-4 h-4" />
            暂停
          </Button>
        )}
        
        <Button
          size="lg"
          variant="outline"
          onClick={resetTimer}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          重置
        </Button>
        
        {isRunning && (
          <Button
            size="lg"
            variant="secondary"
            onClick={handleComplete}
            className="gap-2"
          >
            {isFocus ? (
              <>
                <Coffee className="w-4 h-4" />
                休息
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                继续专注
              </>
            )}
          </Button>
        )}
      </div>

      {/* Interruption options */}
      {isRunning && (
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">被打断了？</p>
          <div className="flex gap-2">
            {['消息通知', '紧急事务', '分心了', '生理需求'].map((reason) => (
              <Button
                key={reason}
                size="sm"
                variant="ghost"
                onClick={() => useTimerStore.getState().interruptTimer(reason)}
              >
                {reason}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}