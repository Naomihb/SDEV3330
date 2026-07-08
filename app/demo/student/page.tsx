import Link from 'next/link'
import DemoStudentTabs from '@/components/demo/DemoStudentTabs'

const TEAM = [
  { name: 'Isla Princess',  firstName: 'Isla',   lastName: 'Princess',  role: 'senior_dev', seniority: 'senior', personalityLabel: 'Confident & opinionated', moodTendency: 'positive', avatarInitials: 'IP', avatarBg: 'bg-green-100',  avatarText: 'text-green-800' },
  { name: 'Pippin Squeak',  firstName: 'Pippin', lastName: 'Squeak',    role: 'junior_dev', seniority: 'junior', personalityLabel: 'Enthusiastic but blocked', moodTendency: 'negative', avatarInitials: 'PS', avatarBg: 'bg-orange-100', avatarText: 'text-orange-800' },
  { name: 'Mia Peachy',     firstName: 'Mia',    lastName: 'Peachy',    role: 'designer',   seniority: 'mid',    personalityLabel: 'Goes quiet under stress',  moodTendency: 'cautious', avatarInitials: 'MP', avatarBg: 'bg-violet-100', avatarText: 'text-violet-800' },
  { name: 'Hoftin Hasselhof',firstName:'Hoftin', lastName: 'Hasselhof', role: 'qa_lead',    seniority: 'mid',    personalityLabel: 'Detail-obsessed',           moodTendency: 'positive', avatarInitials: 'HH', avatarBg: 'bg-blue-100',   avatarText: 'text-blue-800' },
]

const TICKETS: { id: string; ticket_id: string; title: string; status: 'todo'|'in_progress'|'done'; assignee_name: string; story_points: number; is_blocked: boolean }[] = [
  { id: 't1', ticket_id: 'PAW-01', title: 'Scaffold project repo',          status: 'done',        assignee_name: 'Isla Princess',   story_points: 2, is_blocked: false },
  { id: 't2', ticket_id: 'PAW-02', title: 'Define initial user stories',    status: 'done',        assignee_name: 'Isla Princess',   story_points: 3, is_blocked: false },
  { id: 't3', ticket_id: 'PAW-03', title: 'Build pet profile component',    status: 'in_progress', assignee_name: 'Isla Princess',   story_points: 5, is_blocked: false },
  { id: 't4', ticket_id: 'PAW-04', title: 'Set up auth endpoints',          status: 'in_progress', assignee_name: 'Pippin Squeak',   story_points: 5, is_blocked: true  },
  { id: 't5', ticket_id: 'PAW-05', title: 'Design onboarding flow',         status: 'todo',        assignee_name: 'Mia Peachy',      story_points: 3, is_blocked: false },
  { id: 't6', ticket_id: 'PAW-06', title: 'Write unit tests for pet profile',status: 'todo',       assignee_name: 'Hoftin Hasselhof', story_points: 2, is_blocked: false },
  { id: 't7', ticket_id: 'PAW-07', title: 'Vet appointment booking UI',     status: 'todo',        assignee_name: 'Mia Peachy',      story_points: 3, is_blocked: false },
  { id: 't8', ticket_id: 'PAW-08', title: 'QA review sprint 1 deliverables',status: 'todo',       assignee_name: 'Hoftin Hasselhof', story_points: 2, is_blocked: false },
]

const WEEK = { id: 'w5', week_number: 5, topic: 'Scrum Framework', description: 'Run sprint planning. Handle your first team conflict around story point estimates.', due_date: '2026-09-23', is_active: true }

const SCENARIO = `During sprint planning, Pippin Squeak estimated the auth ticket at 8 story points — almost the entire sprint capacity. Isla Princess pushed back immediately, saying she's seen the same task done in 2 points at her last job. Mia Peachy has gone quiet, and Hoftin Hasselhof is waiting to hear your call as Scrum Master before estimating the QA work that depends on it.`

const PAST_SUBMISSIONS = [
  { id: 's1', week: { week_number: 4, topic: 'Agile Methodology Deep Dive' }, scenario: 'Isla Princess wants to skip the sprint retrospective because the team is behind. How do you respond?', response: 'Retrospectives are non-negotiable in Scrum — skipping them when things are hard is exactly when they matter most. I would hold the retro but keep it short (20 min), focus only on one or two concrete actions, and make sure Isla feels heard about the time pressure.', grade: 'strong', feedback: 'Excellent reasoning. You correctly identified that retros have the highest ROI when the team is under stress. Good call on keeping it time-boxed.' },
  { id: 's2', week: { week_number: 3, topic: 'SDLC Models: Comparison & Use Cases' }, scenario: 'Your team is debating Waterfall vs Agile for PawTrack. Hoftin Hasselhof argues Waterfall is safer because requirements are clear.', response: 'I would explain that while our requirements feel clear now, a consumer-facing app like PawTrack will likely see UX feedback that changes things. Agile lets us adapt. However, I would borrow from Waterfall by writing a solid requirements doc before sprint 1.', grade: 'satisfactory', feedback: 'Good hybrid thinking. Could have been stronger with specific examples of what would trigger a requirements change mid-project.' },
]

export default function DemoStudentPage() {
  return (
    <DemoStudentTabs
      team={TEAM}
      tickets={TICKETS}
      week={WEEK}
      scenario={SCENARIO}
      pastSubmissions={PAST_SUBMISSIONS}
    />
  )
}
