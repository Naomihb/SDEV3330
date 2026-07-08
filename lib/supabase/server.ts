import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Server-side client — uses anon key, relies on RLS
// Pass the user's JWT from the Authorization header to scope queries correctly
export function createClient(accessToken?: string) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    accessToken
      ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
      : {}
  )
}

// Service-role client — bypasses RLS, for trusted server operations only
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
