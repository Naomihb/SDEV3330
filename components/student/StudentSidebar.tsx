'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/student/dashboard',   icon: '⊞', label: 'Dashboard'      },
  { href: '/student/activity',    icon: '✦', label: 'Weekly activity' },
  { href: '/student/learn',       icon: '◎', label: 'Learn'           },
  { href: '/student/team',        icon: '⚇', label: 'My team'         },
  { href: '/student/sprint-board',icon: '☰', label: 'Sprint board'    },
  { href: '/student/backlog',     icon: '≣', label: 'Backlog'         },
  { href: '/student/submissions', icon: '⊡', label: 'Submissions'     },
]

export default function StudentSidebar() {
  const path = usePathname()
  return (
    <aside className="w-52 border-r border-gray-200 bg-white flex flex-col py-4 shrink-0">
      <nav className="flex-1 px-3 space-y-0.5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">Navigation</p>
        {NAV.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              path === item.href
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}>
            <span className="text-base shrink-0">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
