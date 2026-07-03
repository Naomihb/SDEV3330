'use client'

import { useState } from 'react'

// ── Week 5 lesson content ─────────────────────────────────────────────────────

const LESSON = {
  week: 5,
  topic: 'Scrum Framework',
  intro: `Scrum is a lightweight framework for developing and sustaining complex products. It doesn't prescribe specific techniques — instead it gives you a structure of roles, events, and artifacts, then lets the team decide how to work within them. This week you're running your first sprint planning session, which means you need to understand what Scrum actually requires of you as Scrum Master.`,
  sections: [
    {
      id: 'team',
      title: 'The Scrum Team',
      summary: 'A Scrum Team has exactly three accountabilities: Product Owner, Scrum Master, and Developers. No sub-teams, no hierarchy — one cohesive unit of 10 or fewer people.',
      deep: `The Product Owner is accountable for maximizing the value of the product. They own the Product Backlog — ordering it, keeping it transparent, and making sure Developers understand what's in it. The PO is one person, not a committee.

The Scrum Master serves the team and the organization. They coach the team on Scrum, remove impediments, and facilitate events. Crucially, the Scrum Master has no authority over Developers — they lead by influence, not by command. That's the role you play in SprintSim.

Developers are the people doing the work. In Scrum, "Developer" means anyone who contributes to creating the Increment — designers, testers, engineers, everyone. They're self-managing: they decide internally how to do the work, not the Scrum Master.`,
    },
    {
      id: 'events',
      title: 'The Five Scrum Events',
      summary: 'Sprint, Sprint Planning, Daily Scrum, Sprint Review, and Sprint Retrospective. Each event has a fixed maximum duration (a time-box) and a specific purpose.',
      deep: `The Sprint is the container for all other events — a fixed period of one month or less during which a "Done" Increment is created. Sprints give the team a heartbeat: a consistent cadence for planning, execution, and reflection.

Sprint Planning kicks off the Sprint. The team answers two questions: (1) Why is this Sprint valuable? (2) What can be Done this Sprint? The Developers select items from the Product Backlog and create a Sprint Goal. Time-box: 8 hours for a 1-month Sprint (proportionally less for shorter Sprints).

The Daily Scrum is a 15-minute event for Developers to inspect progress toward the Sprint Goal and adapt the Sprint Backlog. It's not a status report to the Scrum Master — it's for the Developers to coordinate with each other.

The Sprint Review happens at the end of the Sprint. The team presents the Increment to stakeholders, gets feedback, and the Product Backlog is adapted. Time-box: 4 hours for a 1-month Sprint.

The Sprint Retrospective closes the Sprint. The team inspects how the last Sprint went — people, relationships, process, tools — and identifies improvements to carry forward. Time-box: 3 hours for a 1-month Sprint.`,
    },
    {
      id: 'artifacts',
      title: 'Scrum Artifacts',
      summary: 'Three artifacts: Product Backlog (what needs to be done), Sprint Backlog (what the team committed to this Sprint), and the Increment (what was actually built). Each has a "commitment" that makes progress measurable.',
      deep: `The Product Backlog is an ordered list of everything that might be needed in the product. The Product Owner owns it. Items at the top are more refined and ready to work; items farther down are larger and less detailed. The commitment for the Product Backlog is the Product Goal — the long-term objective the team is working toward.

The Sprint Backlog is the plan for the Sprint: the Sprint Goal (why), the set of Product Backlog items selected (what), and the plan for delivering the Increment (how). It's owned by Developers and updated throughout the Sprint. The commitment is the Sprint Goal.

The Increment is the sum of all completed Product Backlog items plus the value of previous Increments. An Increment must be usable — it must meet the Definition of Done. The commitment for the Increment is the Definition of Done (DoD).

The Definition of Done is a shared understanding of what "Done" means. If an item doesn't meet the DoD, it can't be included in the Increment. Teams that skip defining their DoD almost always argue about whether work is really done.`,
    },
    {
      id: 'estimation',
      title: 'Estimation & Velocity',
      summary: 'Story points measure relative effort, not hours. Velocity is how many points a team completes per Sprint on average — it\'s a planning tool, not a performance metric.',
      deep: `Story points are a unit of measure for the size of a backlog item relative to other items. A 5-point story isn't five times harder than a 1-point story — it's roughly five times the effort, uncertainty, and complexity of a 1-point story. The absolute values don't matter; the ratios do.

Planning Poker is a common estimation technique: each team member privately picks a card representing their estimate, then everyone reveals simultaneously. Divergence triggers a discussion. This prevents anchoring (where the first person to speak influences everyone else) and surfaces different assumptions about scope.

Velocity is the average number of story points a team completes per Sprint over several Sprints. It's used to forecast how much work the team can take on. A team with a 30-point velocity shouldn't plan a 60-point Sprint. Importantly, velocity is a team-level measurement — comparing velocity between teams tells you nothing useful and creates bad incentives.

In your PawTrack sprint, Pippin estimated PAW-04 at 8 points. Isla says she's seen it done in 2. Neither is automatically right — their estimates reflect different assumptions about scope, dependencies, and risk. Your job as Scrum Master is to facilitate a discussion that surfaces those assumptions, not to pick a number yourself.`,
    },
  ],
}

