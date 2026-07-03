'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV = [
  { href: '/student/dashboard',    icon: '⊞', label: 'Dashboard' },
  { href: '/student/activity',     icon: '✦', label: 'Weekly activity' },
  { href: '/student/team',         icon: '⚇', label: 'My team' },
  { href: '/student/sprint-board', icon: '☰', label: 'Sprint board' },
  { href: '/student/submissions',  icon: '⊡', label: 'Submissions' },
]

export default function StudentSidebar({ projectName }: { projectName: string | null }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-52 border-r border-gray-200 bg-white flex flex-col py-4 shrink-0">
      <nav className="flex-1 px-3 space-y-0.5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">Navigation</p>
        {NAV.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              pathname === href
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className="text-base">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      {projectName && (
        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">My project</p>
          <p className="text-sm font-medium text-gray-800">{projectName}</p>
        </div>
      )}

      <div className="px-3 pt-3 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">Tools</p>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900">
          <span>⌥</span> GitHub repo
        </a>
        <a href="https://atlassian.net" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900">
          <span>↗</span> Jira board
        </a>
        <button onClick={signOut} className="w-full text-left flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 mt-2">
          <span>→</span> Sign out
        </button>
      </div>
    </aside>
  )
}
