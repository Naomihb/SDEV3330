// DEMO STUB — Anthropic SDK removed for demo mode.
// Restore the real implementation from SETUP.md when connecting the AI API.
//
// import Anthropic from '@anthropic-ai/sdk'
// const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

import type { TeamMember, Week } from '@/lib/types'

export async function generateScenario({
  week,
  team,
  projectName,
}: {
  week: Week
  team: TeamMember[]
  projectName: string
  projectDescription: string
}): Promise<string> {
  // In production, this calls Claude to generate a unique scenario.
  // For demo mode, return a placeholder.
  const member = team[0]?.name ?? 'your team lead'
  return `[AI scenario for Week ${week.week_number}: ${week.topic} on ${projectName} will appear here. ${member} has raised a concern that you need to address as Scrum Master.]`
}
