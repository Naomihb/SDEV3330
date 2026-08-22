import Anthropic from '@anthropic-ai/sdk'
import type { TeamMember, Week } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Cumulative topics students have covered by each SprintSim week
const TOPICS_BY_WEEK: Record<number, string[]> = {
  2: [
    'SDLC phases: Requirements, Design, Implementation, Testing, Deployment, Maintenance',
    'artifacts produced at each phase and how handoffs work',
    'the difference between the SDLC concept and a process model',
  ],
  3: [
    'SDLC phases and artifacts',
    'Waterfall: strict phase order, expensive to change late',
    'V-Model: each dev phase paired with a matching test phase',
    'Spiral Model: risk-driven cycle',
    'Iterative and Incremental models: working software early',
    'Agile as the dominant modern iterative approach',
  ],
  4: [
    'SDLC models (Waterfall, V-Model, Spiral, Iterative)',
    'the Agile Manifesto: four values and twelve principles',
    'real Agile vs. cargo-cult ceremonies',
  ],
  5: [
    'Agile values and principles',
    'Scrum roles: Product Owner, Scrum Master, Development Team',
    'Scrum artifacts: Product Backlog, Sprint Backlog, Increment',
    'Scrum events: Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective',
    'Scrum Master is NOT a project manager',
  ],
  6: [
    'all Scrum roles, artifacts, and events',
    'relative estimation (story points) vs absolute estimation (hours)',
    'Fibonacci-like story point scale (1,2,3,5,8,13)',
    'Planning Poker: silent reveal, divergent estimates trigger discussion',
    'velocity and burndown charts',
  ],
  7: [
    'all Scrum concepts, story points, planning poker, velocity, burndown',
    'requirements engineering: elicit, analyze, specify, validate',
    'elicitation techniques: interviews, surveys, observation, workshops',
    'functional vs non-functional requirements',
    'acceptance criteria',
  ],
  8: [
    'all prior topics through requirements engineering',
    'peer requirements review: identifying inconsistencies and gaps',
    'use cases and user stories',
    'requirements traceability',
  ],
  9: [
    'all prior topics through requirements',
    'Git fundamentals: commit, branch, merge, rebase',
    'configuration management: tracking and controlling changes',
    'dependency management and build reproducibility',
    'CI basics: automated build on every commit',
  ],
  10: [
    'all prior topics through Git and config management',
    'SOLID principles: Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion',
    'code smells: long methods, god classes, feature envy',
    'refactoring: improve structure without changing behavior',
    'design patterns: when to apply and when not to',
  ],
  11: [
    'all prior topics through SOLID and refactoring',
    'architectural styles: layered, client-server, microservices, event-driven',
    'GoF design patterns: creational, structural, behavioral categories',
    'trade-offs between architectural choices',
  ],
  12: [
    'all prior topics through architectural styles',
    'code review process: what to look for, how to give constructive feedback',
    'static analysis and linting tools',
    'industry practices: pair programming, trunk-based development',
  ],
  13: [
    'all prior topics through code reviews',
    'Extreme Programming (XP): pair programming, TDD, continuous integration',
    'Lean software: eliminate waste, amplify learning, decide late',
    'Kanban: visualize workflow, limit WIP, pull system',
    'when to choose XP vs Scrum vs Kanban',
  ],
}

// Per-week jargon constraints (what vocabulary to restrict or allow)
const JARGON_CONSTRAINTS: Record<number, string> = {
  2: 'Do NOT use Scrum, sprint, backlog, story points, or Agile-specific terms. Students only know SDLC phases and generic software process concepts.',
  3: 'Do NOT use Scrum-specific terms like sprint, backlog, or story points. Students know multiple SDLC models but have not studied Agile ceremonies yet.',
  4: 'Students know Agile values and principles but NOT Scrum-specific ceremony names (sprint, backlog, Daily Scrum). Avoid Scrum-specific ceremony names.',
  5: 'Students now know Scrum roles, events, and artifacts. You MAY use sprint, backlog, Product Owner, Scrum Master, Daily Scrum, etc.',
  6: 'Students know full Scrum plus story points and planning poker. You MAY reference velocity, burndown, and estimation techniques.',
  7: 'Students know Scrum and estimation. You MAY introduce requirements engineering vocabulary: elicitation, use case, acceptance criteria.',
  8: 'Students know requirements engineering. Scenarios may involve requirements review sessions, use case walkthroughs, and traceability.',
  9: 'Students now know Git and configuration management. Scenarios may involve branching conflicts, dependency issues, or CI pipeline problems.',
  10: 'Students know SOLID principles and refactoring. Scenarios may involve design smells, refactoring decisions, or applying design patterns.',
  11: 'Students know architectural styles and GoF patterns. Scenarios may involve architecture trade-off discussions.',
  12: 'Students know code review practices. Scenarios may involve review feedback, static analysis findings, or process improvement.',
  13: 'Students know XP, Lean, and Kanban. Scenarios may compare methodologies or involve WIP limit decisions.',
}

export interface GenerateScenarioParams {
  week: Week
  team: TeamMember[]
  projectName: string
  projectDescription: string
}

export async function generateScenario({
  week,
  team,
  projectName,
  projectDescription,
}: GenerateScenarioParams): Promise<string> {
  const topics = TOPICS_BY_WEEK[week.week_number] ?? []
  const jargonNote = JARGON_CONSTRAINTS[week.week_number] ?? ''

  const teamDescription = team
    .map(m => `- ${m.firstName ?? m.name.split(' ')[0]} (${m.role}, ${m.seniority}): ${m.personalityLabel}`)
    .join('\n')

  const topicsText = topics.length > 0
    ? `Students have covered:\n${topics.map(t => `- ${t}`).join('\n')}`
    : 'Students are beginning the course.'

  const prompt = `You are a scenario writer for SprintSim, a software engineering education tool.

Project: ${projectName} — ${projectDescription}
Week ${week.week_number} topic: ${week.topic}

Team members:
${teamDescription}

${topicsText}

${jargonNote ? `VOCABULARY CONSTRAINT: ${jargonNote}\n` : ''}
Write a realistic, brief team interaction scenario (2–4 sentences) that:
1. Involves a challenge or decision relevant to Week ${week.week_number}: ${week.topic}
2. Names at least two team members by their first names (first names only, never surnames)
3. Gives the student a clear decision to make as a team member
4. Uses only vocabulary the students have already learned

Output only the scenario text, no preamble.`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = response.content[0]
  if (!block || block.type !== 'text') {
    throw new Error('Unexpected response type from Anthropic API')
  }

  return block.text
}
