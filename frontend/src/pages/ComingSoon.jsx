import { Construction } from 'lucide-react'

export default function ComingSoon({ title = 'Coming Soon', phase = '' }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-8 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
        <Construction size={36} className="text-slate-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 max-w-sm">
        This feature is under development and will be available {phase ? `in ${phase}` : 'soon'}.
      </p>
      {phase && (
        <span className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">
          {phase}
        </span>
      )}
    </div>
  )
}
