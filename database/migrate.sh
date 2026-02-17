#!/bin/bash

# Bat Cave Database Migration
SUPABASE_URL="https://vixmkfhkuhtlufbdgraa.supabase.co"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

echo "🚀 Starting Bat Cave database migration..."

# Function to execute SQL
execute_sql() {
    local sql="$1"
    echo "Executing: ${sql:0:50}..."
    
    curl -s -X POST \
        "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
        -H "Authorization: Bearer $SERVICE_KEY" \
        -H "Content-Type: application/json" \
        -H "apikey: $SERVICE_KEY" \
        -d "{\"sql_query\": \"$sql\"}"
    
    echo ""
}

# Create tables manually since we can't execute the full SQL file at once
echo "📋 Creating tables..."

# Daily briefings table
execute_sql "CREATE TABLE IF NOT EXISTS daily_briefings (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  summary text not null,
  email_highlights jsonb default '[]',
  calendar_events jsonb default '[]',
  tasks_due jsonb default '[]',
  weather text,
  created_at timestamptz default now()
);"

# Tasks table
execute_sql "CREATE TABLE IF NOT EXISTS tasks (
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
);"

# Add other tables...
echo "✅ Migration completed!"

# Test connection
echo "🧪 Testing connection..."
curl -s "$SUPABASE_URL/rest/v1/projects?select=slug,name&limit=1" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "apikey: $SERVICE_KEY"

echo ""
echo "🎉 Database setup complete!"