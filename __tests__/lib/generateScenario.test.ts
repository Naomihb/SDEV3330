// Mock Anthropic before importing generateScenario
const mockCreate = jest.fn()
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}))

import { generateScenario } from '@/lib/ai/generateScenario'
import type { TeamMember, Week } from '@/lib/types'

const makeWeek = (overrides: Partial<Week> = {}): Week => ({
  id: 'week-uuid',
  course_id: 'course-uuid',
  week_number: 5,
  topic: 'Scrum Framework',
  description: 'Run sprint planning.',
  due_date: '2026-09-23',
  is_active: true,
  prior_topics: ['Agile Methodology'],
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

const makeTeam = (): TeamMember[] => [
  {
    name: 'Isla Princess', firstName: 'Isla', lastName: 'Princess',
    role: 'senior_dev', seniority: 'senior',
    personality: 'confident_opinionated', personalityLabel: 'Confident & opinionated',
    moodTendency: 'positive', avatarInitials: 'IP', avatarBg: 'bg-green-100', avatarText: 'text-green-800',
  },
  {
    name: 'Pippin Squeak', firstName: 'Pippin', lastName: 'Squeak',
    role: 'junior_dev', seniority: 'junior',
    personality: 'enthusiastic_blocked', personalityLabel: 'Enthusiastic but blocked',
    moodTendency: 'cautious', avatarInitials: 'PS', avatarBg: 'bg-orange-100', avatarText: 'text-orange-800',
  },
  {
    name: 'Mia Peachy', firstName: 'Mia', lastName: 'Peachy',
    role: 'designer', seniority: 'mid',
    personality: 'quiet_stressed', personalityLabel: 'Goes quiet under stress',
    moodTendency: 'cautious', avatarInitials: 'MP', avatarBg: 'bg-violet-100', avatarText: 'text-violet-800',
  },
  {
    name: 'Hoftin Hasselhof', firstName: 'Hoftin', lastName: 'Hasselhof',
    role: 'qa_lead', seniority: 'mid',
    personality: 'skeptical', personalityLabel: 'Skeptical of new processes',
    moodTendency: 'negative', avatarInitials: 'HH', avatarBg: 'bg-blue-100', avatarText: 'text-blue-800',
  },
]

beforeEach(() => {
  mockCreate.mockResolvedValue({
    content: [{ type: 'text', text: "Isla Princess has raised a concern about Pippin Squeak's estimates." }],
  })
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('generateScenario', () => {
  it('returns the text content from the API response', async () => {
    const result = await generateScenario({
      week: makeWeek(),
      team: makeTeam(),
      projectName: 'SoundCircle',
      projectDescription: 'Local live music discovery platform',
    })
    expect(result).toBe('Isla Princess has raised a concern about Pippin Squeak\'s estimates.')
  })

  it('calls the Anthropic API exactly once', async () => {
    await generateScenario({ week: makeWeek(), team: makeTeam(), projectName: 'SoundCircle', projectDescription: 'desc' })
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('uses claude-haiku model', async () => {
    await generateScenario({ week: makeWeek(), team: makeTeam(), projectName: 'SoundCircle', projectDescription: 'desc' })
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-haiku-4-5-20251001' })
    )
  })

  it('caps tokens at 300', async () => {
    await generateScenario({ week: makeWeek(), team: makeTeam(), projectName: 'SoundCircle', projectDescription: 'desc' })
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ max_tokens: 300 })
    )
  })

  it('includes the project name in the prompt', async () => {
    await generateScenario({ week: makeWeek(), team: makeTeam(), projectName: 'SoundCircle', projectDescription: 'desc' })
    const prompt = mockCreate.mock.calls[0][0].messages[0].content
    expect(prompt).toContain('SoundCircle')
  })

  it('includes all four team member names in the prompt', async () => {
    await generateScenario({ week: makeWeek(), team: makeTeam(), projectName: 'SoundCircle', projectDescription: 'desc' })
    const prompt = mockCreate.mock.calls[0][0].messages[0].content
    expect(prompt).toContain('Isla Princess')
    expect(prompt).toContain('Pippin Squeak')
    expect(prompt).toContain('Mia Peachy')
    expect(prompt).toContain('Hoftin Hasselhof')
  })

  it('includes the week topic in the prompt', async () => {
    await generateScenario({ week: makeWeek({ topic: 'Scrum Framework' }), team: makeTeam(), projectName: 'P', projectDescription: 'd' })
    const prompt = mockCreate.mock.calls[0][0].messages[0].content
    expect(prompt).toContain('Scrum Framework')
  })

  it('includes week number in the prompt', async () => {
    await generateScenario({ week: makeWeek({ week_number: 7 }), team: makeTeam(), projectName: 'P', projectDescription: 'd' })
    const prompt = mockCreate.mock.calls[0][0].messages[0].content
    expect(prompt).toContain('Week 7')
  })

  it('includes jargon constraint for week 2', async () => {
    await generateScenario({ week: makeWeek({ week_number: 2, topic: 'SDLC Fundamentals' }), team: makeTeam(), projectName: 'P', projectDescription: 'd' })
    const prompt = mockCreate.mock.calls[0][0].messages[0].content
    expect(prompt).toMatch(/Do NOT use.*Scrum/i)
  })

  it('includes jargon constraint for week 4', async () => {
    await generateScenario({ week: makeWeek({ week_number: 4, topic: 'Agile Methodology' }), team: makeTeam(), projectName: 'P', projectDescription: 'd' })
    const prompt = mockCreate.mock.calls[0][0].messages[0].content
    expect(prompt).toMatch(/Scrum-specific ceremony names/i)
  })

  it('includes cumulative topics for the week in the prompt', async () => {
    await generateScenario({ week: makeWeek({ week_number: 5 }), team: makeTeam(), projectName: 'P', projectDescription: 'd' })
    const prompt = mockCreate.mock.calls[0][0].messages[0].content
    expect(prompt).toContain('Scrum')
  })

  it('throws if the API returns a non-text content block', async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'image' }] })
    await expect(
      generateScenario({ week: makeWeek(), team: makeTeam(), projectName: 'P', projectDescription: 'd' })
    ).rejects.toThrow('Unexpected response type')
  })

  it('includes personality labels for each team member', async () => {
    await generateScenario({ week: makeWeek(), team: makeTeam(), projectName: 'SoundCircle', projectDescription: 'desc' })
    const prompt = mockCreate.mock.calls[0][0].messages[0].content
    expect(prompt).toContain('Confident & opinionated')
    expect(prompt).toContain('Skeptical of new processes')
  })
})
