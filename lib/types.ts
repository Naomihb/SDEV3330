export type Role = 'student' | 'instructor'
export type SubmissionStatus = 'not_started' | 'in_progress' | 'submitted'
export type Grade = 'strong' | 'satisfactory' | 'needs_revision'
export type TicketStatus = 'todo' | 'in_progress' | 'done'

export type Seniority = 'junior' | 'mid' | 'senior'
export type Personality =
  | 'confident_opinionated'
  | 'enthusiastic_blocked'
  | 'quiet_stressed'
  | 'detail_obsessed'
  | 'collaborative'
  | 'overachiever'
  | 'burned_out'
  | 'skeptical'

export interface TeamMember {
  name: string           // e.g. "Isla Princess"
  firstName: string      // e.g. "Isla"
  lastName: string       // e.g. "Princess"
  role: 'senior_dev' | 'junior_dev' | 'designer' | 'qa_lead' | 'mid_dev'
  seniority: Seniority
  personality: Personality
  personalityLabel: string   // human-readable, e.g. "Confident & opinionated"
  moodTendency: 'positive' | 'cautious' | 'negative'
  avatarInitials: string     // e.g. "IP"
  avatarBg: string           // tailwind bg color
  avatarText: string         // tailwind text color
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  created_at: string
}

export interface Course {
  id: string
  code: string
  name: string
  semester: string
  instructor_id: string
}

export interface Week {
  id: string
  course_id: string
  week_number: number
  topic: string
  description: string | null
  due_date: string | null
  is_active: boolean
  prior_topics: string[]
  created_at: string
}

export interface TeamAssignment {
  id: string
  student_id: string
  course_id: string
  project_name: string
  project_description: string
  team_config: TeamMember[]
}

export interface SprintTicket {
  id: string
  student_id: string
  course_id: string
  sprint_number: number
  ticket_id: string
  title: string
  status: TicketStatus
  assignee_name: string | null
  story_points: number
  is_blocked: boolean
}

export interface Scenario {
  id: string
  student_id: string
  week_id: string
  content: string
  generated_at: string
}

export interface Submission {
  id: string
  student_id: string
  week_id: string
  scenario_id: string | null
  response_text: string
  submitted_at: string
  updated_at: string
}

export interface Feedback {
  id: string
  submission_id: string
  instructor_id: string
  grade: Grade
  feedback_text: string | null
  submitted_at: string
}

// Composite types for UI
export interface StudentWeekView {
  week: Week
  scenario: Scenario | null
  submission: Submission | null
  feedback: Feedback | null
}

export interface InstructorStudentRow {
  profile: Profile
  team: TeamAssignment | null
  submission: Submission | null
  scenario: Scenario | null
  feedback: Feedback | null
}
status: SubmissionStatus
}
