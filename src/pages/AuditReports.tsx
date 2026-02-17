import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AuditLog } from '../lib/supabase'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { FileText, TrendingUp, AlertTriangle, CheckCircle, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface Finding {
  category: string
  severity: 'low' | 'medium' | 'high'
  finding: string
  recommendation: string
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
    } catch (error) {
      console.error('Error loading audits:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate trend data for score chart
  const scoreData = audits
    .filter(audit => audit.overall_score !== null)
    .reverse()
    .map(audit => ({
      date: audit.timestamp,
      score: audit.overall_score,
      dateFormatted: format(new Date(audit.timestamp), 'MMM dd')
    }))

  // Get latest score and calculate trend
  const latestScore = audits.find(audit => audit.overall_score !== null)?.overall_score || 0
  const previousScore = audits
    .filter(audit => audit.overall_score !== null)
    .slice(1, 2)[0]?.overall_score || latestScore
  const scoreTrend = latestScore - previousScore

  // Analyze findings by category and severity
  const allFindings: Finding[] = audits.flatMap(audit => 
    Array.isArray(audit.findings?.findings) ? audit.findings.findings : []
  )

  const findingsBySeverity = allFindings.reduce((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const severityColors = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-red-400'
  }

  const severityBgColors = {
    low: 'bg-green-900 border-green-600',
    medium: 'bg-yellow-900 border-yellow-600',
    high: 'bg-red-900 border-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading audit reports...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Audit Reports</h1>
        <p className="text-gray-400">Performance insights and recommendations from Alfred's auditor</p>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Latest Score</p>
              <div className="flex items-center space-x-2">
                <p className={`text-3xl font-bold ${latestScore >= 8 ? 'text-green-500' : latestScore >= 6 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {latestScore}/10
                </p>
                {scoreTrend !== 0 && (
                  <div className={`flex items-center space-x-1 ${scoreTrend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <TrendingUp className={`w-4 h-4 ${scoreTrend < 0 ? 'rotate-180' : ''}`} />
                    <span className="text-sm">{scoreTrend > 0 ? '+' : ''}{scoreTrend}</span>
                  </div>
                )}
              </div>
            </div>
            <FileText className="w-8 h-8 text-amber-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Audits</p>
              <p className="text-2xl font-bold text-white">{audits.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">High Priority Issues</p>
              <p className="text-2xl font-bold text-red-400">{findingsBySeverity.high || 0}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Action Items</p>
              <p className="text-2xl font-bold text-white">
                {audits.reduce((sum, audit) => sum + (audit.action_items?.length || 0), 0)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Score Trend */}
        <div className="card col-span-2">
          <h3 className="text-lg font-semibold mb-4">Performance Score Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreData}>
                <XAxis 
                  dataKey="dateFormatted"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 10]}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px', color: '#F9FAFB' }}
                  formatter={(value: any) => [`${value || 0}/10`, 'Score']}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B', strokeWidth: 0, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Findings Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Findings by Severity</h3>
          <div className="space-y-3">
            {Object.entries(findingsBySeverity).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${severity === 'high' ? 'bg-red-500' : severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="text-gray-300 capitalize">{severity}</span>
                </div>
                <span className={`font-bold ${severityColors[severity as keyof typeof severityColors]}`}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit List */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recent Audits</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {audits.map((audit) => (
                <div
                  key={audit.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedAudit?.id === audit.id
                      ? 'bg-amber-500/20 border border-amber-500'
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedAudit(audit)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">
                      {format(new Date(audit.timestamp), 'MMM dd, yyyy')}
                    </span>
                    {audit.overall_score && (
                      <span className={`text-sm font-bold ${audit.overall_score >= 8 ? 'text-green-400' : audit.overall_score >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {audit.overall_score}/10
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{audit.auditor}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Details */}
        <div className="col-span-2">
          {selectedAudit ? (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Audit Report - {format(new Date(selectedAudit.timestamp), 'MMM dd, yyyy')}
                </h3>
                {selectedAudit.overall_score && (
                  <div className={`text-2xl font-bold ${selectedAudit.overall_score >= 8 ? 'text-green-400' : selectedAudit.overall_score >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {selectedAudit.overall_score}/10
                  </div>
                )}
              </div>

              {/* Findings */}
              {selectedAudit.findings?.findings && (
                <div className="mb-6">
                  <h4 className="text-md font-medium mb-3">Findings</h4>
                  <div className="space-y-3">
                    {selectedAudit.findings.findings.map((finding: Finding, index: number) => (
                      <div key={index} className={`border rounded-lg p-4 ${severityBgColors[finding.severity]}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">{finding.category.replace('_', ' ')}</span>
                          <span className={`text-sm font-bold uppercase ${severityColors[finding.severity]}`}>
                            {finding.severity}
                          </span>
                        </div>
                        <p className="text-gray-300 mb-2">{finding.finding}</p>
                        <p className="text-sm text-gray-400">
                          <strong>Recommendation:</strong> {finding.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Items */}
              {selectedAudit.action_items && selectedAudit.action_items.length > 0 && (
                <div>
                  <h4 className="text-md font-medium mb-3">Action Items</h4>
                  <ul className="space-y-2">
                    {selectedAudit.action_items.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                        <span className="text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="card h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Select an audit report to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}