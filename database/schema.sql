-- Bat Cave Database Schema

-- Enable RLS on all tables
ALTER DATABASE postgres SET "app.jwt_claims_admin_email" = 'alfreddk1988@gmail.com';

-- Daily briefings table
CREATE TABLE IF NOT EXISTS daily_briefings (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  summary text not null,
  email_highlights jsonb default '[]',
  calendar_events jsonb default '[]',
  tasks_due jsonb default '[]',
  weather text,
  created_at timestamptz default now()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending','in_progress','blocked','done','cancelled')),
  priority text default 'medium' check (priority in ('low','medium','high','urgent')),
  project text,
  due_date timestamptz,
  source text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

-- Token usage table
CREATE TABLE IF NOT EXISTS token_usage (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz default now(),
  session_type text not null,
  model text not null,
  input_tokens int default 0,
  output_tokens int default 0,
  estimated_cost numeric(10,4) default 0,
  task_description text,
  session_key text
);

-- Token daily summary table
CREATE TABLE IF NOT EXISTS token_daily_summary (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  total_cost numeric(10,4) default 0,
  opus_cost numeric(10,4) default 0,
  sonnet_cost numeric(10,4) default 0,
  haiku_cost numeric(10,4) default 0,
  total_input_tokens int default 0,
  total_output_tokens int default 0,
  session_count int default 0,
  recommendations text,
  created_at timestamptz default now()
);

-- Memory log table
CREATE TABLE IF NOT EXISTS memory_log (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz default now(),
  category text not null,
  title text not null,
  content text not null,
  project text,
  importance text default 'normal' check (importance in ('low','normal','high','critical')),
  tags text[] default '{}'
);

-- System health table
CREATE TABLE IF NOT EXISTS system_health (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz default now(),
  check_type text not null,
  status text not null,
  details jsonb,
  resolved boolean default false
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz default now(),
  auditor text default 'bat-cave-auditor',
  findings jsonb not null,
  overall_score int,
  action_items jsonb default '[]'
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  status text default 'active',
  description text,
  key_dates jsonb default '{}',
  contacts jsonb default '[]',
  notes text,
  updated_at timestamptz default now()
);

-- Enable Row Level Security
ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies for service role (Alfred's API writes)
CREATE POLICY "Service role can do everything on daily_briefings" ON daily_briefings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can do everything on tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can do everything on token_usage" ON token_usage FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can do everything on token_daily_summary" ON token_daily_summary FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can do everything on memory_log" ON memory_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can do everything on system_health" ON system_health FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can do everything on audit_log" ON audit_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can do everything on projects" ON projects FOR ALL USING (true) WITH CHECK (true);

-- Create policies for authenticated users (Dashboard reads/writes)
CREATE POLICY "Authenticated users can read daily_briefings" ON daily_briefings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read and write tasks" ON tasks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read token_usage" ON token_usage FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read token_daily_summary" ON token_daily_summary FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read and write memory_log" ON memory_log FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read system_health" ON system_health FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read audit_log" ON audit_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read and write projects" ON projects FOR ALL USING (auth.role() = 'authenticated');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE token_usage;
ALTER PUBLICATION supabase_realtime ADD TABLE system_health;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_briefings;

-- Insert seed data for projects
INSERT INTO projects (slug, name, status, description) VALUES
('h-street', 'H Street Digital', 'active', 'Full-service digital marketing agency'),
('flf', 'Feels Like Friday', 'active', 'Creative side agency specializing in branding and web design'),
('aunyx', 'Aunyx Labs', 'active', 'AI/ML startup focused on innovative solutions'),
('personal', 'Personal Projects', 'active', 'Personal tasks and initiatives'),
('alfred-setup', 'Alfred Setup & Config', 'active', 'Setting up and configuring Alfred AI assistant')
ON CONFLICT (slug) DO NOTHING;

-- Insert seed data for tasks
INSERT INTO tasks (title, description, status, priority, project, source, notes) VALUES
('Set up Bat Cave dashboard', 'Build React + TypeScript + Tailwind + Supabase dashboard for monitoring Alfred', 'in_progress', 'high', 'alfred-setup', 'dallin', 'Key project for monitoring Alfred''s activity and performance'),
('Review H Street client proposals', 'Go through pending client proposals and provide feedback', 'pending', 'high', 'h-street', 'alfred', 'Three proposals need review by end of week'),
('Update FLF brand guidelines', 'Refresh brand guidelines with new color palette and typography', 'pending', 'medium', 'flf', 'dallin', 'Client feedback incorporated from last review'),
('Research AI model pricing optimization', 'Analyze token usage patterns to optimize costs', 'pending', 'medium', 'alfred-setup', 'alfred', 'Current spend trending higher than expected'),
('Plan Aunyx Labs product roadmap', 'Define Q2 product priorities and development timeline', 'blocked', 'high', 'aunyx', 'dallin', 'Waiting on technical feasibility assessment')
ON CONFLICT DO NOTHING;

-- Insert seed data for token usage
INSERT INTO token_usage (session_type, model, input_tokens, output_tokens, estimated_cost, task_description, timestamp) VALUES
('main', 'sonnet', 2500, 800, 0.0234, 'Building Bat Cave dashboard project setup', now() - interval '2 hours'),
('heartbeat', 'haiku', 150, 50, 0.0012, 'Checking email and calendar updates', now() - interval '1 hour'),
('main', 'opus', 3200, 1200, 0.0876, 'Complex reasoning about project architecture', now() - interval '30 minutes'),
('cron', 'haiku', 200, 75, 0.0015, 'Daily briefing generation', now() - interval '3 hours')
ON CONFLICT DO NOTHING;

-- Insert seed data for token daily summary
INSERT INTO token_daily_summary (date, total_cost, opus_cost, sonnet_cost, haiku_cost, total_input_tokens, total_output_tokens, session_count, recommendations) VALUES
(CURRENT_DATE, 12.45, 8.76, 2.34, 1.35, 15000, 5500, 25, 'Consider using more Haiku for simple tasks to reduce costs'),
(CURRENT_DATE - 1, 8.92, 5.20, 2.50, 1.22, 12000, 4200, 18, 'Good optimization today, costs down 15% from yesterday'),
(CURRENT_DATE - 2, 15.67, 11.20, 3.15, 1.32, 18500, 6800, 32, 'High usage day due to complex project work, within expected range')
ON CONFLICT DO NOTHING;

-- Insert seed data for memory log
INSERT INTO memory_log (category, title, content, project, importance, tags) VALUES
('decision', 'Chose React + TypeScript for Bat Cave', 'Decided on React with TypeScript for the dashboard due to type safety, good Supabase integration, and Dallin''s familiarity', 'alfred-setup', 'high', '{"tech-stack", "dashboard", "architecture"}'),
('lesson', 'Heartbeat frequency optimization', 'Found that checking email every 15 minutes was too aggressive. Reduced to 30-45 minutes for better balance of responsiveness vs. cost', 'alfred-setup', 'normal', '{"optimization", "costs", "heartbeat"}'),
('insight', 'H Street client communication patterns', 'Clients prefer morning updates (8-10 AM) and brief status reports rather than detailed technical explanations', 'h-street', 'normal', '{"client-management", "communication"}'),
('preference', 'Dallin''s work schedule', 'Most productive in mornings (7-11 AM), prefers quick decisions over long deliberations, values clear action items', 'personal', 'high', '{"work-style", "preferences"}'
)
ON CONFLICT DO NOTHING;

-- Insert seed data for system health
INSERT INTO system_health (check_type, status, details) VALUES
('heartbeat', 'ok', '{"last_check": "2026-02-16T23:30:00Z", "response_time": 0.5, "services_checked": ["email", "calendar", "slack"]}'),
('cron_run', 'ok', '{"job": "daily_briefing", "duration": 2.3, "completed_at": "2026-02-16T08:00:00Z"}'),
('error', 'resolved', '{"error": "Supabase connection timeout", "resolved_at": "2026-02-16T14:30:00Z", "solution": "Increased timeout from 5s to 10s"}')
ON CONFLICT DO NOTHING;

-- Insert seed data for audit log
INSERT INTO audit_log (findings, overall_score, action_items) VALUES
('{"findings": [{"category": "cost_optimization", "severity": "medium", "finding": "Token usage 15% above budget target", "recommendation": "Increase use of Haiku model for simple tasks"}, {"category": "task_management", "severity": "low", "finding": "3 tasks overdue by more than 2 days", "recommendation": "Implement deadline reminder system"}]}', 7, '["Optimize model selection for routine tasks", "Set up task deadline notifications", "Review weekly spending patterns"]'),
('{"findings": [{"category": "system_performance", "severity": "low", "finding": "Average response time within normal range", "recommendation": "Continue current configuration"}, {"category": "security", "severity": "low", "finding": "All API keys properly secured", "recommendation": "Schedule quarterly security review"}]}', 8, '["Maintain current performance monitoring", "Schedule Q2 security audit"]')
ON CONFLICT DO NOTHING;

-- Insert seed data for daily briefings
INSERT INTO daily_briefings (date, summary, email_highlights, calendar_events, tasks_due, weather) VALUES
(CURRENT_DATE, 'Good morning! Today''s focus: Continue building the Bat Cave dashboard and review H Street client proposals. Weather looks clear for any outdoor meetings.', 
'[{"from": "client@hstreetdigital.co", "subject": "Proposal feedback", "priority": "high"}, {"from": "team@aunyx.com", "subject": "Sprint planning", "priority": "medium"}]',
'[{"time": "10:00 AM", "title": "H Street team standup", "location": "Zoom"}, {"time": "2:00 PM", "title": "Client check-in call", "location": "Office"}]',
'[{"title": "Review H Street client proposals", "due": "today", "priority": "high"}, {"title": "Update FLF brand guidelines", "due": "tomorrow", "priority": "medium"}]',
'Clear skies, 72°F, light breeze from the west')
ON CONFLICT DO NOTHING;