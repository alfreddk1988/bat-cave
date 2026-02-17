import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { SystemHealth as SystemHealthType } from '../lib/supabase'
import { Activity, AlertTriangle, CheckCircle, Clock, Settings, Zap } from 'lucide-react'
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
        <div className="text-gray-400">Loading system health data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">System Health</h1>
        <p className="text-gray-400">Monitor Alfred's heartbeat and system status</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">System Status</p>
              <p className={`text-2xl font-bold ${errorCount > 0 ? 'text-red-500' : warningCount > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                {errorCount > 0 ? 'Error' : warningCount > 0 ? 'Warning' : 'Healthy'}
              </p>
            </div>
            {errorCount > 0 ? (
              <AlertTriangle className="w-8 h-8 text-red-500" />
            ) : warningCount > 0 ? (
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-500" />
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Errors</p>
              <p className="text-2xl font-bold text-red-500">{errorCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Warnings</p>
              <p className="text-2xl font-bold text-yellow-500">{warningCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Last Heartbeat</p>
              <p className="text-lg font-bold text-white">
                {lastHeartbeat ? formatDistanceToNow(new Date(lastHeartbeat.timestamp), { addSuffix: true }) : 'Never'}
              </p>
            </div>
            <Activity className={`w-8 h-8 ${lastHeartbeat ? 'text-green-500' : 'text-gray-500'}`} />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentChecks.map((check) => {
            const Icon = checkTypeIcons[check.check_type as keyof typeof checkTypeIcons] || Activity
            const StatusIcon = statusIcons[check.status as keyof typeof statusIcons]
            
            return (
              <div key={check.id} className="flex items-center space-x-4 p-3 bg-gray-900 rounded-lg">
                <div className="flex-shrink-0">
                  <Icon className="w-5 h-5 text-amber-500" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-white capitalize">
                      {check.check_type.replace('_', ' ')}
                    </span>
                    <StatusIcon className={`w-4 h-4 ${statusColors[check.status as keyof typeof statusColors]}`} />
                    {check.resolved && (
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">RESOLVED</span>
                    )}
                  </div>
                  
                  {check.details && (
                    <p className="text-sm text-gray-400 mt-1">
                      {typeof check.details === 'string' 
                        ? check.details 
                        : JSON.stringify(check.details).slice(0, 100) + '...'
                      }
                    </p>
                  )}
                </div>
                
                <div className="text-sm text-gray-400">
                  {format(new Date(check.timestamp), 'MMM dd, HH:mm')}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detailed Log */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">System Log</h2>
          <select
            className="input-field"
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
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-400">Timestamp</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Details</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Resolved</th>
              </tr>
            </thead>
            <tbody>
              {filteredChecks.map((check) => {
                const Icon = checkTypeIcons[check.check_type as keyof typeof checkTypeIcons] || Activity
                const StatusIcon = statusIcons[check.status as keyof typeof statusIcons]
                
                return (
                  <tr key={check.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-gray-300">
                      {format(new Date(check.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4 text-amber-500" />
                        <span className="text-white capitalize">{check.check_type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`w-4 h-4 ${statusColors[check.status as keyof typeof statusColors]}`} />
                        <span className={`capitalize ${statusColors[check.status as keyof typeof statusColors]}`}>
                          {check.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <div className="text-gray-300 text-sm truncate">
                        {check.details 
                          ? (typeof check.details === 'string' 
                              ? check.details 
                              : JSON.stringify(check.details, null, 2)
                            )
                          : '—'
                        }
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {check.resolved ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
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
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No system health data found.</p>
        </div>
      )}
    </div>
  )
}