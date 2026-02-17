import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { TokenDailySummary } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip } from 'recharts'
import { DollarSign, TrendingUp, AlertTriangle, Calendar, Sparkles } from 'lucide-react'
import { format, subDays } from 'date-fns'

const COLORS = {
  opus: '#DC2626',
  sonnet: '#6366f1', 
  haiku: '#10B981'
}

export function TokenUsage() {
  const [dailySummaries, setDailySummaries] = useState<TokenDailySummary[]>([])
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0)
  const [modelBreakdown, setModelBreakdown] = useState<any[]>([])
  const [sessionTypeBreakdown, setSessionTypeBreakdown] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTokenData()
  }, [])

  const loadTokenData = async () => {
    try {
      // Load last 30 days of daily summaries
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')
      const { data: summaries } = await supabase
        .from('token_daily_summary')
        .select('*')
        .gte('date', thirtyDaysAgo)
        .order('date', { ascending: true })
      
      setDailySummaries(summaries || [])

      // Calculate current month total
      const currentMonth = format(new Date(), 'yyyy-MM')
      const monthTotal = (summaries || [])
        .filter(s => s.date.startsWith(currentMonth))
        .reduce((sum, s) => sum + s.total_cost, 0)
      setCurrentMonthTotal(monthTotal)

      // Calculate model breakdown from last 30 days
      const modelData = [
        {
          name: 'Opus',
          value: (summaries || []).reduce((sum, s) => sum + s.opus_cost, 0),
          color: COLORS.opus
        },
        {
          name: 'Sonnet',
          value: (summaries || []).reduce((sum, s) => sum + s.sonnet_cost, 0),
          color: COLORS.sonnet
        },
        {
          name: 'Haiku',
          value: (summaries || []).reduce((sum, s) => sum + s.haiku_cost, 0),
          color: COLORS.haiku
        }
      ]
      setModelBreakdown(modelData)

      // Load recent usage for session type breakdown
      const { data: usage } = await supabase
        .from('token_usage')
        .select('*')
        .gte('timestamp', thirtyDaysAgo)
        .order('timestamp', { ascending: false })
        .limit(1000)

      // Calculate session type breakdown
      const sessionTypes = (usage || []).reduce((acc, u) => {
        acc[u.session_type] = (acc[u.session_type] || 0) + u.estimated_cost
        return acc
      }, {} as Record<string, number>)

      const sessionData = Object.entries(sessionTypes).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: Number((value as number).toFixed(4))
      }))
      setSessionTypeBreakdown(sessionData)

    } catch (error) {
      console.error('Error loading token data:', error)
    } finally {
      setLoading(false)
    }
  }

  const budgetTarget = 200
  const budgetCap = 300
  const budgetUsedPercent = (currentMonthTotal / budgetTarget) * 100

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="glass-card p-8">
          <div className="flex items-center space-x-3 text-gray-300">
            <div className="animate-spin">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="font-medium">Loading token usage data...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-light text-white">Token Usage & Costs</h1>
        <p className="text-gray-400 text-lg font-light">Monitor AI model usage and optimize spending</p>
      </div>

      {/* Budget Overview */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-light text-white">Monthly Budget Status</h2>
          {budgetUsedPercent > 100 && (
            <div className="flex items-center space-x-3 text-red-400 glass-card p-3">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Over Budget!</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="metric-card">
            <p className="text-gray-400 text-sm font-medium">Current Month</p>
            <p className="text-3xl font-light text-white font-mono mt-2">${currentMonthTotal.toFixed(2)}</p>
          </div>
          <div className="metric-card">
            <p className="text-gray-400 text-sm font-medium">Target Budget</p>
            <p className="text-3xl font-light text-green-400 font-mono mt-2">${budgetTarget}</p>
          </div>
          <div className="metric-card">
            <p className="text-gray-400 text-sm font-medium">Budget Cap</p>
            <p className="text-3xl font-light text-red-400 font-mono mt-2">${budgetCap}</p>
          </div>
          <div className="metric-card">
            <p className="text-gray-400 text-sm font-medium">Budget Used</p>
            <p className={`text-3xl font-light font-mono mt-2 ${budgetUsedPercent > 100 ? 'text-red-400' : budgetUsedPercent > 80 ? 'text-yellow-400' : 'text-green-400'}`}>
              {budgetUsedPercent.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden backdrop-blur-sm">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                budgetUsedPercent > 100 
                  ? 'bg-gradient-to-r from-red-500 to-red-600' 
                  : budgetUsedPercent > 80 
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-500'
              }`}
              style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
            ></div>
            <div 
              className="absolute top-0 w-1 h-4 bg-indigo-400 rounded-full shadow-lg"
              style={{ left: `${(budgetTarget / budgetCap) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-400">
            <span>$0</span>
            <span>Target: ${budgetTarget}</span>
            <span>Cap: ${budgetCap}</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Cost Chart */}
        <div className="glass-card p-8">
          <h3 className="text-xl font-light text-white mb-6">Daily Spending (30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySummaries}>
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
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    borderRadius: '12px', 
                    color: '#F9FAFB' 
                  }}
                  formatter={(value: any) => [`$${(value || 0).toFixed(2)}`, 'Cost']}
                  labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
                />
                <Bar dataKey="opus_cost" stackId="a" fill={COLORS.opus} />
                <Bar dataKey="sonnet_cost" stackId="a" fill={COLORS.sonnet} />
                <Bar dataKey="haiku_cost" stackId="a" fill={COLORS.haiku} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost by Model */}
        <div className="glass-card p-8">
          <h3 className="text-xl font-light text-white mb-6">Cost by Model (30 Days)</h3>
          <div className="h-64 flex items-center">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modelBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {modelBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      borderRadius: '12px', 
                      color: '#F9FAFB' 
                    }}
                    formatter={(value: any) => `$${(value || 0).toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="ml-6 space-y-3">
              {modelBreakdown.map((item) => (
                <div key={item.name} className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full shadow-lg" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div className="flex-1 text-sm text-gray-300 font-medium">{item.name}</div>
                  <div className="text-sm font-mono text-white glass-card px-2 py-1">
                    ${item.value.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Session Type Breakdown */}
        <div className="glass-card p-8">
          <h3 className="text-xl font-light text-white mb-6">Cost by Session Type</h3>
          <div className="space-y-4">
            {sessionTypeBreakdown.map((item) => (
              <div key={item.name} className="glass-card p-4 flex items-center justify-between hover:bg-white/5 transition-all duration-200">
                <span className="text-gray-300 font-medium">{item.name}</span>
                <span className="font-mono text-white">${item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="glass-card p-8">
          <h3 className="text-xl font-light text-white mb-6">Cost Optimization Tips</h3>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="space-y-1">
                <p className="text-white font-medium">Use Haiku for simple tasks</p>
                <p className="text-sm text-gray-400 font-light">Can reduce costs by up to 90% for routine operations</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl">
                <DollarSign className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="space-y-1">
                <p className="text-white font-medium">Batch similar requests</p>
                <p className="text-sm text-gray-400 font-light">Group multiple tasks in single sessions</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div className="space-y-1">
                <p className="text-white font-medium">Optimize heartbeat frequency</p>
                <p className="text-sm text-gray-400 font-light">Balance responsiveness with cost efficiency</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MTD Trend */}
      <div className="glass-card p-8">
        <h3 className="text-xl font-light text-white mb-6">Month-to-Date Spending Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailySummaries.filter(s => s.date.startsWith(format(new Date(), 'yyyy-MM')))}>
              <XAxis 
                dataKey="date"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(value) => format(new Date(value), 'dd')}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  borderRadius: '12px', 
                  color: '#F9FAFB' 
                }}
                formatter={(value: any) => [`$${(value || 0).toFixed(2)}`, 'Daily Cost']}
                labelFormatter={(label) => format(new Date(label), 'MMM dd')}
              />
              <Line 
                type="monotone" 
                dataKey="total_cost" 
                stroke="url(#gradientLine)"
                strokeWidth={3}
                dot={{ fill: '#6366f1', strokeWidth: 0, r: 5 }}
                activeDot={{ r: 7, fill: '#8b5cf6' }}
              />
              <defs>
                <linearGradient id="gradientLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}