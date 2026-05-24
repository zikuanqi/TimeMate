import React, { useState, useEffect } from 'react'
import { Plus, Filter, Calendar, Tag, Clock, CheckCircle, Circle, PlayCircle, Trash2, Edit2 } from 'lucide-react'
import { tasksApi, type TaskData } from '../api/tasks'
import { Task } from '../types'

const priorityColors = [
  'bg-gray-100 text-gray-800', // 0: low
  'bg-blue-100 text-blue-800', // 1: medium
  'bg-orange-100 text-orange-800', // 2: high
  'bg-red-100 text-red-800', // 3: urgent
]

const priorityLabels = ['Low', 'Medium', 'High', 'Urgent']

export const TaskPanel: React.FC = () => {
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all')
  const [priorityFilter, setPriorityFilter] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskData | null>(null)

  const [newTask, setNewTask] = useState<Omit<TaskData, 'id' | 'created_at'>>({
    title: '',
    description: '',
    priority: 0,
    status: 'todo',
    due_date: null,
    estimated_minutes: 30,
    tags: '',
  })

  useEffect(() => {
    loadTasks()
  }, [filter, priorityFilter])

  const loadTasks = async () => {
    try {
      const params: any = {}
      if (filter !== 'all') params.status = filter
      if (priorityFilter !== null) params.priority = priorityFilter
      const data = await tasksApi.list(params)
      setTasks(data)
    } catch (err) {
      console.error('Failed to load tasks:', err)
    }
  }

  const handleCreate = async () => {
    try {
      await tasksApi.create(newTask)
      setNewTask({
        title: '',
        description: '',
        priority: 0,
        status: 'todo',
        due_date: null,
        estimated_minutes: 30,
        tags: '',
      })
      setShowCreate(false)
      loadTasks()
    } catch (err) {
      console.error('Failed to create task:', err)
    }
  }

  const handleUpdate = async (id: number, updates: Partial<TaskData>) => {
    try {
      await tasksApi.update(id, updates)
      loadTasks()
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this task?')) return
    try {
      await tasksApi.delete(id)
      loadTasks()
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  const handleBatchStatus = async (ids: number[], status: string) => {
    try {
      await tasksApi.batchUpdateStatus(ids, status)
      loadTasks()
    } catch (err) {
      console.error('Failed to batch update:', err)
    }
  }

  const filteredTasks = tasks.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false
    if (priorityFilter !== null && t.priority !== priorityFilter) return false
    return true
  })

  const stats = {
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    total: tasks.length,
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <p className="text-gray-600">Plan, track, and complete your work</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          New Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Circle className="text-gray-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">To Do</p>
              <p className="text-2xl font-bold">{stats.todo}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <PlayCircle className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold">{stats.in_progress}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Done</p>
              <p className="text-2xl font-bold">{stats.done}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Filter className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-white border rounded-lg p-2">
          <Filter size={18} className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="outline-none bg-transparent"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white border rounded-lg p-2">
          <Filter size={18} className="text-gray-400" />
          <select
            value={priorityFilter === null ? '' : priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value === '' ? null : Number(e.target.value))}
            className="outline-none bg-transparent"
          >
            <option value="">All Priority</option>
            {[0, 1, 2, 3].map(p => (
              <option key={p} value={p}>{priorityLabels[p]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-xl font-bold">Create New Task</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full p-3 border rounded-lg"
              />
              <textarea
                placeholder="Description (optional)"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full p-3 border rounded-lg"
                rows={3}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  >
                    {[0, 1, 2, 3].map(p => (
                      <option key={p} value={p}>{priorityLabels[p]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Estimate (min)</label>
                  <input
                    type="number"
                    value={newTask.estimated_minutes}
                    onChange={(e) => setNewTask({ ...newTask, estimated_minutes: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Due Date (optional)</label>
                <input
                  type="date"
                  value={newTask.due_date || ''}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value || null })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="work, project, personal"
                  value={newTask.tags}
                  onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCreate}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Task
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-3 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map(task => (
          <div
            key={task.id}
            className="bg-white border rounded-xl p-4 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <button
                  onClick={() => handleUpdate(task.id!, {
                    status: task.status === 'done' ? 'todo' : 'in_progress'
                  })}
                  className="mt-1"
                >
                  {task.status === 'done' ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : task.status === 'in_progress' ? (
                    <PlayCircle className="text-blue-500" size={20} />
                  ) : (
                    <Circle className="text-gray-300" size={20} />
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{task.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[task.priority]}`}>
                      {priorityLabels[task.priority]}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    {task.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {task.estimated_minutes} min
                    </div>
                    {task.tags && (
                      <div className="flex items-center gap-1">
                        <Tag size={14} />
                        {task.tags.split(',').map(tag => tag.trim()).filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdate(task.id!, { status: 'done' })}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                  title="Mark done"
                >
                  <CheckCircle size={18} />
                </button>
                <button
                  onClick={() => handleDelete(task.id!)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No tasks match your filters.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-2 text-blue-600 hover:underline"
            >
              Create your first task
            </button>
          </div>
        )}
      </div>

      {/* Batch Actions */}
      {filteredTasks.length > 0 && (
        <div className="flex items-center gap-3 pt-4 border-t">
          <span className="text-sm text-gray-600">Batch actions:</span>
          <button
            onClick={() => handleBatchStatus(
              filteredTasks.filter(t => t.status !== 'done').map(t => t.id!),
              'done'
            )}
            className="px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
          >
            Mark selected as done
          </button>
          <button
            onClick={() => handleBatchStatus(
              filteredTasks.filter(t => t.status !== 'in_progress').map(t => t.id!),
              'in_progress'
            )}
            className="px-3 py-1.5 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
          >
            Start all
          </button>
        </div>
      )}
    </div>
  )
}