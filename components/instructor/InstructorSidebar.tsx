'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/instructor/dashboard', icon: '⊞', label: 'Dashboard' },
  { href: '/instructor/weeks',     icon: '📅', label: 'Manage weeks' },
]

export default function InstructorSidebar() {
  const path = usePathname()
  return (
    <aside className="w-52 border-r border-gray-200 bg-white flex flex-col py-4 shrink-0">
      <nav className="flex-1 px-3 space-y-0.5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">Instructor</p>
        {NAV.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              path.startsWith(item.href)
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}>
            <span className="text-base shrink-0">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="px-5 py-3 border-t border-gray-100">
        <Link href="/demo/instructor" className="text-xs text-violet-600 hover:underline">View demo →</Link>
      </div>
    </aside>
  )
}
