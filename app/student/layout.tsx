'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import StudentSidebar from '@/components/student/StudentSidebar'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }: { data: { user: unknown } }) => {
      if (!data.user) router.push('/login')
      else setReady(true)
    })
  }, [router])

  if (!ready) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900">SprintSim</span>
          <span className="text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5">CS 3330 · Fall 2026</span>
        </div>
        <button onClick={() => { createClient().auth.signOut().then(() => router.push('/login')) }}
          className="text-xs text-gray-400 hover:text-gray-700">Sign out</button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <StudentSidebar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
