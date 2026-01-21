'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  username: string
}

interface ReactionButtonProps {
  emoji: string
  count: number
  users: User[]
  messageId: string
  channelId: string
  isAddButton?: boolean
}

export default function ReactionButton({
  emoji,
  count,
  users,
  messageId,
  channelId,
  isAddButton = false,
}: ReactionButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const commonEmojis = ['👍', '❤️', '😄', '🎉', '👏', '🔥']

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    }
  }

  const handleAddReaction = async (selectedEmoji: string) => {
    if (!selectedEmoji) {
      setIsAdding(true)
      return
    }

    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji: selectedEmoji }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'リアクションの追加に失敗しました')
      }
    } catch (error) {
      alert('リアクションの追加に失敗しました')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveReaction = async () => {
    try {
      const response = await fetch(
        `/api/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'リアクションの削除に失敗しました')
      }
    } catch (error) {
      alert('リアクションの削除に失敗しました')
    }
  }

  if (isAddButton && !isAdding) {
    return (
      <button
        className="rounded-full border border-dashed border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
        onClick={() => handleAddReaction('')}
        title="リアクションを追加"
      >
        😀 +
      </button>
    )
  }

  if (isAdding) {
    return (
      <div className="absolute z-10 flex gap-1 rounded-lg border border-gray-300 bg-white p-2 shadow-lg">
        {commonEmojis.map((e) => (
          <button
            key={e}
            className="rounded px-2 py-1 text-lg hover:bg-gray-100"
            onClick={() => handleAddReaction(e)}
          >
            {e}
          </button>
        ))}
        <button
          className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
          onClick={() => setIsAdding(false)}
        >
          ✕
        </button>
      </div>
    )
  }

  if (!emoji || count === 0) {
    return null
  }

  const hasUserReacted = users.some((u) => u.id === currentUser?.id)

  return (
    <button
      className={`rounded-full border px-2 py-1 text-sm ${
        hasUserReacted
          ? 'border-purple-500 bg-purple-100'
          : 'border-gray-300 hover:bg-gray-100'
      }`}
      onClick={hasUserReacted ? handleRemoveReaction : () => handleAddReaction(emoji)}
      title={users.map((u) => u.username).join(', ')}
    >
      <span>{emoji}</span> <span>{count}</span>
    </button>
  )
}
