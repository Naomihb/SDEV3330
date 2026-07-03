# SprintSim

A semester-long Scrum simulation platform for **CS 3330 — Software Development Processes and Methodologies**. Each student leads a fictional NPC team through AI-generated weekly scenarios, submitted for instructor review and grading.

## What it does

- Every student is assigned a unique fictional project and a team of four NPC teammates (Isla Princess, Pippin Squeak, Mia Peachy, and Hoftin Hasselhof) with randomized roles, seniority, and personality traits — seeded from their user ID so the assignment is stable across sessions.
- Each week, Claude generates a scenario tailored to that week's topic and the student's specific team dynamics.
- Students respond as Scrum Master. Instructors review, grade (Strong / Satisfactory / Needs revision), and leave feedback.
- The student dashboard includes a sprint board, Gantt chart, velocity chart, burndown chart, and submission history.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend + API | Next.js 14 (App Router) |
| Database + Auth | Supabase (PostgreSQL + RLS) |
| AI scenarios | Anthropic Claude (`claude-haiku-4-5-20251001`) |
| Styling | Tailwind CSS |
| Hosting | Vercel → AWS |

## Running the demo (no database required)

```bash
npm install
npm run dev
```

Open `http://localhost:3000` — it redirects to `/demo/student` (student view) or visit `/demo/instructor` for the instructor dashboard. All data is mocked; no Supabase or API key needed.

## Project structure

```
app/
  demo/
    student/        # Student demo (no auth)
    instructor/     # Instructor demo (no auth)
  api/
    enroll/         # Enroll student + assign team
    scenarios/      # Generate weekly scenario via Claude
    submissions/    # Submit student response
    feedback/       # Instructor grade + feedback

components/
  demo/
    DemoStudentTabs.tsx     # Full student UI (board, gantt, metrics, etc.)
    DemoInstructorClient.tsx

lib/
  ai/generateScenario.ts    # Anthropic API call
  supabase/                 # client.ts + server.ts (stubbed in demo mode)

utils/
  teamAssignment.ts         # Seeded-random project + NPC assignment

supabase/
  schema.sql                # All tables + RLS policies
  seed_weeks.sql            # 16-week CS 3330 curriculum
```

## Connecting the database

See [SETUP.md](./SETUP.md) for the full walkthrough:

1. Create a Supabase project and run `supabase/schema.sql`
2. Seed the 16 weeks from `supabase/seed_weeks.sql`
3. Copy `.env.example` → `.env.local` and fill in your keys
4. Replace the stub files in `lib/supabase/` with the real implementations from SETUP.md
5. Restore `middleware.ts` to the Supabase version from SETUP.md

## NPC team members

| Name | Avatar color | Default assignment |
|---|---|---|
| Isla Princess | Green | Randomized per student |
| Pippin Squeak | Orange | Randomized per student |
| Mia Peachy | Violet | Randomized per student |
| Hoftin Hasselhof | Blue | Randomized per student |

Roles (senior dev, junior dev, designer, QA lead, mid dev), seniority, and personality traits are shuffled deterministically from the student's UUID.

## Course learning outcomes covered

- Agile / Scrum / XP / Lean comparison
- SDLC model selection
- Code review practices
- Requirements analysis
- Configuration and dependency management
- Design patterns in context
