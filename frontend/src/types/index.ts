// Core data models for AI TimeMate

export interface Task {
  id: string
  title: string
  description?: string
  priority: number  // 0=low, 1=medium, 2=high, 3=urgent
  estimatedMinutes: number
  actualMinutes?: number
  status: 'todo' | 'in_progress' | 'done'
  projectId?: string
  dueDate?: string | null
  tags?: string
  createdAt?: string
}

export interface TimeBlock {
  id: string
  taskId?: string
  title: string
  type: 'deep_work' | 'meeting' | 'client' | 'learning' | 'break' | 'misc'
  startTime: string
  endTime: string
  completed: boolean
  date: string
  externalEventId?: string
  notes?: string
}

export interface FocusSession {
  id: string
  timeBlockId?: string
  taskId?: string
  startTime: string
  endTime?: string
  plannedDuration: number // seconds
  actualDuration?: number // seconds
  interruptions: Interruption[]
  completed: boolean
}

export interface Interruption {
  id: string
  sessionId: string
  time: string
  reason: InterruptionReason
  note?: string
}

export type InterruptionReason =
  | 'notification'
  | 'urgent_matter'
  | 'distraction'
  | 'physical_need'
  | 'other'

export interface CalendarEvent {
  id: string
  externalId: string
  source: 'google' | 'outlook'
  title: string
  startTime: string
  endTime: string
  location?: string
  link?: string
}

export interface DailySummary {
  date: string
  totalFocusMinutes: number
  completedTimeBlocks: number
  totalTimeBlocks: number
  interruptions: number
  topInterruptionReason: InterruptionReason | null
  tasksCompleted: number
}

export interface WeeklyReport {
  startDate: string
  endDate: string
  totalFocusHours: number
  completionRate: number
  mostProductiveHour: number
  dailyBreakdown: DailySummary[]
  projectDistribution: Record<string, number>
}

export interface AICheckIn {
  id: string
  date: string
  type: 'morning' | 'evening'
  message: string
  plan?: TimeBlock[]
  reflection?: string
}