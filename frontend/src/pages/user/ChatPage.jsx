import ChatShell from '../../components/chat/ChatShell'
import SymptomChatShell from '../../components/chat/SymptomChatShell'
import { ShoppingBag, Stethoscope } from 'lucide-react'

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col">
      {/* Two separate sections side by side */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-0 overflow-hidden">
        {/* Order Agent Section */}
        <div className="flex flex-col border-r border-slate-200 bg-white overflow-hidden">
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-slate-200 bg-slate-50">
            <ShoppingBag size={18} className="text-blue-600" strokeWidth={2} />
            <span className="font-semibold text-slate-800">Order Agent</span>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatShell />
          </div>
        </div>

        {/* SentinelRX-AI Section */}
        <div className="flex flex-col bg-white overflow-hidden">
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-slate-200 bg-slate-50">
            <Stethoscope size={18} className="text-emerald-600" strokeWidth={2} />
            <span className="font-semibold text-slate-800">SentinelRX-AI</span>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <SymptomChatShell />
          </div>
        </div>
      </div>
    </div>
  )
}
