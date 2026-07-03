import { redirect } from 'next/navigation'

// Demo mode: redirect root to demo landing.
// Restore the Supabase version from SETUP.md when the DB is connected.
export default async function RootPage() {
  redirect('/demo')
}
