import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { SystemHealth as SystemHealthType } from '../lib/supabase'
import { Activity, AlertTriangle, CheckCircle, Clock, Settings, Zap, Sparkles } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

const statusIcons = {
  ok: CheckCircle,
  warning: AlertTriangle,
  error: AlertTriangle
}

const statusColors = {
  ok: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500'
}

const checkTypeIcons = {
  heartbeat: Activity,
  cron_run: Clock,
  error: AlertTriangle,
  restart: Zap,
  config_change: Settings
}

export function SystemHealth() {
  const [healthChecks, setHealthChecks] = useState<SystemHealthType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadHealthData()
    
    // Set up realtime subscription
    const channel = supabase
      .channel('system_health')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'system_health' },
        (payload) => {
          console.log('Health update:', payload)
          loadHealthData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadHealthData = async () => {
    try {
      const { data, error } = await supabase
        .from('system_health')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100)
      
      if (error) throw error
      setHealthChecks(data || [])
    } catch (error) {
      console.error('Error loading health data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredChecks = healthChecks.filter(check => 
    filter === 'all' || check.check_type === filter
  )

  const recentChecks = healthChecks.slice(0, 5)
  const errorCount = healthChecks.filter(c => c.status === 'error' && !c.resolved).length
  const warningCount = healthChecks.filter(c => c.status === 'warning' && !c.resolved).length
  const lastHeartbeat = healthChecks.find(c => c.check_type === 'heartbeat')

  const checkTypes = [...new Set(healthChecks.map(c => c.check_type))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="glass-card p-8">
          <div className="flex items-center space-x-3 text-gray-300">
            <div className="animate-spin">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="font-medium">Loading system health data...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-light text-white">System Health</h1>
        <p className="text-gray-400 text-lg font-light">Monitor Alfred's heartbeat and system status</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-medium">System Status</p>
              <p className={`text-3xl font-light ${errorCount > 0 ? 'text-red-400' : warningCount > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                {errorCount > 0 ? 'Error' : warningCount > 0 ? 'Warning' : 'Healthy'}
              </p>
            </div>
            <div className={`p-3 rounded-xl group-hover:scale-110 transition-transform duration-200 ${
              errorCount > 0 
                ? 'bg-gradient-to-br from-red-500/20 to-red-600/20'
                : warningCount > 0 
                  ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20'
                  : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
            }`}>
              {errorCount > 0 ? (
                <AlertTriangle className="w-8 h-8 text-red-400" />
              ) : warningCount > 0 ? (
                <AlertTriangle className="w-8 h-8 text-yellow-400" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-400" />
              )}
            </div>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-medium">Active Errors</p>
              <p className="text-3xl font-light text-red-400">{errorCount}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-medium">Warnings</p>
              <p className="text-3xl font-light text-yellow-400">{warningCount}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-medium">Last Heartbeat</p>
              <p className="text-lg font-light text-white">
                {lastHeartbeat ? formatDistanceToNow(new Date(lastHeartbeat.timestamp), { addSuffix: true }) : 'Never'}
              </p>
            </div>
            <div className={`p-3 rounded-xl group-hover:scale-110 transition-transform duration-200 ${
              lastHeartbeat ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' : 'bg-gradient-to-br from-gray-500/20 to-gray-600/20'
            }`}>
              <Activity className={`w-8 h-8 ${lastHeartbeat ? 'text-green-400' : 'text-gray-500'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-8">
        <h2 className="text-2xl font-light text-white mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {recentChecks.map((check) => {
            const Icon = checkTypeIcons[check.check_type as keyof typeof checkTypeIcons] || Activity
            const StatusIcon = statusIcons[check.status as keyof typeof statusIcons]
            
            return (
              <div key={check.id} className="glass-card p-5 hover:bg-white/5 transition-all duration-200">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-white capitalize">
                        {check.check_type.replace('_', ' ')}
                      </span>
                      <StatusIcon className={`w-4 h-4 ${statusColors[check.status as keyof typeof statusColors]}`} />
                      {check.resolved && (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-medium">RESOLVED</span>
                      )}
                    </div>
                    
                    {check.details && (
                      <p className="text-sm text-gray-400 font-light leading-relaxed">
                        {typeof check.details === 'string' 
                          ? check.details 
                          : JSON.stringify(check.details).slice(0, 100) + '...'
                        }
                      </p>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-400 font-mono">
                    {format(new Date(check.timestamp), 'MMM dd, HH:mm')}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detailed Log */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-light text-white">System Log</h2>
          <select
            className="glass-input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            {checkTypes.map(type => (
              <option key={type} value={type}>
                {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-6 font-medium text-gray-400">Timestamp</th>
                <th className="text-left py-4 px-6 font-medium text-gray-400">Type</th>
                <th className="text-left py-4 px-6 font-medium text-gray-400">Status</th>
                <th className="text-left py-4 px-6 font-medium text-gray-400">Details</th>
                <th className="text-left py-4 px-6 font-medium text-gray-400">Resolved</th>
              </tr>
            </thead>
            <tbody>
              {filteredChecks.map((check) => {
                const Icon = checkTypeIcons[check.check_type as keyof typeof checkTypeIcons] || Activity
                const StatusIcon = statusIcons[check.status as keyof typeof statusIcons]
                
                return (
                  <tr key={check.id} className="border-b border-white/5 hover:bg-white/5 transition-all duration-200">
                    <td className="py-4 px-6 text-gray-300 font-mono text-sm">
                      {format(new Date(check.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4 text-indigo-400" />
                        <span className="text-white capitalize font-medium">{check.check_type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`w-4 h-4 ${statusColors[check.status as keyof typeof statusColors]}`} />
                        <span className={`capitalize font-medium ${statusColors[check.status as keyof typeof statusColors]}`}>
                          {check.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 max-w-md">
                      <div className="text-gray-300 text-sm font-light leading-relaxed truncate">
                        {check.details 
                          ? (typeof check.details === 'string' 
                              ? check.details 
                              : JSON.stringify(check.details, null, 2)
                            )
                          : '—'
                        }
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {check.resolved ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredChecks.length === 0 && (
        <div className="text-center py-16">
          <div className="glass-card p-12 max-w-md mx-auto">
            <Activity className="w-16 h-16 text-gray-600 mx-auto mb-6" />
            <p className="text-gray-400 text-lg font-light">No system health data found.</p>
          </div>
        </div>
      )}
    </div>
  )
}