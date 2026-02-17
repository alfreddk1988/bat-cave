import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface DailyBriefing {
  id: string
  date: string
  summary: string
  email_highlights: any[]
  calendar_events: any[]
  tasks_due: any[]
  weather?: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'blocked' | 'done' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  project?: string
  due_date?: string
  source?: string
  notes?: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface TokenUsage {
  id: string
  timestamp: string
  session_type: string
  model: string
  input_tokens: number
  output_tokens: number
  estimated_cost: number
  task_description?: string
  session_key?: string
}

export interface TokenDailySummary {
  id: string
  date: string
  total_cost: number
  opus_cost: number
  sonnet_cost: number
  haiku_cost: number
  total_input_tokens: number
  total_output_tokens: number
  session_count: number
  recommendations?: string
  created_at: string
}

export interface MemoryLog {
  id: string
  timestamp: string
  category: string
  title: string
  content: string
  project?: string
  importance: 'low' | 'normal' | 'high' | 'critical'
  tags: string[]
}

export interface SystemHealth {
  id: string
  timestamp: string
  check_type: string
  status: 'ok' | 'warning' | 'error'
  details?: any
  resolved: boolean
}

export interface AuditLog {
  id: string
  timestamp: string
  auditor: string
  findings: any
  overall_score?: number
  action_items: any[]
}

export interface Project {
  id: string
  slug: string
  name: string
  status: string
  description?: string
  key_dates: any
  contacts: any[]
  notes?: string
  updated_at: string
}