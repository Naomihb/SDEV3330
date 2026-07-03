import Link from 'next/link'

export default function DemoIndex() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">SprintSim</h1>
        <p className="text-sm text-gray-400 mb-8">UI preview — no database required</p>
        <div className="flex gap-3 justify-center">
          <Link href="/demo/student" className="bg-indigo-600 text-white text-sm rounded-lg px-5 py-2.5 hover:bg-indigo-700 transition-colors">
            Student view
          </Link>
          <Link href="/demo/instructor" className="bg-violet-600 text-white text-sm rounded-lg px-5 py-2.5 hover:bg-violet-700 transition-colors">
            Instructor view
          </Link>
        </div>
      </div>
    </div>
  )
}
