import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * Maps each account to the first letter of the address it signed up with, which is
 * what labels the two pens.
 *
 * This has to run server-side: the anon key can only ever read the *current* user's
 * identity, so the other person's initial is unreachable from the browser. The service
 * role key can list users, but must never reach the client — so the response carries
 * only `{ id, initial }`, never the addresses themselves.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return Response.json({ error: 'Server is missing Supabase credentials' }, { status: 500 })
  }

  // Only signed-in callers — this describes who shares the book
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const admin = createAdminClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 })
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const people = data.users
    .map((account) => {
      const email = account.email?.trim() ?? ''
      return email ? { id: account.id, initial: email[0].toUpperCase() } : null
    })
    .filter((person): person is { id: string; initial: string } => person !== null)

  return Response.json(
    { people },
    // Initials change only when an account is created, so a short cache is plenty
    { headers: { 'Cache-Control': 'private, max-age=300' } }
  )
}
