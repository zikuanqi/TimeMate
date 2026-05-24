import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { TimeBlock } from '@/types'

interface TimeBlockDialogProps {
  date: string
  startHour: number
  endHour?: number
  onSave: (block: Omit<TimeBlock, 'id' | 'completed'>) => void
  onClose: () => void
}

const BLOCK_TYPES = [
  { value: 'deep_work', label: '深度工作', color: 'bg-blue-500' },
  { value: 'meeting', label: '会议', color: 'bg-purple-500' },
  { value: 'client', label: '客户沟通', color: 'bg-orange-500' },
  { value: 'learning', label: '学习', color: 'bg-green-500' },
  { value: 'break', label: '休息', color: 'bg-gray-500' },
  { value: 'misc', label: '杂事', color: 'bg-yellow-500' },
] as const

export function TimeBlockDialog({ date, startHour, endHour, onSave, onClose }: TimeBlockDialogProps) {
  const endH = endHour ?? startHour + 1
  const [title, setTitle] = useState('')
  const [type, setType] = useState<TimeBlock['type']>('deep_work')

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      type,
      startTime: new Date(`${date}T${String(startHour).padStart(2, '0')}:00:00`).toISOString(),
      endTime: new Date(`${date}T${String(endH).padStart(2, '0')}:00:00`).toISOString(),
      date,
    })
  }

  const timeLabel = endHour
    ? `${startHour}:00 - ${endH}:00`
    : `${startHour}:00 - ${endH}:00`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-background rounded-lg shadow-xl p-6 w-96 max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-1">添加时间块</h3>
        <p className="text-sm text-muted-foreground mb-4">{date} {timeLabel}</p>

        {/* Title */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：代码重构"
            className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>

        {/* Type selector */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">类型</label>
          <div className="grid grid-cols-3 gap-2">
            {BLOCK_TYPES.map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => setType(value)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs border transition-colors ${
                  type === value
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${color}`} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!title.trim()}>
            添加
          </Button>
        </div>
      </div>
    </div>
  )
}