import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Task } from '../lib/supabase'
import { Plus, Search, Filter, Calendar, User, Flag, Sparkles } from 'lucide-react'
import { format } from 'date-fns'

const statusColors = {
  pending: 'bg-yellow-400',
  in_progress: 'bg-blue-400',
  blocked: 'bg-red-400',
  done: 'bg-green-400',
  cancelled: 'bg-gray-400'
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
        <div className="glass-card p-8">
          <div className="flex items-center space-x-3 text-gray-300">
            <div className="animate-spin">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="font-medium">Loading tasks...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-light text-white">Tasks</h1>
          <p className="text-gray-400 text-lg font-light">Manage your tasks and project work</p>
        </div>
        <div className="flex space-x-4">
          <button className="btn-secondary flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filter</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6">
        <div className="flex flex-wrap gap-6">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="glass-input pl-12 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <select 
            className="glass-input min-w-32"
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
            className="glass-input min-w-32"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>

          <div className="flex glass-card p-1">
            <button
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                viewMode === 'table' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                  : 'text-gray-300 hover:bg-white/10'
              }`}
              onClick={() => setViewMode('table')}
            >
              Table
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                viewMode === 'kanban' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                  : 'text-gray-300 hover:bg-white/10'
              }`}
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      {viewMode === 'table' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-6 font-medium text-gray-400">Task</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-400">Status</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-400">Priority</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-400">Project</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-400">Due Date</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-400">Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="border-b border-white/5 hover:bg-white/5 transition-all duration-200">
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-white mb-1">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-400 font-light">{task.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as Task['status'])}
                        className="glass-input text-sm min-w-24"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="blocked">Blocked</option>
                        <option value="done">Done</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Flag className={`w-4 h-4 ${priorityColors[task.priority]}`} />
                        <span className={`text-sm capitalize font-medium ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="glass-card px-3 py-1 text-gray-300 text-sm font-medium">
                        {task.project || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {task.due_date ? (
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(task.due_date), 'MMM dd')}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {(['pending', 'in_progress', 'blocked', 'done', 'cancelled'] as const).map((status) => (
            <div key={status} className="space-y-4">
              <h3 className="text-lg font-medium text-white capitalize flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${statusColors[status]} shadow-lg`}></div>
                <span>{status.replace('_', ' ')}</span>
                <span className="text-sm text-gray-400 glass-card px-2 py-1 rounded-full">
                  {filteredTasks.filter(task => task.status === status).length}
                </span>
              </h3>
              
              <div className="space-y-4">
                {filteredTasks
                  .filter(task => task.status === status)
                  .map((task) => (
                    <div key={task.id} className="glass-card p-5 hover:-translate-y-1 transition-all duration-200">
                      <h4 className="font-medium text-white mb-3">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-400 mb-4 font-light leading-relaxed">{task.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Flag className={`w-3 h-3 ${priorityColors[task.priority]}`} />
                          <span className="text-xs glass-card text-gray-300 px-2 py-1 rounded-lg font-medium">
                            {task.project || 'Unassigned'}
                          </span>
                        </div>
                        
                        {task.due_date && (
                          <span className="text-xs text-gray-400 flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(task.due_date), 'MMM dd')}</span>
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