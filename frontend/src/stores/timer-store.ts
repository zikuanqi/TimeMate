import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TimerState {
  // Timer state
  isRunning: boolean
  timeLeft: number // in seconds
  totalTime: number // in seconds
  timerType: 'focus' | 'break'
  
  // Pomodoro settings
  focusDuration: number // minutes
  shortBreakDuration: number // minutes
  longBreakDuration: number // minutes
  pomodoroCount: number
  
  // Current session
  currentTaskId?: string
  currentTimeBlockId?: string
  startTime?: string
  
  // Actions
  startTimer: (taskId?: string, timeBlockId?: string) => void
  pauseTimer: () => void
  resetTimer: () => void
  completeTimer: () => void
  interruptTimer: (reason: string) => void
  tick: () => void
  
  // Settings
  updateFocusDuration: (minutes: number) => void
  updateShortBreakDuration: (minutes: number) => void
  updateLongBreakDuration: (minutes: number) => void
  
  // Helper
  getProgress: () => number
  getFormattedTimeLeft: () => string
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      // Initial state
      isRunning: false,
      timeLeft: 25 * 60, // 25 minutes in seconds
      totalTime: 25 * 60,
      timerType: 'focus',
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      pomodoroCount: 0,
      
      // Actions
      startTimer: (taskId, timeBlockId) => {
        const { timerType, focusDuration, shortBreakDuration, longBreakDuration } = get()
        const duration = timerType === 'focus' ? focusDuration : 
          (get().pomodoroCount % 4 === 3 ? longBreakDuration : shortBreakDuration)
        
        set({
          isRunning: true,
          timeLeft: duration * 60,
          totalTime: duration * 60,
          startTime: new Date().toISOString(),
          currentTaskId: taskId,
          currentTimeBlockId: timeBlockId,
        })
      },
      
      pauseTimer: () => {
        set({ isRunning: false })
      },
      
      resetTimer: () => {
        const { timerType, focusDuration, shortBreakDuration, longBreakDuration } = get()
        const duration = timerType === 'focus' ? focusDuration : 
          (get().pomodoroCount % 4 === 3 ? longBreakDuration : shortBreakDuration)
        
        set({
          isRunning: false,
          timeLeft: duration * 60,
          totalTime: duration * 60,
          startTime: undefined,
        })
      },
      
      completeTimer: () => {
        const { timerType, pomodoroCount } = get()
        
        if (timerType === 'focus') {
          set({
            timerType: 'break',
            pomodoroCount: pomodoroCount + 1,
          })
        } else {
          set({
            timerType: 'focus',
          })
        }
        
        get().resetTimer()
      },
      
      interruptTimer: (reason) => {
        // This would be connected to API to log the interruption
        console.log('Timer interrupted:', reason)
        get().pauseTimer()
      },
      
      tick: () => {
        set((state) => ({
          timeLeft: Math.max(0, state.timeLeft - 1),
        }))
      },
      
      // Settings
      updateFocusDuration: (minutes) => {
        set({ focusDuration: minutes })
        if (get().timerType === 'focus') {
          get().resetTimer()
        }
      },
      
      updateShortBreakDuration: (minutes) => {
        set({ shortBreakDuration: minutes })
        if (get().timerType === 'break' && get().pomodoroCount % 4 !== 3) {
          get().resetTimer()
        }
      },
      
      updateLongBreakDuration: (minutes) => {
        set({ longBreakDuration: minutes })
        if (get().timerType === 'break' && get().pomodoroCount % 4 === 3) {
          get().resetTimer()
        }
      },
      
      // Helpers
      getProgress: () => {
        const { timeLeft, totalTime } = get()
        return ((totalTime - timeLeft) / totalTime) * 100
      },
      
      getFormattedTimeLeft: () => {
        const { timeLeft } = get()
        const mins = Math.floor(timeLeft / 60)
        const secs = timeLeft % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      },
    }),
    {
      name: 'timer-storage',
      partialize: (state) => ({
        focusDuration: state.focusDuration,
        shortBreakDuration: state.shortBreakDuration,
        longBreakDuration: state.longBreakDuration,
        pomodoroCount: state.pomodoroCount,
      }),
    }
  )
)