import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'

export default function MessagesList({ messages, onConfirm, onCancel }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, i) => (
        <MessageBubble
          key={i}
          msg={{
            ...msg,
            onConfirm: msg.type === 'order_preview' ? () => onConfirm(msg.data.order_id, i) : undefined,
            onCancel: msg.type === 'order_preview' ? () => onCancel(msg.data.order_id, i) : undefined,
          }}
        />
      ))}

      {/* Typing indicator placeholder */}
      <div ref={bottomRef} />
    </div>
  )
}