// ── Glossary ──────────────────────────────────────────────────────────────────

const GLOSSARY = [
  { term: 'Acceptance Criteria', category: 'Scrum', def: 'Conditions a product or feature must satisfy to be accepted by the Product Owner or stakeholder. Defined before development starts.' },
  { term: 'Agile', category: 'Agile', def: 'An umbrella term for iterative, incremental approaches to software development guided by the Agile Manifesto\'s four values and twelve principles.' },
  { term: 'Backlog Refinement', category: 'Scrum', def: 'An ongoing activity (not an official Scrum event) where the team adds detail, estimates, and order to Product Backlog items. Keeps the backlog ready for Sprint Planning.' },
  { term: 'Burndown Chart', category: 'Metrics', def: 'A chart tracking remaining work (story points) over time within a Sprint or release. A downward slope toward zero indicates healthy progress.' },
  { term: 'Burnup Chart', category: 'Metrics', def: 'A chart showing work completed over time against a total scope line. Unlike burndown, it makes scope changes visible.' },
  { term: 'CI/CD', category: 'XP / DevOps', def: 'Continuous Integration / Continuous Delivery. CI means merging code frequently (at least daily) and running automated tests. CD means the software is always in a releasable state.' },
  { term: 'Code Review', category: 'XP / DevOps', def: 'A systematic examination of source code by peers to find defects, share knowledge, and enforce standards before the code is merged.' },
  { term: 'Cycle Time', category: 'Lean', def: 'The elapsed time from when work begins on an item to when it is delivered. Shorter cycle times mean faster feedback.' },
  { term: 'Daily Scrum', category: 'Scrum', def: 'A 15-minute event for Developers to synchronize work and adapt the Sprint Backlog. Not a status meeting — it\'s for the team, not the Scrum Master.' },
  { term: 'Definition of Done (DoD)', category: 'Scrum', def: 'A shared, explicit list of criteria that every Increment must satisfy. If an item doesn\'t meet the DoD, it\'s not Done — it can\'t be presented at the Sprint Review.' },
  { term: 'Developers', category: 'Scrum', def: 'Everyone in the Scrum Team who contributes to creating the Increment — engineers, designers, testers, writers. They are self-managing.' },
  { term: 'Epic', category: 'Agile', def: 'A large body of work that can be broken down into smaller user stories. Epics span multiple sprints and represent a significant feature or initiative.' },
  { term: 'Extreme Programming (XP)', category: 'XP / DevOps', def: 'An Agile methodology emphasizing technical practices: TDD, pair programming, continuous integration, simple design, and frequent small releases.' },
  { term: 'Impediment', category: 'Scrum', def: 'Anything blocking a Developer from doing their work. The Scrum Master is responsible for removing impediments that the team cannot resolve themselves.' },
  { term: 'Increment', category: 'Scrum', def: 'The sum of all completed, Done Product Backlog items at the end of a Sprint. It must be usable — regardless of whether the Product Owner decides to release it.' },
  { term: 'Kanban', category: 'Lean', def: 'A method for managing work using a visual board with columns representing workflow stages. Work-in-progress (WIP) limits prevent overloading the team.' },
  { term: 'Lead Time', category: 'Lean', def: 'The total elapsed time from when a request is made until it is delivered. Includes wait time and queue time, unlike cycle time.' },
  { term: 'Lean', category: 'Lean', def: 'A philosophy originating from Toyota\'s production system. Core ideas: eliminate waste, amplify learning, decide as late as possible, deliver as fast as possible, empower the team.' },
  { term: 'MVP (Minimum Viable Product)', category: 'Agile', def: 'The smallest version of a product that delivers enough value to validate a hypothesis with real users. Not "minimum" in quality — minimum in scope.' },
  { term: 'Pair Programming', category: 'XP / DevOps', def: 'Two developers working at one computer: one writes code (driver), one reviews in real time (navigator). Roles switch frequently. Reduces defects and spreads knowledge.' },
  { term: 'Planning Poker', category: 'Scrum', def: 'An estimation technique where team members simultaneously reveal their story point estimate using cards (often Fibonacci: 1, 2, 3, 5, 8, 13…). Divergence triggers discussion.' },
  { term: 'Product Backlog', category: 'Scrum', def: 'An ordered list of everything needed to improve the product, owned by the Product Owner. Items at the top are more refined; items farther down are larger and vaguer.' },
  { term: 'Product Goal', category: 'Scrum', def: 'The long-term objective the Scrum Team is working toward. The commitment for the Product Backlog. Only one Product Goal at a time.' },
  { term: 'Product Owner', category: 'Scrum', def: 'The person accountable for maximizing the value of the product and managing the Product Backlog. One person — not a committee.' },
  { term: 'Refactoring', category: 'XP / DevOps', def: 'Restructuring existing code without changing its external behavior. Improves readability, reduces complexity, and manages technical debt.' },
  { term: 'Retrospective', category: 'Scrum', def: 'A Sprint-closing event where the team reflects on how they worked — people, process, tools — and commits to at least one improvement. Time-box: 3 hours.' },
  { term: 'Scrum', category: 'Scrum', def: 'A lightweight framework for developing complex products using time-boxed Sprints, three accountabilities, five events, and three artifacts.' },
  { term: 'Scrum Master', category: 'Scrum', def: 'Serves the Scrum Team and organization. Coaches on Scrum, removes impediments, facilitates events. Has no authority over Developers — leads by influence.' },
  { term: 'Sprint', category: 'Scrum', def: 'A fixed-length period (≤ 1 month) during which a "Done," usable Increment is created. The container for all other Scrum events. Sprints have consistent duration.' },
  { term: 'Sprint Backlog', category: 'Scrum', def: 'The Sprint Goal, selected Product Backlog items, and the plan for delivering them. Owned by Developers and updated daily.' },
  { term: 'Sprint Goal', category: 'Scrum', def: 'A single objective for the Sprint that gives Developers focus and flexibility. The commitment for the Sprint Backlog. Created during Sprint Planning.' },
  { term: 'Sprint Planning', category: 'Scrum', def: 'The event that kicks off the Sprint. The team defines the Sprint Goal, selects backlog items, and creates a plan. Time-box: 8 hours for a 1-month Sprint.' },
  { term: 'Sprint Review', category: 'Scrum', def: 'A Sprint-closing event where the team presents the Increment to stakeholders, collects feedback, and adapts the Product Backlog. Time-box: 4 hours.' },
  { term: 'Story Points', category: 'Scrum', def: 'A relative unit of measure for the size and complexity of a backlog item. Not hours. A 5-point item is roughly 5× the effort of a 1-point item for that specific team.' },
  { term: 'TDD (Test-Driven Development)', category: 'XP / DevOps', def: 'A practice where tests are written before production code. Red → Green → Refactor cycle. Ensures code does exactly what\'s specified and builds a regression safety net.' },
  { term: 'Technical Debt', category: 'XP / DevOps', def: 'The implied cost of future rework caused by taking shortcuts now. Like financial debt — manageable in small amounts, crippling if left to compound.' },
  { term: 'User Story', category: 'Agile', def: 'A short description of a feature from the user\'s perspective: "As a [role], I want [feature] so that [benefit]." A conversation starter, not a specification.' },
  { term: 'Velocity', category: 'Metrics', def: 'The average story points a team completes per Sprint. Used for forecasting, not measuring performance. Comparing velocity across teams is misleading.' },
  { term: 'Waterfall', category: 'SDLC', def: 'A sequential SDLC model: Requirements → Design → Implementation → Testing → Deployment. Each phase finishes before the next begins. Low flexibility for changing requirements.' },
  { term: 'WIP Limit', category: 'Lean', def: 'A cap on how many items can be in a given workflow stage at once. Forces finishing work before starting new work, reducing context switching and bottlenecks.' },
]

