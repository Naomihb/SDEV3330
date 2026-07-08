import SprintBoard from '@/components/student/SprintBoard'
export default function SprintBoardPage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Sprint board</h1>
        <p className="text-sm text-gray-500 mt-0.5">Sprint 1</p>
      </div>
      <SprintBoard />
    </div>
  )
}
