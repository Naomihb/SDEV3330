'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import DemoLearnTab from '@/components/demo/DemoLearnTab'
import { resolveCurrentWeek, type WeekRow } from '@/lib/weeks'

export default function LearnPage() {
  const [weekNumber, setWeekNumber] = useState(1)
  useEffect(() => {
    createClient().from('weeks').select('*')
      .then(({ data }: { data: WeekRow[] | null }) => {
        const current = resolveCurrentWeek(data ?? [])
        if (current) setWeekNumber(current.week_number)
      })
  }, [])
  return <DemoLearnTab weekNumber={weekNumber} />
}
