import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = 'https://vixmkfhkuhtlufbdgraa.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function migrate() {
  try {
    console.log('Reading schema.sql...')
    const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8')
    
    console.log('Executing migration...')
    
    // Split the SQL into individual statements and execute them
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim()
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`)
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
          if (error) {
            console.warn(`Warning on statement ${i + 1}:`, error.message)
          }
        } catch (err) {
          console.warn(`Error on statement ${i + 1}:`, err.message)
        }
      }
    }
    
    console.log('Migration completed!')
    
    // Test the connection by fetching some data
    console.log('Testing connection...')
    const { data: projects, error } = await supabase.from('projects').select('*').limit(5)
    if (error) {
      console.error('Error testing connection:', error)
    } else {
      console.log('✅ Connection test successful! Found', projects.length, 'projects')
    }
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrate()