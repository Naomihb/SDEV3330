'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ClaimInstructorPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function claim(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login?next=/instructor/claim')
      return
    }
    const res = await fetch('/api/instructor/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ code: code.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      router.push('/instructor/dashboard')
    } else {
      setError(data.error ?? `Error ${res.status}`)
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Instructor access</h1>
        <p className="text-sm text-gray-500 mb-5">
          Enter the instructor code you were given. You must be signed in first —
          if you just signed up, you&apos;re all set.
        </p>
        <form onSubmit={claim} className="space-y-4">
          <input
            type="password" required value={code} onChange={e => setCode(e.target.value)}
            placeholder="Instructor code"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder-gray-300" />
          {error && <p className="text-xs bg-red-50 text-red-600 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={busy || !code.trim()}
            className="w-full bg-indigo-600 text-white text-sm font-medium rounded-lg py-2 hover:bg-indigo-700 disabled:opacity-40 transition-colors">
            {busy ? 'Checking…' : 'Become instructor'}
          </button>
        </form>
      </div>
    </div>
  )
}
