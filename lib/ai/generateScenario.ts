import Anthropic from '@anthropic-ai/sdk'
import type { TeamMember, Week } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generateScenario({
  week,
  team,
  projectName,
  projectDescription,
}: {
  week: Week
  team: TeamMember[]
  projectName: string
  projectDescription: string
}): Promise<string> {
  const teamDescription = team
    .map(m => `- ${m.name} (${m.role.replace(/_/g, ' ')}): ${m.personalityLabel}`)
    .join('\n')

  const prompt = `You are generating a realistic team management scenario for a software development course simulation.

CONTEXT:
- Student's project: "${projectName}" — ${projectDescription}
- Week topic: "${week.topic}"
- Week learning focus: "${week.description ?? week.topic}"

TEAM MEMBERS (student is the Scrum Master, these are their NPC teammates):
${teamDescription}

TASK:
Write a single, specific scenario (2–4 sentences) that:
1. Is directly tied to this week's topic (${week.topic})
2. Involves at least two of the named team members by their FULL names (first + last)
3. Presents a realistic management or process challenge the student must respond to
4. Feels personal to this specific team's dynamics (use their personality traits)
5. Ends with a clear implicit question the student must answer as Scrum Master

DO NOT include the question itself — just the scenario. Keep it concrete and grounded in the project context. Write in present or immediate-past tense. No preamble or explanation — output only the scenario text.`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')
  return content.text.trim()
}
