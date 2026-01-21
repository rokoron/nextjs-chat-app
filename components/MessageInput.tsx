'use client'

import { useState } from 'react'

interface MessageInputProps {
  onSend: (content: string) => void
}

export default function MessageInput({ onSend }: MessageInputProps) {
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim()) {
      onSend(content.trim())
      setContent('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="メッセージを入力..."
          rows={1}
          className="flex-1 resize-none rounded border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!content.trim()}
          className="rounded bg-purple-600 px-6 py-2 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
        >
          送信
        </button>
      </form>
    </div>
  )
}
