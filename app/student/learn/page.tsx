'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import DemoLearnTab from '@/components/demo/DemoLearnTab'

export default function LearnPage() {
  const [weekNumber, setWeekNumber] = useState(1)
  useEffect(() => {
    createClient().from('weeks').select('week_number').eq('is_active', true).single()
      .then(({ data }: { data: { week_number: number } | null }) => { if (data) setWeekNumber(data.week_number) })
  }, [])
  return <