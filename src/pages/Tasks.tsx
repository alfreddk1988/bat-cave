import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Task } from '../lib/supabase'
import { Plus, Search, Filter, Calendar, User, Flag } from 'lucide-react'
import { format } from 'date-fns'

const statusColors = {
  pending: 'bg-yellow-500',
  in_progress: 'bg-blue-500',
  blocked: 'bg-red-500',
  done: 'bg-green-500',
  cancelled: 'bg-gray-500'
}

const priorityColors = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  urgent: 'text-red-400'
}

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')

  useEffect(() => {
    loadTasks()
  }, [])

  useEffect(() => {
    filterTasks()
  }, [tasks, searchTerm, statusFilter, projectFilter])

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTasks = () => {
    let filtered = tasks

    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    if (projectFilter !== 'all') {
      filtered = filtered.filter(task => task.project === projectFilter)
    }

    setFilteredTasks(filtered)
  }

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString(),
          ...(newStatus === 'done' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', taskId)
      
      if (error) throw error
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: newStatus, 
              updated_at: new Date().toISOString(),
              ...(newStatus === 'done' ? { completed_at: new Date().toISOString() } : {})
            }
          : task
      ))
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const projects = [...new Set(tasks.map(task => task.project).filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading tasks...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Tasks</h1>
          <p className="text-gray-400">Manage your tasks and project work</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
          <button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="input-field pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <select 
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select 
            className="input-field"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>

          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              className={`px-3 py-1 rounded ${viewMode === 'table' ? 'bg-amber-500 text-gray-900' : 'text-gray-300'}`}
              onClick={() => setViewMode('table')}
            >
              Table
            </button>
            <button
              className={`px-3 py-1 rounded ${viewMode === 'kanban' ? 'bg-amber-500 text-gray-900' : 'text-gray-300'}`}
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      {viewMode === 'table' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-400">Task</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-400">Priority</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-400">Project</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-400">Due Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-400">Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-white">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-400 mt-1">{task.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as Task['status'])}
                        className="bg-gray-800 text-white text-sm rounded px-2 py-1 border-0"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="blocked">Blocked</option>
                        <option value="done">Done</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <Flag className={`w-4 h-4 ${priorityColors[task.priority]}`} />
                        <span className={`text-sm capitalize ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm">
                        {task.project || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {task.due_date ? (
                        <div className="flex items-center space-x-1 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(task.due_date), 'MMM dd')}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1 text-sm text-gray-400">
                        <User className="w-4 h-4" />
                        <span className="capitalize">{task.source || 'manual'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-5 gap-6">
          {(['pending', 'in_progress', 'blocked', 'done', 'cancelled'] as const).map((status) => (
            <div key={status} className="space-y-4">
              <h3 className="text-lg font-semibold text-white capitalize flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${statusColors[status]}`}></div>
                <span>{status.replace('_', ' ')}</span>
                <span className="text-sm text-gray-400">
                  ({filteredTasks.filter(task => task.status === status).length})
                </span>
              </h3>
              
              <div className="space-y-3">
                {filteredTasks
                  .filter(task => task.status === status)
                  .map((task) => (
                    <div key={task.id} className="card p-4">
                      <h4 className="font-medium text-white mb-2">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-400 mb-3">{task.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Flag className={`w-3 h-3 ${priorityColors[task.priority]}`} />
                          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                            {task.project || 'Unassigned'}
                          </span>
                        </div>
                        
                        {task.due_date && (
                          <span className="text-xs text-gray-400">
                            {format(new Date(task.due_date), 'MMM dd')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}