import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { DailyBriefing, Task, TokenDailySummary } from '../lib/supabase'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { Calendar, DollarSign, CheckCircle, AlertTriangle, Plus, Sparkles, MessageCircle, Activity, Clock } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { generateAlfreddDeepLink, generateTaskMessage } from '../utils/telegram'

const agents = {
  Pixel: { emoji: '🎨', role: 'UI/frontend/design' },
  Forge: { emoji: '🔧', role: 'infrastructure/backend' },
  Metric: { emoji: '📊', role: 'data collection/analytics' },
  Scout: { emoji: '🔍', role: 'research/investigation' },
  Sentinel: { emoji: '🛡️', role: 'audits/security' },
  Scribe: { emoji: '✍️', role: 'writing/content' },
  Dispatch: { emoji: '📋', role: 'task management' }
}

export function Dashboard() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null)
  const [activeTasks, setActiveTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [tokenSummary, setTokenSummary] = useState<TokenDailySummary | null>(null)
  const [weeklySpend, setWeeklySpend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load today's briefing
      const { data: briefingData } = await supabase
        .from('daily_briefings')
        .select('*')
        .eq('date', format(new Date(), 'yyyy-MM-dd'))
        .single()
      
      setBriefing(briefingData)

      // Load active tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .in('status', ['pending', 'in_progress', 'blocked'])
        .order('created_at', { ascending: false })
        .limit(10)
      
      setActiveTasks(tasksData || [])

      // Load recently completed tasks
      const { data: completedData } = await supabase
        .from('tasks')
        .select('*')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(5)
      
      setCompletedTasks(completedData || [])

      // Load today's token summary
      const { data: summaryData } = await supabase
        .from('token_daily_summary')
        .select('*')
        .eq('date', format(new Date(), 'yyyy-MM-dd'))
        .single()
      
      setTokenSummary(summaryData)

      // Load last 7 days of spending for chart
      const { data: weeklyData } = await supabase
        .from('token_daily_summary')
        .select('date, total_cost')
        .order('date', { ascending: true })
        .limit(7)
      
      setWeeklySpend(weeklyData || [])

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Removed tasksByProject as we now display individual tasks

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="glass-card p-8">
          <div className="flex items-center space-x-3 text-gray-300">
            <div className="animate-spin">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="font-medium">Loading dashboard...</span>
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
          <h1 className="text-4xl font-light text-white">Dashboard</h1>
          <p className="text-gray-400 text-lg font-light">Welcome back, Dallin. Here's what's happening.</p>
        </div>
        <div className="flex space-x-4">
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Today's Briefing */}
      {briefing && (
        <div className="glass-card p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
          
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl">
              <Calendar className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-light text-white">Today's Briefing</h2>
              <p className="text-sm text-gray-400">{format(new Date(), 'EEEE, MMMM d')}</p>
            </div>
          </div>
          
          <p className="text-gray-300 mb-6 text-lg font-light leading-relaxed">{briefing.summary}</p>
          
          {briefing.weather && (
            <div className="glass-card p-4 mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <p className="text-gray-300 font-light">{briefing.weather}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h4 className="text-lg font-medium text-white mb-4">Email Highlights</h4>
              <div className="space-y-3">
                {briefing.email_highlights.slice(0, 3).map((email: any, i) => (
                  <div key={i} className="glass-card p-4 hover:bg-white/10 transition-all duration-200">
                    <div className="font-medium text-white mb-1">{email.subject}</div>
                    <div className="text-gray-400 text-sm">{email.from}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-lg font-medium text-white mb-4">Calendar Events</h4>
              <div className="space-y-3">
                {briefing.calendar_events.slice(0, 3).map((event: any, i) => (
                  <div key={i} className="glass-card p-4 hover:bg-white/10 transition-all duration-200">
                    <div className="font-medium text-white mb-1">{event.title}</div>
                    <div className="text-gray-400 text-sm">{event.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-medium">Today's Spend</p>
              <p className="text-3xl font-light text-white font-mono">
                ${tokenSummary?.total_cost || '0.00'}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-medium">Active Tasks</p>
              <p className="text-3xl font-light text-white">{activeTasks.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <CheckCircle className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-medium">Sessions Today</p>
              <p className="text-3xl font-light text-white">{tokenSummary?.session_count || 0}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <AlertTriangle className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-medium">Total Tokens</p>
              <p className="text-3xl font-light text-white font-mono">
                {((tokenSummary?.total_input_tokens || 0) + (tokenSummary?.total_output_tokens || 0)).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Spend Chart */}
        <div className="glass-card p-8 lg:col-span-2">
          <h3 className="text-xl font-light text-white mb-6">7-Day Spending Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklySpend}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="total_cost" 
                  stroke="url(#gradient)"
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', strokeWidth: 0, r: 5 }}
                  activeDot={{ r: 7, fill: '#8b5cf6' }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Completions */}
        <div className="glass-card p-8">
          <div className="flex items-center space-x-2 mb-6">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-xl font-light text-white">Recent Completions</h3>
          </div>
          <div className="space-y-4">
            {completedTasks.map((task) => (
              <div key={task.id} className="p-4 glass-card hover:bg-white/5 transition-all duration-200">
                <div className="font-medium text-white mb-2 text-sm">{task.title}</div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-2">
                    {task.agent_name && agents[task.agent_name as keyof typeof agents] && (
                      <span className="flex items-center space-x-1 glass-card px-2 py-1 rounded">
                        <span>{agents[task.agent_name as keyof typeof agents].emoji}</span>
                        <span>{task.agent_name}</span>
                      </span>
                    )}
                    {task.token_cost && (
                      <span className="text-green-400">${task.token_cost.toFixed(3)}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{task.completed_at ? formatDistanceToNow(new Date(task.completed_at), { addSuffix: true }) : 'Recently'}</span>
                  </div>
                </div>
              </div>
            ))}
            {completedTasks.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No completed tasks yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Tasks with Agent Assignments */}
      <div className="glass-card p-8">
        <div className="flex items-center space-x-2 mb-6">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h3 className="text-xl font-light text-white">Active Tasks with Agent Assignments</h3>
        </div>
        <div className="space-y-4">
          {activeTasks.slice(0, 8).map((task) => (
            <div key={task.id} className="flex items-center justify-between p-4 glass-card hover:bg-white/5 transition-all duration-200">
              <div className="flex-1">
                <div className="font-medium text-white mb-2">{task.title}</div>
                <div className="flex items-center space-x-3 text-sm text-gray-400">
                  <span className="glass-card px-2 py-1 rounded-lg">
                    {task.project || 'Unassigned'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium glass-card ${
                    task.status === 'pending' ? 'text-yellow-400' :
                    task.status === 'in_progress' ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </span>
                  {task.agent_name && agents[task.agent_name as keyof typeof agents] && (
                    <span className="flex items-center space-x-1 glass-card px-2 py-1 rounded text-indigo-300">
                      <span>{agents[task.agent_name as keyof typeof agents].emoji}</span>
                      <span>{task.agent_name}</span>
                      {task.agent_model && (
                        <span className="text-xs text-gray-500">({task.agent_model})</span>
                      )}
                    </span>
                  )}
                  {!task.agent_name && (
                    <span className="text-xs text-gray-500 italic">No agent assigned</span>
                  )}
                  {task.token_cost && (
                    <span className="text-green-400 text-xs">${task.token_cost.toFixed(3)}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => window.open(generateAlfreddDeepLink(generateTaskMessage(task.title, task.description)), '_blank')}
                className="glass-card p-2 hover:bg-indigo-500/20 hover:scale-110 transition-all duration-200 group"
                title="Chat with Alfred about this task"
              >
                <MessageCircle className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
              </button>
            </div>
          ))}
          {activeTasks.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active tasks</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}