import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Task } from '../lib/supabase'
import { Search, Flag, Sparkles, MessageCircle, Clock, Target, FileText, Activity, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { generateAlfreddDeepLink, generateTaskMessage } from '../utils/telegram'

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

const agents = {
  Pixel: { emoji: '🎨', role: 'UI/frontend/design' },
  Forge: { emoji: '🔧', role: 'infrastructure/backend' },
  Metric: { emoji: '📊', role: 'data collection/analytics' },
  Scout: { emoji: '🔍', role: 'research/investigation' },
  Sentinel: { emoji: '🛡️', role: 'audits/security' },
  Scribe: { emoji: '✍️', role: 'writing/content' },
  Dispatch: { emoji: '📋', role: 'task management' }
}

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [agentFilter, setAgentFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')

  useEffect(() => {
    loadTasks()
  }, [])

  useEffect(() => {
    filterTasks()
  }, [tasks, searchTerm, statusFilter, projectFilter, agentFilter, activeTab])

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setTasks(data || [])
      
      // Auto-select first task if none selected
      if (data && data.length > 0 && !selectedTask) {
        setSelectedTask(data[0])
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTasks = () => {
    let filtered = tasks

    // Filter by tab (active/completed)
    if (activeTab === 'completed') {
      filtered = filtered.filter(task => task.completed_at)
    } else {
      filtered = filtered.filter(task => !task.completed_at)
    }

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

    if (agentFilter !== 'all') {
      filtered = filtered.filter(task => task.agent_name === agentFilter)
    }

    setFilteredTasks(filtered)
  }

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const completedAt: string | null = newStatus === 'done' ? new Date().toISOString() : null
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString(),
          completed_at: completedAt
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
              completed_at: completedAt
            }
          : task
      ))

      // Update selected task if it's the one being updated
      if (selectedTask?.id === taskId) {
        setSelectedTask({
          ...selectedTask,
          status: newStatus,
          updated_at: new Date().toISOString(),
          completed_at: completedAt
        })
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const projects = [...new Set(tasks.map(task => task.project).filter(Boolean))]
  const agentNames = [...new Set(tasks.map(task => task.agent_name).filter(Boolean))]

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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-light text-white">Tasks</h1>
          <p className="text-gray-400 text-lg font-light">Manage your tasks with AI agent assistance</p>
        </div>
        
        {/* Agent Legend */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Available Agents</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(agents).map(([name, info]) => (
              <div key={name} className="flex items-center space-x-2 text-gray-300">
                <span className="text-base">{info.emoji}</span>
                <span className="font-medium">{name}</span>
                <span className="text-gray-500">—</span>
                <span className="text-gray-400">{info.role.split('/')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Panel - Task List (40% width) */}
        <div className="w-2/5 flex flex-col space-y-4">
          {/* Tabs */}
          <div className="flex glass-card p-1">
            <button
              className={`flex-1 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'active' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                  : 'text-gray-300 hover:bg-white/10'
              }`}
              onClick={() => setActiveTab('active')}
            >
              Active ({tasks.filter(t => !t.completed_at).length})
            </button>
            <button
              className={`flex-1 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'completed' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                  : 'text-gray-300 hover:bg-white/10'
              }`}
              onClick={() => setActiveTab('completed')}
            >
              Completed ({tasks.filter(t => t.completed_at).length})
            </button>
          </div>

          {/* Filters */}
          <div className="glass-card p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="glass-input pl-10 w-full text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <select 
                className="glass-input text-xs"
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
                className="glass-input text-xs"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="all">All Projects</option>
                {projects.map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>

              <select 
                className="glass-input text-xs"
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
              >
                <option value="all">All Agents</option>
                {agentNames.map(agent => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`glass-card p-4 cursor-pointer transition-all duration-200 hover:bg-white/10 ${
                  selectedTask?.id === task.id ? 'ring-2 ring-indigo-500' : ''
                }`}
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-white text-sm leading-tight">{task.title}</h3>
                  <div className="flex items-center space-x-2 ml-2">
                    <div className={`w-2 h-2 rounded-full ${statusColors[task.status]}`} />
                    <Flag className={`w-3 h-3 ${priorityColors[task.priority]}`} />
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-3">
                    {task.agent_name && agents[task.agent_name as keyof typeof agents] && (
                      <span className="glass-card px-2 py-1 text-xs flex items-center space-x-1">
                        <span>{agents[task.agent_name as keyof typeof agents].emoji}</span>
                        <span>{task.agent_name}</span>
                      </span>
                    )}
                    {task.project && (
                      <span className="glass-card px-2 py-1 text-xs">{task.project}</span>
                    )}
                  </div>
                  {task.token_cost && (
                    <span className="text-green-400">${task.token_cost.toFixed(3)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Task Detail (60% width) */}
        <div className="w-3/5 flex flex-col space-y-4">
          {selectedTask ? (
            <>
              {/* Task Header */}
              <div className="glass-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-light text-white">{selectedTask.title}</h2>
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${statusColors[selectedTask.status]}`} />
                    <span className="text-sm text-gray-300 capitalize">{selectedTask.status.replace('_', ' ')}</span>
                    <Flag className={`w-4 h-4 ${priorityColors[selectedTask.priority]}`} />
                    <span className={`text-sm capitalize ${priorityColors[selectedTask.priority]}`}>
                      {selectedTask.priority}
                    </span>
                  </div>
                </div>

                {/* Status Update */}
                <div className="mb-4">
                  <select
                    value={selectedTask.status}
                    onChange={(e) => updateTaskStatus(selectedTask.id, e.target.value as Task['status'])}
                    className="glass-input text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Key Outcome */}
              <div className="glass-card p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Target className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-medium text-white">Key Outcome</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  {selectedTask.key_outcome || "No outcome defined yet — what does success look like for this task?"}
                </p>
              </div>

              {/* Context */}
              <div className="glass-card p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-medium text-white">Context</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  {selectedTask.context || selectedTask.description || "No detailed context provided yet."}
                </p>
              </div>

              {/* Assigned Agent & Cost */}
              <div className="glass-card p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Activity className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-medium text-white">Assigned Agent</h3>
                    </div>
                    {selectedTask.agent_name ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{agents[selectedTask.agent_name as keyof typeof agents]?.emoji}</span>
                          <div>
                            <div className="text-white font-medium">{selectedTask.agent_name}</div>
                            <div className="text-sm text-gray-400">
                              {agents[selectedTask.agent_name as keyof typeof agents]?.role}
                            </div>
                          </div>
                        </div>
                        {selectedTask.agent_model && (
                          <div className="text-sm text-gray-400">
                            Model: <span className="text-indigo-400">{selectedTask.agent_model}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-400">No agent assigned yet</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <h3 className="text-lg font-medium text-white">Cost</h3>
                    </div>
                    {selectedTask.token_cost ? (
                      <div className="text-2xl font-light text-green-400">
                        ${selectedTask.token_cost.toFixed(3)}
                      </div>
                    ) : (
                      <p className="text-gray-400">No cost data yet</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center space-x-4">
                  <button
                    onClick={() => window.open(generateAlfreddDeepLink(generateTaskMessage(selectedTask.title, selectedTask.description)), '_blank')}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat with Alfred</span>
                  </button>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="glass-card p-6 flex-1">
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <h3 className="text-lg font-medium text-white">Activity Timeline</h3>
                </div>
                
                <div className="space-y-4 relative">
                  {/* Vertical line */}
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500 via-purple-500 to-transparent"></div>
                  
                  {selectedTask.activity_log && selectedTask.activity_log.length > 0 ? (
                    selectedTask.activity_log.map((entry, index) => (
                      <div key={index} className="relative flex items-start space-x-4">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 relative z-10"></div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium capitalize">
                              {entry.action.replace('_', ' ')}
                            </span>
                            {entry.agent && (
                              <span className="text-sm text-indigo-400">by {entry.agent}</span>
                            )}
                            <span className="text-xs text-gray-500">
                              {format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                          {entry.details && (
                            <p className="text-sm text-gray-400 mt-1">{entry.details}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="relative flex items-start space-x-4">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 relative z-10"></div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">Created</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(selectedTask.created_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">Task was created</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select a task to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}