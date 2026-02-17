import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { DailyBriefing, Task, TokenDailySummary } from '../lib/supabase'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { Calendar, DollarSign, CheckCircle, AlertTriangle, Plus } from 'lucide-react'
import { format } from 'date-fns'

export function Dashboard() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null)
  const [activeTasks, setActiveTasks] = useState<Task[]>([])
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

  const tasksByProject = activeTasks.reduce((acc, task) => {
    const project = task.project || 'Unassigned'
    acc[project] = (acc[project] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Welcome back, Dallin. Here's what's happening.</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </button>
        </div>
      </div>

      {/* Today's Briefing */}
      {briefing && (
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-semibold">Today's Briefing</h2>
          </div>
          <p className="text-gray-300 mb-4">{briefing.summary}</p>
          
          {briefing.weather && (
            <div className="bg-gray-900 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-400">{briefing.weather}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Email Highlights</h4>
              <div className="space-y-1">
                {briefing.email_highlights.slice(0, 3).map((email: any, i) => (
                  <div key={i} className="text-sm bg-gray-900 rounded p-2">
                    <div className="font-medium">{email.subject}</div>
                    <div className="text-gray-400">{email.from}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Calendar Events</h4>
              <div className="space-y-1">
                {briefing.calendar_events.slice(0, 3).map((event: any, i) => (
                  <div key={i} className="text-sm bg-gray-900 rounded p-2">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-gray-400">{event.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Today's Spend</p>
              <p className="text-2xl font-bold text-white font-mono">
                ${tokenSummary?.total_cost || '0.00'}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-amber-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Tasks</p>
              <p className="text-2xl font-bold text-white">{activeTasks.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Sessions Today</p>
              <p className="text-2xl font-bold text-white">{tokenSummary?.session_count || 0}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Tokens</p>
              <p className="text-2xl font-bold text-white font-mono">
                {((tokenSummary?.total_input_tokens || 0) + (tokenSummary?.total_output_tokens || 0)).toLocaleString()}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Weekly Spend Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">7-Day Spending Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklySpend}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="total_cost" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B', strokeWidth: 0, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tasks by Project */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Active Tasks by Project</h3>
          <div className="space-y-3">
            {Object.entries(tasksByProject).map(([project, count]) => (
              <div key={project} className="flex items-center justify-between">
                <span className="text-gray-300">{project}</span>
                <span className="bg-amber-500 text-gray-900 px-2 py-1 rounded-full text-sm font-medium">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}