import Link from 'next/link'
import DemoInstructorClient from '@/components/demo/DemoInstructorClient'

const STUDENTS = [
  { studentId:'s1', fullName:'Jordan A.',  projectName:'MediTrack',  status:'submitted', teamConfig:[{avatarInitials:'IP',avatarBg:'bg-green-100',avatarText:'text-green-800',moodTendency:'positive'},{avatarInitials:'PS',avatarBg:'bg-orange-100',avatarText:'text-orange-800',moodTendency:'negative'},{avatarInitials:'MP',avatarBg:'bg-violet-100',avatarText:'text-violet-800',moodTendency:'cautious'},{avatarInitials:'HH',avatarBg:'bg-blue-100',avatarText:'text-blue-800',moodTendency:'positive'}], scenario:'Hoftin Hasselhof flagged three edge cases the night before demo day. Isla Princess says ship it.', submission:{ id:'sub1', responseText:"I'd call a quick 30-min sync to triage together. Hoftin's concerns are valid but not every edge case blocks a release. I'd classify by severity, defer non-critical items to the next sprint, and update the PO on exactly what's shipping.", submittedAt:'2026-02-22' }, feedback:{ grade:'strong', feedback_text:'Excellent reasoning. You correctly identified triage as the right tool here. Great call on updating the PO proactively.' } },
  { studentId:'s2', fullName:'Sam B.',     projectName:'EcoRoute',   status:'submitted', teamConfig:[{avatarInitials:'PS',avatarBg:'bg-orange-100',avatarText:'text-orange-800',moodTendency:'negative'},{avatarInitials:'HH',avatarBg:'bg-blue-100',avatarText:'text-blue-800',moodTendency:'positive'},{avatarInitials:'IP',avatarBg:'bg-green-100',avatarText:'text-green-800',moodTendency:'positive'},{avatarInitials:'MP',avatarBg:'bg-violet-100',avatarText:'text-violet-800',moodTendency:'cautious'}], scenario:'Pippin Squeak missed the last two standups without explanation. Sprint ends in three days.', submission:{ id:'sub2', responseText:"I'd reach out to Pippin directly and privately first. Missing standups usually signals a blocker or personal issue. I'd help if it's a blocker, or gently reset expectations if it's a habit issue — without calling it out in front of the team.", submittedAt:'2026-02-21' }, feedback:null },
  { studentId:'s3', fullName:'Alex C.',    projectName:'StudySync',  status:'not_started', teamConfig:[{avatarInitials:'MP',avatarBg:'bg-violet-100',avatarText:'text-violet-800',moodTendency:'cautious'},{avatarInitials:'IP',avatarBg:'bg-green-100',avatarText:'text-green-800',moodTendency:'positive'},{avatarInitials:'HH',avatarBg:'bg-blue-100',avatarText:'text-blue-800',moodTendency:'positive'},{avatarInitials:'PS',avatarBg:'bg-orange-100',avatarText:'text-orange-800',moodTendency:'negative'}], scenario:"Mia Peachy's design doesn't match the user stories. She says requirements were unclear.", submission:null, feedback:null },
  { studentId:'s4', fullName:'Riley D.',   projectName:'PawTrack',   status:'submitted', teamConfig:[{avatarInitials:'HH',avatarBg:'bg-blue-100',avatarText:'text-blue-800',moodTendency:'positive'},{avatarInitials:'MP',avatarBg:'bg-violet-100',avatarText:'text-violet-800',moodTendency:'cautious'},{avatarInitials:'PS',avatarBg:'bg-orange-100',avatarText:'text-orange-800',moodTendency:'negative'},{avatarInitials:'IP',avatarBg:'bg-green-100',avatarText:'text-green-800',moodTendency:'positive'}], scenario:'Hoftin wants to add automated testing infrastructure mid-sprint. Isla says it will slow them down.', submission:{ id:'sub4', responseText:"Mid-sprint scope changes break the sprint's focus. I'd thank Hoftin for thinking ahead, add the testing infrastructure to the backlog, and prioritize it for next sprint. This keeps the current sprint clean and doesn't lose Hoftin's idea.", submittedAt:'2026-02-23' }, feedback:{ grade:'strong', feedback_text:'Textbook Scrum thinking. Protecting the sprint goal while validating the idea is exactly right.' } },
  { studentId:'s5', fullName:'Morgan E.',  projectName:'LearnFlow',  status:'not_started', teamConfig:[{avatarInitials:'IP',avatarBg:'bg-green-100',avatarText:'text-green-800',moodTendency:'positive'},{avatarInitials:'HH',avatarBg:'bg-blue-100',avatarText:'text-blue-800',moodTendency:'positive'},{avatarInitials:'MP',avatarBg:'bg-violet-100',avatarText:'text-violet-800',moodTendency:'cautious'},{avatarInitials:'PS',avatarBg:'bg-orange-100',avatarText:'text-orange-800',moodTendency:'negative'}], scenario:'Isla Princess keeps taking tickets from other team members without asking.', submission:null, feedback:null },
  { studentId:'s6', fullName:'Casey F.',   projectName:'BudgetBud',  status:'submitted', teamConfig:[{avatarInitials:'PS',avatarBg:'bg-orange-100',avatarText:'text-orange-800',moodTendency:'negative'},{avatarInitials:'MP',avatarBg:'bg-violet-100',avatarText:'text-violet-800',moodTendency:'cautious'},{avatarInitials:'IP',avatarBg:'bg-green-100',avatarText:'text-green-800',moodTendency:'positive'},{avatarInitials:'HH',avatarBg:'bg-blue-100',avatarText:'text-blue-800',moodTendency:'positive'}], scenario:"Sprint review is tomorrow and two tickets are still in progress. Pippin says he needs two more days.", submission:{ id:'sub6', responseText:"Demo only completed work — no half-finished features. I'd be transparent with stakeholders about what didn't make it, carry the two tickets into next sprint, and not rush Pippin to ship incomplete work just to hit the date.", submittedAt:'2026-02-22' }, feedback:null },
  { studentId:'s7', fullName:'Drew G.',    projectName:'ShiftPlan',  status:'not_started', teamConfig:[{avatarInitials:'MP',avatarBg:'bg-violet-100',avatarText:'text-violet-800',moodTendency:'cautious'},{avatarInitials:'PS',avatarBg:'bg-orange-100',avatarText:'text-orange-800',moodTendency:'negative'},{avatarInitials:'HH',avatarBg:'bg-blue-100',avatarText:'text-blue-800',moodTendency:'positive'},{avatarInitials:'IP',avatarBg:'bg-green-100',avatarText:'text-green-800',moodTendency:'positive'}], scenario:'Mia Peachy went quiet after Hoftin left harsh comments on her PR.', submission:null, feedback:null },
  { studentId:'s8', fullName:'Jamie I.',   projectName:'ClinicQ',    status:'submitted', teamConfig:[{avatarInitials:'IP',avatarBg:'bg-green-100',avatarText:'text-green-800',moodTendency:'positive'},{avatarInitials:'MP',avatarBg:'bg-violet-100',avatarText:'text-violet-800',moodTendency:'cautious'},{avatarInitials:'PS',avatarBg:'bg-orange-100',avatarText:'text-orange-800',moodTendency:'negative'},{avatarInitials:'HH',avatarBg:'bg-blue-100',avatarText:'text-blue-800',moodTendency:'positive'}], scenario:"Isla Princess hasn't attended the last two retrospectives. She says they're a waste of time.", submission:{ id:'sub8', responseText:"Retros are a Scrum ceremony and non-optional. I'd have a one-on-one with Isla to understand her concern. If she finds them unproductive I'd ask her to help redesign the format — getting buy-in from the skeptic is the fastest way to fix a broken retro.", submittedAt:'2026-02-23' }, feedback:{ grade:'satisfactory', feedback_text:'Good approach. Could have been stronger by naming specific retro formats you might try (e.g., Start/Stop/Continue vs 4Ls).' } },
]

export default function DemoInstructorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900">SprintSim</span>
          <span className="text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5">Instructor</span>
          <span className="text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5">CS 3330 · Spring 2026</span>
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">UI Preview</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">Week 5 active · Scrum Framework</span>
          <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-medium">NB</div>
          <Link href="/demo/student" className="text-xs text-indigo-600 border border-indigo-200 rounded-full px-3 py-1 hover:bg-indigo-50 transition-colors">
            Switch to student →
          </Link>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-52 border-r border-gray-200 bg-white flex flex-col py-4 shrink-0">
          <nav className="flex-1 px-3 space-y-0.5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">Navigation</p>
            {[{icon:'⊞',label:'Dashboard'},{icon:'☰',label:'Manage weeks'},{icon:'⚇',label:'Students'}].map(item => (
              <div key={item.label} className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm ${item.label==='Dashboard'?'bg-violet-50 text-violet-700 font-medium':'text-gray-600 hover:bg-gray-50 cursor-pointer'}`}>
                <span>{item.icon}</span>{item.label}
              </div>
            ))}
          </nav>
        </aside>
        <DemoInstructorClient students={STUDENTS} />
      </div>
    </div>
  )
}
