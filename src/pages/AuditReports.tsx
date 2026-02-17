import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AuditLog } from '../lib/supabase'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { FileText, TrendingUp, AlertTriangle, CheckCircle, Calendar, Sparkles } from 'lucide-react'
import { format } from 'date-fns'

interface Finding {
  category: string
  severity: 'low' | 'medium' | 'high'
  finding: string
  recommendation: string
}

const severityColors = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400'
}

const severityBgColors = {
  low: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
  medium: 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20',
  high: 'bg-gradient-to-br from-red-500/20 to-red-600/20'
}

export function AuditReports() {
  const [audits, setAudits] = useState<AuditLog[]>([])
  const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAudits()
  }, [])

  const loadAudits = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('timestamp', { ascending: false })
      
      if (error) throw error
      setAudits(data || [])
      if (data && data.length > 0) {
        setSelectedAudit(data[0])
      }
    } catch (error) {
      console.error('Error loading audits:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="glass-card p-8">
          <div className="flex items-center space-x-3 text-gray-300">
            <div className="animate-spin">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="font-medium">Loading audit reports...</span>
          </div>
        </div>
      </div>
    )
  }

  const parseFindings = (findings: any): Finding[] => {
    if (typeof findings === 'string') {
      try {
        return JSON.parse(findings)
      } catch {
        return []
      }
    }
    return Array.isArray(findings) ? findings : []
  }

  const allFindings = audits.flatMap(audit => parseFindings(audit.findings))
  const findingsBySeverity = allFindings.reduce((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-light text-white">Audit Reports</h1>
        <p className="text-gray-400 text-lg font-light">Security and compliance audit findings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-medium">Total Audits</p>
              <p className="text-3xl font-light text-white">{audits.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <FileText className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-medium">High Severity</p>
              <p className="text-3xl font-light text-red-400">{findingsBySeverity.high || 0}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-medium">Medium Severity</p>
              <p className="text-3xl font-light text-yellow-400">{findingsBySeverity.medium || 0}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <TrendingUp className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="metric-card group">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-medium">Low Severity</p>
              <p className="text-3xl font-light text-green-400">{findingsBySeverity.low || 0}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Audit List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Audit List */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-light text-white mb-6">Recent Audits</h3>
          <div className="space-y-3">
            {audits.map((audit) => (
              <div
                key={audit.id}
                className={`glass-card p-4 cursor-pointer transition-all duration-200 hover:bg-white/10 ${
                  selectedAudit?.id === audit.id ? 'ring-2 ring-indigo-500/50' : ''
                }`}
                onClick={() => setSelectedAudit(audit)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">
                    {audit.audit_type?.replace('_', ' ').toUpperCase() || 'GENERAL'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {format(new Date(audit.timestamp), 'MMM dd')}
                  </span>
                </div>
                <p className="text-sm text-gray-400 font-light">
                  {parseFindings(audit.findings).length} findings
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Details */}
        <div className="lg:col-span-2">
          {selectedAudit ? (
            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-light text-white">
                    {selectedAudit.audit_type?.replace('_', ' ').toUpperCase() || 'AUDIT REPORT'}
                  </h3>
                  <p className="text-gray-400">
                    {format(new Date(selectedAudit.timestamp), 'MMMM dd, yyyy')}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl">
                  <FileText className="w-8 h-8 text-indigo-400" />
                </div>
              </div>

              <div className="space-y-6">
                {parseFindings(selectedAudit.findings).map((finding, index) => (
                  <div key={index} className="glass-card p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-xl ${severityBgColors[finding.severity]}`}>
                        <AlertTriangle className={`w-5 h-5 ${severityColors[finding.severity]}`} />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-medium text-white">{finding.category}</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium glass-card ${severityColors[finding.severity]}`}>
                            {finding.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-300 font-light leading-relaxed">{finding.finding}</p>
                        <div className="glass-card p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
                          <h5 className="text-sm font-medium text-blue-400 mb-2">Recommendation</h5>
                          <p className="text-sm text-gray-300 font-light">{finding.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {parseFindings(selectedAudit.findings).length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg font-light">No findings in this audit.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-6" />
              <p className="text-gray-400 text-lg font-light">Select an audit to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}