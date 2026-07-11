import type { TeamMember, Personality } from '@/lib/types'

// The four pets — fixed names, randomized everything else
const PET_NAMES = [
  { firstName: 'Isla',   lastName: 'Princess'   },
  { firstName: 'Pippin', lastName: 'Squeak'      },
  { firstName: 'Mia',    lastName: 'Peachy'      },
  { firstName: 'Hoftin', lastName: 'Hasselhof'   },
]

const ROLE_OPTIONS = [
  'senior_dev', 'junior_dev', 'designer', 'qa_lead', 'mid_dev',
] as const

const PERSONALITY_MAP: Record<Personality, { label: string; moodTendency: 'positive' | 'cautious' | 'negative' }> = {
  confident_opinionated: { label: 'Confident & opinionated',   moodTendency: 'positive' },
  enthusiastic_blocked:  { label: 'Enthusiastic but blocked',  moodTendency: 'cautious' },
  quiet_stressed:        { label: 'Goes quiet under stress',   moodTendency: 'cautious' },
  detail_obsessed:       { label: 'Detail-obsessed',           moodTendency: 'positive' },
  collaborative:         { label: 'Highly collaborative',      moodTendency: 'positive' },
  overachiever:          { label: 'Overachiever, sets high bar', moodTendency: 'positive' },
  burned_out:            { label: 'Showing signs of burnout',  moodTendency: 'negative' },
  skeptical:             { label: 'Skeptical of new processes', moodTendency: 'negative' },
}

const PERSONALITIES = Object.keys(PERSONALITY_MAP) as Personality[]

// Tailwind-safe color pairs [bg, text]
const AVATAR_COLORS: [string, string][] = [
  ['bg-green-100',  'text-green-800'],
  ['bg-orange-100', 'text-orange-800'],
  ['bg-violet-100', 'text-violet-800'],
  ['bg-blue-100',   'text-blue-800'],
]

// Projects pool — randomly assigned at enrollment
export const PROJECT_POOL = [
  { name: 'PawTrack',    description: 'Pet health and vet appointment management app' },
  { name: 'MediTrack',   description: 'Personal medication reminder and refill tracker' },
  { name: 'EcoRoute',    description: 'Carbon footprint optimizer for daily commutes' },
  { name: 'StudySync',   description: 'Collaborative study session scheduler for students' },
  { name: 'LearnFlow',   description: 'Adaptive flashcard system with spaced repetition' },
  { name: 'BudgetBud',   description: 'Shared household budget tracker for roommates' },
  { name: 'ShiftPlan',   description: 'Shift scheduling tool for small restaurant teams' },
  { name: 'VaultNote',   description: 'End-to-end encrypted note-taking app' },
  { name: 'ClinicQ',     description: 'Virtual queue system for walk-in medical clinics' },
  { name: 'FarmCast',    description: 'Hyper-local weather and crop advisory for small farms' },
  { name: 'NestHunt',    description: 'Rental listing aggregator with neighborhood scoring' },
  { name: 'TrailLog',    description: 'Hiking trail logger with offline maps and safety check-ins' },
  { name: 'SoundCircle', description: 'Local live music discovery and RSVP platform' },
  { name: 'RepairQueue', description: 'Home repair contractor booking and review system' },
  { name: 'GrowLog',     description: 'Indoor plant care tracker with light and water reminders' },
]

// Seeded random using student ID for consistent assignment.
// Uses a multiplicative (Fibonacci) hash with avalanche mixing for good distribution.
function seededRandom(seed: string, index: number): number {
  let h = (index + 1) * 0x9e3779b9
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 0x9e3779b9)
    h ^= h >>> 16
  }
  return (h >>> 0) / 0x100000000
}

function pickFrom<T>(arr: T[], seed: string, index: number): T {
  return arr[Math.floor(seededRandom(seed, index) * arr.length)]
}

export function generateTeamAssignment(studentId: string): {
  project: { name: string; description: string }
  team: TeamMember[]
} {
  const project = pickFrom(PROJECT_POOL, studentId, 0)

  const shuffledRoles = [...ROLE_OPTIONS]
    .map((role, i) => ({ role, sort: seededRandom(studentId, i + 10) }))
    .sort((a, b) => a.sort - b.sort)
    .map(x => x.role)
    .slice(0, 4)

  const team: TeamMember[] = PET_NAMES.map((pet, i) => {
    const role = shuffledRoles[i]
    const personality = pickFrom(PERSONALITIES, studentId, i + 20)
    const { label, moodTendency } = PERSONALITY_MAP[personality]
    const [avatarBg, avatarText] = AVATAR_COLORS[i]
    const seniority = role === 'senior_dev' ? 'senior' : role === 'junior_dev' ? 'junior' : 'mid'

    return {
      name: `${pet.firstName} ${pet.lastName}`,
      firstName: pet.firstName,
      lastName: pet.lastName,
      role,
      seniority,
      personality,
      personalityLabel: label,
      moodTendency,
      avatarInitials: `${pet.firstName[0]}${pet.lastName[0]}`,
      avatarBg,
      avatarText,
    }
  })

  return { project, team }
}
