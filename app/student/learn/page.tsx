'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import DemoLearnTab from '@/components/demo/DemoLearnTab'

export default function LearnPage() {
  const [weekNumber, setWeekNumber] = useState(1)
  useEffect(() => {
    createClient().from('weeks').select('week_number').eq('is_active', true)
      .order('week_number', { ascending: false }).limit(1)
      .then(({ data }: { data: { week_number: number }[] | null }) => { if (data?.[0]) setWeekNumber(data[0].week_number) })
  }, [])
  return <DemoLearnTab weekNumber={weekNumber} />
}
