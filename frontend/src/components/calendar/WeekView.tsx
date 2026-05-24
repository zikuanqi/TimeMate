import { useState, useRef, useCallback, useEffect } from 'react'
import { useCalendarStore } from '@/stores/calendar-store'
import { format, addDays, startOfWeek, isSameDay, isToday, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TimeBlockDialog } from './TimeBlockDialog'
import type { TimeBlock } from '@/types'

const TIME_LABELS = Array.from({ length: 24 }, (_, i) => 
  `${i.toString().padStart(2, '0')}:00`
)

const BLOCK_COLORS: Record<TimeBlock['type'], string> = {
  deep_work: 'bg-blue-100 border-blue-300 text-blue-800',
  meeting: 'bg-purple-100 border-purple-300 text-purple-800',
  client: 'bg-orange-100 border-orange-300 text-orange-800',
  learning: 'bg-green-100 border-green-300 text-green-800',
  break: 'bg-gray-100 border-gray-300 text-gray-600',
  misc: 'bg-yellow-100 border-yellow-300 text-yellow-800',
}

function getBlockStyle(block: TimeBlock, dayIndex: number, dayDate: Date) {
  const start = parseISO(block.startTime)
  const end = parseISO(block.endTime)
  const startHour = start.getHours() + start.getMinutes() / 60
  const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  
  const left = `${4 + dayIndex * 1}rem`
  const top = startHour * 56 // 56px per hour row

  return {
    left: `calc(4rem + ${dayIndex} * (100% / 8))`,
    width: `calc(100% / 8 - 4px)`,
    top: `${(startHour * 56)}px`,
    height: `${Math.max(duration * 56, 20)}px`,
  }
}

