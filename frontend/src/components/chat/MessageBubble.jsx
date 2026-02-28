import { Bot, User } from 'lucide-react'
import clsx from 'clsx'
import OrderSuggestionCard from './OrderSuggestionCard'

export default function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'

  return (
    <div className={clsx('flex gap-3 msg-animate', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1',
        isUser ? 'bg-mint-100' : 'bg-white border border-gray-200 shadow-soft'
      )}>
        {isUser
          ? <User size={15} className="text-mint-600" />
          : <Bot size={15} className="text-gray-500" />
        }
      </div>

      {/* Content */}
      <div className={clsx('max-w-[75%] space-y-2', isUser && 'items-end flex flex-col')}>
        {msg.type === 'order_preview' ? (
          <OrderSuggestionCard order={msg.data} onConfirm={msg.onConfirm} onCancel={msg.onCancel} confirmed={msg.confirmed} />
        ) : (
          <div className={clsx(
            'px-4 py-3 rounded-2xl text-sm leading-relaxed',
            isUser
              ? 'bg-mint-500 text-white rounded-tr-sm'
              : 'bg-white border border-gray-100 text-gray-800 shadow-soft rounded-tl-sm'
          )}>
            {msg.content}
          </div>
        )}
        <p className="text-xs text-gray-400 px-1">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
