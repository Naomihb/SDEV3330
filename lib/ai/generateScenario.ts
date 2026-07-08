import Anthropic from '@anthropic-ai/sdk'
import type { TeamMember, Week } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Topics students have covered by each week — used to constrain vocabulary
const TOPICS_BY_WEEK: Record<number, string[]> = {
  2:  ['SDLC phases and fundamentals'],
  3:  ['SDLC phases', 'SDLC models (Waterfall, iterative, incremental)'],
  4:  ['SDLC models', 'Agile values and principles', 'the Agile Manifesto'],
  5:  ['Agile', 'Scrum roles, events, and artifacts', 'sprint planning', 'story points', 'velocity'],
  6:  ['Scrum', 'XP', 'Lean', 'Kanban', 'how to choose between methodologies'],
  7:  ['Agile methods', 'requirements elicitation', 'user stories', 'acceptance criteria'],
  8:  ['requirements engineering', 'requirements gaps and recovery'],
  9:  ['requirements', 'SOLID principles', 'software design fundamentals'],
  10: ['design principles', 'architectural styles', 'design patterns'],
  11: ['design patterns', 'code review practices', 'industry tools'],
  12: ['code reviews', 'configuration management', 'dependency management'],
  13: ['config management', 'CI/CD pipelines', 'DevOps integration'],
}

// Vocabulary explicitly OFF-LIMITS before students have learned it
const JARGON_CONSTRAINTS: Record<number, string> = {
  2: `Do NOT use Scrum-specific terms (sprint, backlog, story points, velocity, standup, Scrum Master, retrospective, sprint review). Frame the scenario around general software process decisions — planning, sequencing, team disagreements about how to start a project.`,
  3: `Do NOT use Scrum-specific terms. You may reference Waterfall, Agile, iterative, or incremental as concepts since these are the week's topic, but avoid sprint/backlog/story points.`,
  4: `You may reference Agile values and principles. Do NOT use Scrum-specific ceremony names (sprint planning, daily scrum, retrospective) — the student hasn't formally learned Scrum yet. Frame around team culture, working agreements, and Agile mindset.`,
}

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
    .map(m => `- ${m.name} (${m.role.replace(/_/g, ' ')}, ${m.seniority}): ${m.personalityLabel}`)
    .join('\n')

  const priorTopics = TOPICS_BY_WEEK[week.week_number]
    ? `Students have covered: ${TOPICS_BY_WEEK[week.week_number].join(', ')}.`
    : ''

  const vocabularyConstraint = JARGON_CONSTRAINTS[week.week_number] ?? ''

  const prompt = `You are generating a realistic team management scenario for a software development course simulation called SprintSim.

The student plays a Scrum Master leading a fictional team building ${projectName} (${projectDescription}).
This is Week ${week.week_number} of the semester. Topic: "${week.topic}".
${priorTopics}
${vocabularyConstraint}

TEAM MEMBERS (student leads these NPCs):
${teamDescription}

TASK:
Write a single, specific scenario (2–4 sentences) that:
1. Is directly tied to this week's topic (${week.topic})
2. Involves at least two named team members using their FULL names
3. Presents a realistic team or process challenge the student must respond to as team lead
4. Reflects each named member's personality traits authentically
5. Ends with an implicit decision point — don't ask the question outright, just leave the student needing to act
6. Uses only vocabulary appropriate for what students have learned so far (see constraints above)

Write in present or immediate-past tense. No preamble — output only the scenario text.`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')
  return content.text.trim()
}