const CATEGORIES = ['All', 'Scrum', 'Agile', 'XP / DevOps', 'Lean', 'Metrics', 'SDLC']

const CATEGORY_COLORS: Record<string, string> = {
  Scrum: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Agile: 'bg-violet-50 text-violet-700 border-violet-200',
  'XP / DevOps': 'bg-pink-50 text-pink-700 border-pink-200',
  Lean: 'bg-orange-50 text-orange-700 border-orange-200',
  Metrics: 'bg-blue-50 text-blue-700 border-blue-200',
  SDLC: 'bg-gray-100 text-gray-600 border-gray-200',
}

// ── Flashcard deck (Week 5 focus) ─────────────────────────────────────────────

const FLASHCARDS = [
  { term: 'Scrum Master', def: 'Serves the Scrum Team and organization. Coaches on Scrum, removes impediments, facilitates events. Leads by influence — no authority over Developers.' },
  { term: 'Product Owner', def: 'Accountable for maximizing the value of the product and managing the Product Backlog. One person, not a committee.' },
  { term: 'Sprint', def: 'A fixed-length period (≤ 1 month) during which a "Done" Increment is created. All other Scrum events happen inside a Sprint.' },
  { term: 'Sprint Goal', def: 'A single objective for the Sprint that gives Developers focus and flexibility. Created during Sprint Planning. The commitment for the Sprint Backlog.' },
  { term: 'Definition of Done', def: 'A shared list of criteria every Increment must satisfy to be considered Done. If it doesn\'t meet the DoD, it cannot be included in the Sprint Review.' },
  { term: 'Daily Scrum', def: 'A 15-minute event for Developers to synchronize and adapt the Sprint Backlog. It\'s not a status report — the Scrum Master doesn\'t run it, the Developers do.' },
  { term: 'Sprint Review', def: 'End-of-Sprint event where the team presents the Increment to stakeholders and collects feedback. The Product Backlog may be adapted as a result.' },
  { term: 'Sprint Retrospective', def: 'End-of-Sprint event where the team inspects their process and commits to at least one improvement for the next Sprint.' },
  { term: 'Velocity', def: 'Average story points completed per Sprint. A planning tool for forecasting — not a performance metric. Never compare velocity between teams.' },
  { term: 'Story Points', def: 'A relative measure of size and effort. A 5-point item is roughly 5× the effort of a 1-point item for that specific team. Not hours.' },
  { term: 'Product Backlog', def: 'An ordered list of everything needed to improve the product. More refined items are at the top. Owned by the Product Owner.' },
  { term: 'Increment', def: 'The sum of all Done Product Backlog items at the end of a Sprint. Must be usable and meet the Definition of Done.' },
  { term: 'Impediment', def: 'Anything blocking a Developer from doing their work. The Scrum Master removes impediments the team can\'t resolve themselves.' },
  { term: 'Planning Poker', def: 'Estimation technique where team members simultaneously reveal story point estimates on cards. Divergence triggers discussion to surface hidden assumptions.' },
  { term: 'Burndown Chart', def: 'Tracks remaining story points over time during a Sprint. A slope toward zero = healthy. Flat or rising line = something is wrong.' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function DemoLearnTab() {
  const [view, setView] = useState<'lesson' | 'glossary' | 'flashcards'>('lesson')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [glossarySearch, setGlossarySearch] = useState('')
  const [glossaryCat, setGlossaryCat] = useState('All')
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const filteredGlossary = GLOSSARY.filter(g => {
    const matchCat = glossaryCat === 'All' || g.category === glossaryCat
    const matchSearch = glossarySearch === '' ||
      g.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      g.def.toLowerCase().includes(glossarySearch.toLowerCase())
    return matchCat && matchSearch
  })

  function nextCard() { setCardIndex(i => (i + 1) % FLASHCARDS.length); setFlipped(false) }
  function prevCard() { setCardIndex(i => (i - 1 + FLASHCARDS.length) % FLASHCARDS.length); setFlipped(false) }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">Week 5</span>
          <span className="text-xs text-gray-400">Scrum Framework</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Learn</h1>
        <p className="text-sm text-gray-400 mt-0.5">Lesson notes, glossary, and flashcards for this week</p>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {(['lesson', 'glossary', 'flashcards'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {v === 'lesson' ? '📖 Lesson' : v === 'glossary' ? '📚 Glossary' : '🃏 Flashcards'}
          </button>
        ))}
      </div>

      {/* ── LESSON ── */}
      {view === 'lesson' && (
        <div className="space-y-4">
          {/* Intro */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
            <p className="text-sm text-indigo-900 leading-relaxed">{LESSON.intro}</p>
          </div>

          {/* Sections */}
          {LESSON.sections.map(section => (
            <div key={section.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h2 className="text-sm font-semibold text-gray-900 mb-2">{section.title}</h2>
                    <p className="text-sm text-gray-700 leading-relaxed">{section.summary}</p>
                  </div>
                  <button
                    onClick={() => setExpanded(expanded === section.id ? null : section.id)}
                    className="shrink-0 text-xs text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition-colors mt-0.5 whitespace-nowrap"
                  >
                    {expanded === section.id ? 'Show less ↑' : 'Deep dive ↓'}
                  </button>
                </div>
              </div>
              {expanded === section.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  {section.deep.split('\n\n').map((para, i) => (
                    <p key={i} className="text-sm text-gray-700 leading-relaxed mb-3 last:mb-0">{para}</p>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Connection to scenario */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">This week&apos;s connection</p>
            <p className="text-sm text-amber-900 leading-relaxed">
              Your scenario involves a story point disagreement between Pippin and Isla during Sprint Planning — a classic estimation conflict.
              Use what you learned about Planning Poker, velocity, and the Scrum Master&apos;s facilitation role (not authority) to reason through your response.
            </p>
            <button
              className="mt-3 text-xs text-amber-700 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors"
              onClick={() => {/* parent will switch tab */}}
            >
              Go to this week&apos;s scenario →
            </button>
          </div>
        </div>
      )}

      {/* ── GLOSSARY ── */}
      {view === 'glossary' && (
        <div>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              placeholder="Search terms or definitions…"
              value={glossarySearch}
              onChange={e => setGlossarySearch(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder-gray-300"
            />
            <div className="flex gap-1 flex-wrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setGlossaryCat(cat)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                    glossaryCat === cat
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-3">{filteredGlossary.length} term{filteredGlossary.length !== 1 ? 's' : ''}</p>

          <div className="space-y-2">
            {filteredGlossary.length === 0 && (
              <div className="text-center py-12 text-sm text-gray-400">No terms match your search.</div>
            )}
            {filteredGlossary.map(g => (
              <div key={g.term} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{g.term}</span>
                    <span className={`text-xs border rounded-full px-2 py-0.5 ${CATEGORY_COLORS[g.category]}`}>{g.category}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{g.def}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FLASHCARDS ── */}
      {view === 'flashcards' && (
        <div className="flex flex-col items-center">
          <p className="text-sm text-gray-400 mb-6">Card {cardIndex + 1} of {FLASHCARDS.length} · Click card to reveal definition</p>

          {/* Card */}
          <div
            onClick={() => setFlipped(f => !f)}
            className="w-full max-w-xl cursor-pointer select-none"
            style={{ perspective: '1000px' }}
          >
            <div
              className="relative w-full transition-transform duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                height: '220px',
              }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 bg-white border-2 border-indigo-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center shadow-sm"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <p className="text-xs text-indigo-400 uppercase tracking-wider mb-3">Term</p>
                <p className="text-2xl font-semibold text-gray-900">{FLASHCARDS[cardIndex].term}</p>
                <p className="text-xs text-gray-300 mt-6">tap to flip</p>
              </div>
              {/* Back */}
              <div
                className="absolute inset-0 bg-indigo-600 border-2 border-indigo-600 rounded-2xl flex flex-col items-center justify-center p-8 text-center shadow-sm"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <p className="text-xs text-indigo-300 uppercase tracking-wider mb-3">Definition</p>
                <p className="text-sm text-white leading-relaxed">{FLASHCARDS[cardIndex].def}</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={prevCard}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg"
            >
              ←
            </button>
            <div className="flex gap-1.5">
              {FLASHCARDS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCardIndex(i); setFlipped(false) }}
                  className={`w-2 h-2 rounded-full transition-colors ${i === cardIndex ? 'bg-indigo-500' : 'bg-gray-200 hover:bg-gray-300'}`}
                />
              ))}
            </div>
            <button
              onClick={nextCard}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg"
            >
              →
            </button>
          </div>
          <p className="text-xs text-gray-300 mt-4">Use arrow keys or click the dots to jump to any card</p>
        </div>
      )}
    </div>
  )
}