export function WeekView() {
  const { currentDate, setCurrentDate, timeBlocks, addTimeBlock, updateTimeBlock, removeTimeBlock, loadTimeBlocks } = useCalendarStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogDate, setDialogDate] = useState('')
  const [dialogStartHour, setDialogStartHour] = useState(0)
  const [dialogEndHour, setDialogEndHour] = useState<number | undefined>()
  const [dragState, setDragState] = useState<{ date: string; startHour: number; endHour: number } | null>(null)
  const dragDateRef = useRef('')
  const dragStartRef = useRef(0)
  
  const weekStart = startOfWeek(currentDate, { locale: zhCN })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  
  // Load blocks from backend when week changes
  useEffect(() => {
    const startDate = format(weekStart, 'yyyy-MM-dd')
    const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd')
    loadTimeBlocks(startDate, endDate)
  }, [weekStart.toISOString()])
  
  const getBlocksForDay = (day: Date) => 
    timeBlocks.filter((b) => isSameDay(parseISO(b.startTime), day))

  const goNext = () => setCurrentDate(addDays(currentDate, 7))
  const goPrev = () => setCurrentDate(addDays(currentDate, -7))
  const goToday = () => setCurrentDate(new Date())

  const handleCellClick = (date: string, hour: number) => {
    setDialogDate(date)
    setDialogStartHour(hour)
    setDialogEndHour(undefined)
    setDialogOpen(true)
  }

  const handleCellMouseDown = (date: string, hour: number) => {
    dragDateRef.current = date
    dragStartRef.current = hour
    setDragState({ date, startHour: hour, endHour: hour + 0.5 })
  }

  const handleCellMouseEnter = (date: string, hour: number) => {
    if (dragState && date === dragState.date) {
      setDragState((prev) => prev ? {
        ...prev,
        endHour: Math.max(hour + 0.5, dragStartRef.current + 0.5),
      } : null)
    }
  }

  const handleCellMouseUp = useCallback(() => {
    if (dragState) {
      const startH = Math.min(dragState.startHour, dragState.endHour)
      const endH = Math.max(dragState.startHour, dragState.endHour)
      setDialogDate(dragState.date)
      setDialogStartHour(Math.floor(startH))
      setDialogEndHour(Math.ceil(endH))
      setDialogOpen(true)
      setDragState(null)
    }
  }, [dragState])

  const handleSaveBlock = (block: Omit<TimeBlock, 'id' | 'completed'>) => {
    const newBlock: TimeBlock = {
      ...block,
      id: Date.now().toString(),
      completed: false,
    }
    addTimeBlock(newBlock)
    setDialogOpen(false)
  }

  const handleRemoveBlock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeTimeBlock(id)
  }

  const handleBlockClick = (block: TimeBlock) => {
    updateTimeBlock(block.id, { completed: !block.completed })
  }

  const dateStr = (d: Date) => format(d, 'yyyy-MM-dd')

  return (
    <div 
      className="flex flex-col h-full select-none"
      onMouseUp={handleCellMouseUp}
      onMouseLeave={() => setDragState(null)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goPrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-lg font-semibold min-w-[120px] text-center">
            {format(weekStart, 'yyyy年M月', { locale: zhCN })}
          </span>
          <Button variant="ghost" size="icon" onClick={goNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>今天</Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <div className="relative min-w-[800px]" style={{ height: `${24 * 56 + 56}px` }}>
          {/* Day headers - sticky */}
          <div className="sticky top-0 z-20 bg-background grid grid-cols-[4rem_repeat(7,1fr)] border-b border-border">
            <div className="border-r border-border" />
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  'py-2 text-center border-r border-border',
                  isToday(day) && 'bg-primary/5'
                )}
              >
                <div className="text-xs text-muted-foreground">
                  {format(day, 'EEE', { locale: zhCN })}
                </div>
                <div
                  className={cn(
                    'text-lg font-medium',
                    isToday(day) && 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto'
                  )}
                >
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time rows and cells */}
          <div className="relative">
            {TIME_LABELS.map((time, hour) => (
              <div key={time} className="grid grid-cols-[4rem_repeat(7,1fr)]" style={{ height: '56px' }}>
                <div className="text-xs text-muted-foreground text-right pr-2 pt-0.5 border-r border-border">
                  {time}
                </div>
                {days.map((day, di) => (
                  <div
                    key={`${day.toISOString()}-${time}`}
                    className={cn(
                      'border-b border-r border-border cursor-pointer hover:bg-accent/40 transition-colors',
                      isToday(day) && 'bg-primary/[0.02]'
                    )}
                    onClick={() => handleCellClick(dateStr(day), hour)}
                    onMouseDown={() => handleCellMouseDown(dateStr(day), hour)}
                    onMouseEnter={() => handleCellMouseEnter(dateStr(day), hour)}
                  />
                ))}
              </div>
            ))}

            {/* Drag preview */}
            {dragState && (
              <div
                className="absolute bg-primary/20 border border-primary rounded pointer-events-none z-10"
                style={{
                  left: `calc(4rem + ${days.findIndex(d => dateStr(d) === dragState.date)} * (100% - 4rem) / 8)`,
                  width: `calc((100% - 4rem) / 8 - 4px)`,
                  top: `${Math.min(dragState.startHour, dragState.endHour) * 56}px`,
                  height: `${Math.abs(dragState.endHour - dragState.startHour) * 56}px`,
                }}
              />
            )}

            {/* Time blocks */}
            {timeBlocks.map((block) => {
              const start = parseISO(block.startTime)
              const end = parseISO(block.endTime)
              const dayIndex = days.findIndex(d => isSameDay(d, start))
              if (dayIndex === -1) return null
              
              const startHour = start.getHours() + start.getMinutes() / 60
              const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

              return (
                <div
                  key={block.id}
                  className={cn(
                    'absolute rounded-md border-l-2 px-2 py-1 text-xs overflow-hidden cursor-pointer z-10 shadow-sm transition-all hover:shadow-md group',
                    BLOCK_COLORS[block.type],
                    block.completed && 'opacity-50 line-through'
                  )}
                  style={{
                    left: `calc(4rem + ${dayIndex} * (100% - 4rem) / 8)`,
                    width: `calc((100% - 4rem) / 8 - 4px)`,
                    top: `${startHour * 56 + 1}px`,
                    height: `${Math.max(duration * 56 - 2, 18)}px`,
                  }}
                  onClick={() => handleBlockClick(block)}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-medium truncate flex-1">{block.title}</span>
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1"
                      onClick={(e) => handleRemoveBlock(block.id, e)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[10px] opacity-70">
                    {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Dialog */}
      {dialogOpen && (
        <TimeBlockDialog
          date={dialogDate}
          startHour={dialogStartHour}
          endHour={dialogEndHour}
          onSave={handleSaveBlock}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  )
}