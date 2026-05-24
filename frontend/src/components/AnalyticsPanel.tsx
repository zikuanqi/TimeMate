import { useEffect, useState } from 'react'
import { Clock, CheckCircle2, Zap, AlertTriangle, Target, BarChart3 } from 'lucide-react'
import { analyticsApi, type OverviewData, type DailyFocus, type ProductiveHour, type TaskDistribution, type TimeBlockTypeStat } from '@/api/analytics'

function formatMinutes(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  return `${m}m`
}

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-start gap-3">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function DailyFocusChart({ data }: { data: DailyFocus[] }) {
  if (!data.length) return <p className="text-muted-foreground text-sm text-center py-8">暂无每日专注数据</p>

  const maxSeconds = Math.max(...data.map(d => d.total_seconds), 1)
  const barWidth = Math.max(8, Math.floor(100 / data.length) - 2)

  return (
    <div className="w-full">
      <div className="flex items-end gap-1 h-32 px-1">
        {data.map((d, i) => {
          const heightPct = (d.total_seconds / maxSeconds) * 100
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1" style={{ minWidth: barWidth }}>
              <span className="text-[10px] text-muted-foreground">
                {d.total_seconds > 0 ? formatMinutes(d.total_seconds) : ''}
              </span>
              <div
                className="w-full bg-primary/60 hover:bg-primary rounded-t transition-colors"
                style={{ height: `${Math.max(heightPct, 2)}%` }}
                title={`${d.date}: ${formatMinutes(d.total_seconds)}`}
              />
              <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                {d.date.slice(5)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProductiveHoursBars({ data }: { data: ProductiveHour[] }) {
  if (!data.length) return <p className="text-muted-foreground text-sm text-center py-8">暂无专注时段数据</p>

  const maxSeconds = Math.max(...data.map(d => d.total_seconds), 1)

  return (
    <div className="flex items-end gap-1 h-24">
      {Array.from({ length: 24 }, (_, hour) => {
        const hit = data.find(d => d.hour === hour)
        const seconds = hit?.total_seconds ?? 0
        const heightPct = seconds > 0 ? (seconds / maxSeconds) * 100 : 0
        return (
          <div key={hour} className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-muted-foreground">
              {seconds > 0 ? `${Math.round(seconds / 60)}m` : ''}
            </span>
            <div
              className={`w-full rounded-t transition-colors ${heightPct > 0 ? 'bg-green-500/70' : 'bg-muted'}`}
              style={{ height: `${Math.max(heightPct, 2)}%` }}
              title={`${hour}:00 - ${formatMinutes(seconds)}`}
            />
            <span className="text-[9px] text-muted-foreground">{hour}h</span>
          </div>
        )
      })}
    </div>
  )
}

function TaskDistributionDisplay({ dist }: { dist: TaskDistribution }) {
  if (!dist.by_status.length && !dist.by_priority.length) {
    return <p className="text-muted-foreground text-sm text-center py-8">暂无任务数据</p>
  }

  const total = dist.by_status.reduce((s, i) => s + i.count, 0)
  const priorityLabels: Record<number, string> = { 1: '低', 2: '中', 3: '高', 4: '紧急' }
  const priorityColors: Record<number, string> = {
    1: 'bg-slate-400', 2: 'bg-blue-500', 3: 'bg-orange-500', 4: 'bg-red-500',
  }
  const statusColors: Record<string, string> = {
    todo: 'bg-slate-400', in_progress: 'bg-blue-500', done: 'bg-green-500', cancelled: 'bg-neutral-500',
  }
  const statusLabels: Record<string, string> = {
    todo: '待办', in_progress: '进行中', done: '已完成', cancelled: '已取消',
  }

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">任务状态分布</p>
        <div className="flex h-5 rounded-full overflow-hidden bg-muted">
          {dist.by_status.map(s => (
            <div
              key={s.status}
              className={`${statusColors[s.status] || 'bg-slate-400'} transition-all`}
              style={{ width: `${total > 0 ? (s.count / total) * 100 : 0}%` }}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-1.5">
          {dist.by_status.map(s => (
            <span key={s.status} className="text-xs text-muted-foreground flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${statusColors[s.status] || 'bg-slate-400'}`} />
              {statusLabels[s.status] || s.status} {s.count}
            </span>
          ))}
        </div>
      </div>

      {/* Priority bar */}
      {dist.by_priority.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">优先级分布</p>
          <div className="flex h-5 rounded-full overflow-hidden bg-muted">
            {dist.by_priority.sort((a, b) => a.priority - b.priority).map(p => (
              <div
                key={p.priority}
                className={`${priorityColors[p.priority] || 'bg-slate-400'} transition-all`}
                style={{ width: `${total > 0 ? (p.count / total) * 100 : 0}%` }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-1.5">
            {dist.by_priority.sort((a, b) => a.priority - b.priority).map(p => (
              <span key={p.priority} className="text-xs text-muted-foreground flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${priorityColors[p.priority] || 'bg-slate-400'}`} />
                {priorityLabels[p.priority] || `P${p.priority}`} · {p.count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function InterruptionReasons({ reasons }: { reasons: { reason: string; count: number }[] }) {
  if (!reasons.length) return <p className="text-muted-foreground text-sm text-center py-8">本周无中断记录</p>

  const total = reasons.reduce((s, r) => s + r.count, 0)
  return (
    <div className="space-y-2">
      {reasons.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${total > 0 ? (r.count / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-20 truncate text-right">{r.reason}</span>
          <span className="text-xs font-mono text-muted-foreground w-6 text-right">{r.count}</span>
        </div>
      ))}
    </div>
  )
}

export function AnalyticsPanel() {
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [dailyFocus, setDailyFocus] = useState<DailyFocus[]>([])
  const [taskDist, setTaskDist] = useState<TaskDistribution | null>(null)
  const [prodHours, setProdHours] = useState<ProductiveHour[]>([])
  const [blockTypes, setBlockTypes] = useState<TimeBlockTypeStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [ov, df, td, ph, bt] = await Promise.all([
          analyticsApi.getOverview(),
          analyticsApi.getDailyFocus(14),
          analyticsApi.getTaskDistribution(),
          analyticsApi.getProductiveHours(30),
          analyticsApi.getTimeBlockTypes(30),
        ])
        setOverview(ov)
        setDailyFocus(df)
        setTaskDist(td)
        setProdHours(ph)
        setBlockTypes(bt)
      } catch (e) {
        console.error('Failed to load analytics:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Clock}
            label="今日专注"
            value={formatMinutes(overview?.today.focus_seconds ?? 0)}
            sub={`${overview?.today.focus_completed ?? 0}/${overview?.today.focus_sessions ?? 0} 次完成`}
          />
          <StatCard
            icon={CheckCircle2}
            label="今日任务"
            value={`${overview?.today.tasks_done ?? 0}`}
            sub={`共 ${overview?.today.tasks_total ?? 0} 个任务`}
          />
          <StatCard
            icon={Target}
            label="周专注"
            value={formatMinutes(overview?.week.focus_seconds ?? 0)}
            sub={`${overview?.week.focus_sessions ?? 0} 个番茄钟`}
          />
          <StatCard
            icon={AlertTriangle}
            label="中断次数"
            value={`${overview?.week.interruption_daily?.reduce((s, d) => s + d.count, 0) ?? 0}`}
            sub="本周累计"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Daily Focus Chart */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-primary" />
              近 14 天专注趋势
            </h3>
            <DailyFocusChart data={dailyFocus} />
          </div>

          {/* Productive Hours */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-yellow-500" />
              高效时段分布（近30天）
            </h3>
            <ProductiveHoursBars data={prodHours} />
          </div>

          {/* Task Distribution */}
          {taskDist && (
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                任务分布
              </h3>
              <TaskDistributionDisplay dist={taskDist} />
            </div>
          )}

          {/* Interruption Reasons */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              本周中断原因 TOP 5
            </h3>
            <InterruptionReasons reasons={overview?.week.top_interruption_reasons ?? []} />
          </div>

          {/* Time Block Types */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-indigo-500" />
              时间块类型（近30天）
            </h3>
            {blockTypes.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">暂无时间块数据</p>
            ) : (
              <div className="space-y-2">
                {blockTypes.map((bt, i) => {
                  const total = blockTypes.reduce((s, t) => s + t.count, 0)
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs w-16 truncate">{bt.type}</span>
                      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all"
                          style={{ width: `${total > 0 ? (bt.count / total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-12 text-right">
                        {bt.completed}/{bt.count}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}