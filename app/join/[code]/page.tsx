'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function JoinPage() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string
  const [status, setStatus] = useState<'checking' | 'joining' | 'done' | 'error'>('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function join() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/login?next=/join/${code}`)
        return
      }

      setStatus('joining')
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch(`/api/join/${code}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })

      const json = await res.json()

      if (res.ok || json.error === 'Already enrolled') {
        setStatus('done')
        setTimeout(() => router.push('/student/dashboard'), 1000)
      } else {
        setStatus('error')
        setMessage(json.error ?? 'Something went wrong')
      }
    }
    join()
  }, [code, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center w-80 space-y-3">
        <h1 className="font-semibold text-gray-900 text-lg">SprintSim</h1>
        <p className="text-sm text-gray-500">CS 3330 · Fall 2026</p>
        <div className="pt-2">
          {status === 'checking' || status === 'joining' ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">{status === 'checking' ? 'Checking your account…' : 'Enrolling you in the course…'}</p>
            </div>
          ) : status === 'done' ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">✓</span>
              <p className="text-sm text-emerald-600 font-medium">You're in! Redirecting…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">✗</span>
              <p className="text-sm text-red-500">{message}</p>
              <a href="/login" className="text-xs text-indigo-600 underline">Go to login</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
