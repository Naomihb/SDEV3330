# SprintSim — Setup Guide

## Stack
- **Next.js 14** (App Router) — frontend + API routes
- **Supabase** — auth, database, row-level security
- **Anthropic Claude API** — per-student scenario generation
- **Tailwind CSS** — styling
- **Vercel** — hosting (later migrate to AWS)

---

## 1. Supabase setup

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the **SQL Editor**, run `supabase/schema.sql` to create all tables.
3. Then run `supabase/seed_weeks.sql` — first replace `COURSE_UUID` with a real UUID.
4. Copy your project's **URL** and **anon key** from Settings → API.

To create the first course:
```sql
-- Run in Supabase SQL editor after creating your instructor account
INSERT INTO public.courses (id, code, name, semester, instructor_id)
VALUES (
  gen_random_uuid(),
  'CS 3330',
  'Software Development Processes and Methodologies',
  'Spring 2026',
  'YOUR_INSTRUCTOR_USER_ID'
);
```

To make yourself an instructor (after signing up):
```sql
UPDATE public.profiles SET role = 'instructor' WHERE email = 'your@email.com';
```

---

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=        # from Supabase Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # from Supabase Settings → API
SUPABASE_SERVICE_ROLE_KEY=       # from Supabase Settings → API (keep secret)
ANTHROPIC_API_KEY=               # from console.anthropic.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 4. Student enrollment flow

When a student signs up and logs in, they land on the dashboard. To enroll them in your course, call:

```
POST /api/enroll
{ "courseId": "your-course-uuid" }
```

This automatically:
- Creates their enrollment
- Assigns a randomized project + team (Isla Princess, Pippin Squeak, Mia Peachy, Hoftin Hasselhof with random roles/traits)
- Seeds their Sprint 1 board with 8 tickets

You can wire this to a simple enrollment page later, or paste the course ID into a welcome email for students.

---

## 5. Weekly workflow

1. **Instructor**: Go to `/instructor/dashboard` → Manage Weeks → set the current week to `is_active = true` in Supabase (or build the manage weeks UI).
2. **Student**: Visits `/student/activity` → clicks "Generate my scenario" → Claude generates a unique scenario for their team.
3. **Student**: Writes and submits their response.
4. **Instructor**: Reviews in dashboard → grades + leaves feedback → student sees it on their submissions page.

---

## 6. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Set the same environment variables in the Vercel dashboard under Settings → Environment Variables.

---

## 7. Later: Migrate to AWS

When your university provisions AWS:
- Move the Next.js app to **AWS App Runner** or **ECS**
- Migrate Supabase Postgres to **RDS** (export via `pg_dump`, import to RDS)
- Keep Supabase Auth or swap for **AWS Cognito**
- Use **S3** for any file storage you add later

---

## File structure

```
sprintsim/
├── app/
│   ├── login/                  # Auth page
│   ├── student/                # Student-facing routes
│   │   ├── dashboard/          # Overview + stats
│   │   ├── activity/           # Weekly scenario + response
│   │   ├── team/               # Team profiles
│   │   ├── sprint-board/       # Kanban board
│   │   └── submissions/        # All past submissions + feedback
│   ├── instructor/
│   │   └── dashboard/          # Student grid + review panel
│   └── api/
│       ├── scenarios/generate/ # Claude scenario generation
│       ├── submissions/        # Submit student responses
│       ├── feedback/           # Instructor grades + feedback
│       └── enroll/             # Enroll student + assign team
├── components/
│   ├── student/                # Student UI components
│   └── instructor/             # Instructor UI components
├── lib/
│   ├── supabase/               # Supabase clients (browser + server)
│   ├── ai/                     # Claude scenario generator
│   └── types.ts                # TypeScript types
├── utils/
│   └── teamAssignment.ts       # Seeded random team + project assignment
└── supabase/
    ├── schema.sql              # Full DB schema with RLS
    └── seed_weeks.sql          # 16-week CS 3330 curriculum
```
