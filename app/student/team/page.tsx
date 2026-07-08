import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const ROLE_LABELS: Record<string, string> = {
  senior_dev: 'Senior developer', junior_dev: 'Junior developer',
  designer: 'Designer', qa_lead: 'QA lead', mid_dev: 'Mid-level developer',
}

export default async function TeamPage() {
  const supabase = createServiceClient()
  const cookieStore = cookies()
  // Get user id from cookie (Supabase sets sb-<ref>-auth-token)
  // We rely on client auth for identity here — fetch team via service client keyed by session
  // For server rendering, return the shell; team data is fetched client-side
  return <TeamClient />
}

// We make this a simple server page that delegates to a client component
function TeamClient() {
  return (
    <div id="team-root">
      <TeamLoader />
    </div>
  )
}

// Since we can't get user on server without SSR helper, use a client component
import TeamLoaderClient from '@/components/student/TeamLoader'
function TeamLoader() { return <TeamLoaderClient /> }
