import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { timeBlocksApi, type TimeBlockData } from '@/api/time-blocks'
import type { TimeBlock, Task } from '@/types'

interface CalendarState {
  currentDate: Date
  view: 'day' | 'week' | 'month'
  timeBlocks: TimeBlock[]
  tasks: Task[]
  
  setCurrentDate: (date: Date) => void
  setView: (view: 'day' | 'week' | 'month') => void
  addTimeBlock: (block: TimeBlock) => Promise<void>
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => Promise<void>
  removeTimeBlock: (id: string) => Promise<void>
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  removeTask: (id: string) => void
  loadTimeBlocks: (startDate?: string, endDate?: string) => Promise<void>
}

const mapApiToLocal = (api: TimeBlockData): TimeBlock => ({
  id: api.id?.toString() ?? 'temp',
  title: api.title,
  type: api.type as TimeBlock['type'],
  startTime: api.start_time,
  endTime: api.end_time,
  date: api.date,
  completed: api.completed,
})

const mapLocalToApi = (local: Omit<TimeBlock, 'id'>): Omit<TimeBlockData, 'id'> => ({
  title: local.title,
  type: local.type,
  start_time: local.startTime,
  end_time: local.endTime,
  date: local.date,
  completed: local.completed,
})

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      currentDate: new Date(),
      view: 'week',
      timeBlocks: [],
      tasks: [],
      
      setCurrentDate: (date) => set({ currentDate: date }),
      setView: (view) => set({ view }),
      
      loadTimeBlocks: async (startDate?: string, endDate?: string) => {
        try {
          const apiBlocks = await timeBlocksApi.list(startDate, endDate)
          const localBlocks = apiBlocks.map(mapApiToLocal)
          set({ timeBlocks: localBlocks })
        } catch (err) {
          console.error('Failed to load time blocks:', err)
        }
      },
      
      addTimeBlock: async (block) => {
        try {
          const apiBlock = await timeBlocksApi.create(mapLocalToApi(block))
          const newBlock = mapApiToLocal(apiBlock)
          set((state) => ({ 
            timeBlocks: [...state.timeBlocks, newBlock] 
          }))
        } catch (err) {
          console.error('Failed to create time block:', err)
          // Fallback to local only
          set((state) => ({ 
            timeBlocks: [...state.timeBlocks, block] 
          }))
        }
      },
      
      updateTimeBlock: async (id, updates) => {
        const blockId = parseInt(id)
        if (isNaN(blockId)) {
          // Local only
          set((state) => ({
            timeBlocks: state.timeBlocks.map((b) => 
              b.id === id ? { ...b, ...updates } : b
            ),
          }))
          return
        }
        
        try {
          const apiUpdates: Partial<TimeBlockData> = {}
          if (updates.title !== undefined) apiUpdates.title = updates.title
          if (updates.type !== undefined) apiUpdates.type = updates.type
          if (updates.startTime !== undefined) apiUpdates.start_time = updates.startTime
          if (updates.endTime !== undefined) apiUpdates.end_time = updates.endTime
          if (updates.completed !== undefined) apiUpdates.completed = updates.completed
          
          await timeBlocksApi.update(blockId, apiUpdates)
          set((state) => ({
            timeBlocks: state.timeBlocks.map((b) => 
              b.id === id ? { ...b, ...updates } : b
            ),
          }))
        } catch (err) {
          console.error('Failed to update time block:', err)
          set((state) => ({
            timeBlocks: state.timeBlocks.map((b) => 
              b.id === id ? { ...b, ...updates } : b
            ),
          }))
        }
      },
      
      removeTimeBlock: async (id) => {
        const blockId = parseInt(id)
        if (isNaN(blockId)) {
          set((state) => ({
            timeBlocks: state.timeBlocks.filter((b) => b.id !== id),
          }))
          return
        }
        
        try {
          await timeBlocksApi.delete(blockId)
          set((state) => ({
            timeBlocks: state.timeBlocks.filter((b) => b.id !== id),
          }))
        } catch (err) {
          console.error('Failed to delete time block:', err)
          set((state) => ({
            timeBlocks: state.timeBlocks.filter((b) => b.id !== id),
          }))
        }
      },
      
      addTask: (task) => set((state) => ({ 
        tasks: [...state.tasks, task] 
      })),
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((t) => 
          t.id === id ? { ...t, ...updates } : t
        ),
      })),
      removeTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      })),
    }),
    {
      name: 'calendar-storage',
    }
  )
)