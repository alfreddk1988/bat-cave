import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { TokenDailySummary } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip } from 'recharts'
import { DollarSign, TrendingUp, AlertTriangle, Calendar } from 'lucide-react'
import { format, subDays } from 'date-fns'

const COLORS = {
  opus: '#DC2626',
  sonnet: '#F59E0B', 
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
        <div className="text-gray-400">Loading token usage data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Token Usage & Costs</h1>
        <p className="text-gray-400">Monitor AI model usage and optimize spending</p>
      </div>

      {/* Budget Overview */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Monthly Budget Status</h2>
          {budgetUsedPercent > 100 && (
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Over Budget!</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div>
            <p className="text-gray-400 text-sm">Current Month</p>
            <p className="text-3xl font-bold text-white font-mono">${currentMonthTotal.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Target Budget</p>
            <p className="text-3xl font-bold text-green-400 font-mono">${budgetTarget}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Budget Cap</p>
            <p className="text-3xl font-bold text-red-400 font-mono">${budgetCap}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Budget Used</p>
            <p className={`text-3xl font-bold font-mono ${budgetUsedPercent > 100 ? 'text-red-400' : budgetUsedPercent > 80 ? 'text-yellow-400' : 'text-green-400'}`}>
              {budgetUsedPercent.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-3">
          <div className="relative">
            <div 
              className={`h-3 rounded-full ${budgetUsedPercent > 100 ? 'bg-red-500' : budgetUsedPercent > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
            ></div>
            <div 
              className="absolute top-0 w-0.5 h-3 bg-amber-500"
              style={{ left: `${(budgetTarget / budgetCap) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Daily Cost Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Daily Spending (30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySummaries}>
                <XAxis 
                  dataKey="date"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                />
                <YAxis 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px', color: '#F9FAFB' }}
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
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Cost by Model (30 Days)</h3>
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
                    contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px', color: '#F9FAFB' }}
                    formatter={(value: any) => `$${(value || 0).toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="ml-4">
              {modelBreakdown.map((item) => (
                <div key={item.name} className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-300">{item.name}</span>
                  <span className="text-sm font-mono text-white">${item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Session Type Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Cost by Session Type</h3>
          <div className="space-y-3">
            {sessionTypeBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-gray-300">{item.name}</span>
                <span className="font-mono text-white">${item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Cost Optimization Tips</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-300">Use Haiku for simple tasks</p>
                <p className="text-xs text-gray-500">Can reduce costs by up to 90% for routine operations</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <DollarSign className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-300">Batch similar requests</p>
                <p className="text-xs text-gray-500">Group multiple tasks in single sessions</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-300">Optimize heartbeat frequency</p>
                <p className="text-xs text-gray-500">Balance responsiveness with cost efficiency</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MTD Trend */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Month-to-Date Spending Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailySummaries.filter(s => s.date.startsWith(format(new Date(), 'yyyy-MM')))}>
              <XAxis 
                dataKey="date"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(value) => format(new Date(value), 'dd')}
              />
              <YAxis 
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px', color: '#F9FAFB' }}
                formatter={(value: any) => [`$${(value || 0).toFixed(2)}`, 'Daily Cost']}
                labelFormatter={(label) => format(new Date(label), 'MMM dd')}
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
        
        {/* Budget Lines */}
        <div className="mt-4 flex justify-between text-sm">
          <span className="text-gray-400">Target: ${budgetTarget}/month</span>
          <span className="text-red-400">Cap: ${budgetCap}/month</span>
        </div>
      </div>
    </div>
  )
}