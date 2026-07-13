import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

// Typed as SupabaseClient<any> so table operations accept plain objects without generated DB types

// Server-side client — uses anon key, relies on RLS
// Pass the user's JWT from the Authorization header to scope queries correctly
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(accessToken?: string): SupabaseClient<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createSupabaseClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    accessToken
      ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
      : {}
  )
}

// Service-role client — bypasses RLS, for trusted server operations only
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createServiceClient(): SupabaseClient<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createSupabaseClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
