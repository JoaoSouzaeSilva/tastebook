import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const source = process.env.KEEPALIVE_SOURCE ?? 'github-actions'
const runId = process.env.GITHUB_RUN_ID ?? null
const repository = process.env.GITHUB_REPOSITORY ?? null
const now = new Date().toISOString()

const { data, error } = await supabase
  .from('app_keepalive_heartbeats')
  .upsert(
    {
      id: 'supabase-free-plan-heartbeat',
      source,
      last_seen_at: now,
      metadata: {
        repository,
        run_id: runId,
        triggered_at: now,
      },
    },
    {
      onConflict: 'id',
    }
  )
  .select()
  .single()

if (error) {
  throw error
}

console.log(`Heartbeat recorded at ${data.last_seen_at}`)
