'use client'

import { useEffect, useState, useRef } from 'react'
import MessageInput from './MessageInput'
import ReactionButton from './ReactionButton'

interface User {
  id: string
  username: string
  profileImage?: string | null
}

interface Reaction {
  id: string
  emoji: string
  userId: string
  user: User
}

interface Message {
  id: string
  content: string
  userId: string
  channelId: string
  createdAt: string
  updatedAt: string
  user: User
  reactions: Reaction[]
}

interface Channel {
  id: string
  name: string
  description?: string | null
}

interface MessageListProps {
  channel: Channel | null
}

export default function MessageList({ channel }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (channel) {
      fetchMessages()
      connectSSE()
    } else {
      setMessages([])
      disconnectSSE()
    }

    return () => {
      disconnectSSE()
    }
  }, [channel])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    if (!channel) return
    try {
      setLoading(true)
      const response = await fetch(`/api/channels/${channel.id}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectSSE = () => {
    if (!channel) return

    disconnectSSE()

    const eventSource = new EventSource(`/api/sse/messages/${channel.id}`)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleSSEMessage(data)
      } catch (error) {
        console.error('Failed to parse SSE message:', error)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      setTimeout(connectSSE, 3000)
    }
  }

  const disconnectSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }

  const handleSSEMessage = (data: { type: string; data: any }) => {
    if (data.type === 'new_message') {
      setMessages((prev) => [...prev, data.data])
    } else if (data.type === 'message_updated') {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.data.id ? data.data : m))
      )
    } else if (data.type === 'message_deleted') {
      setMessages((prev) => prev.filter((m) => m.id !== data.data.messageId))
    } else if (data.type === 'reaction_added') {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === data.data.messageId) {
            const existingReaction = m.reactions.find(
              (r) => r.emoji === data.data.reaction.emoji && r.userId === data.data.reaction.userId
            )
            if (!existingReaction) {
              return {
                ...m,
                reactions: [...m.reactions, data.data.reaction],
              }
            }
          }
          return m
        })
      )
    } else if (data.type === 'reaction_removed') {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === data.data.messageId) {
            return {
              ...m,
              reactions: m.reactions.filter(
                (r) => !(r.emoji === data.data.emoji && r.userId === data.data.userId)
              ),
            }
          }
          return m
        })
      )
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!channel) return
    try {
      const response = await fetch(`/api/channels/${channel.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'メッセージの送信に失敗しました')
      }
    } catch (error) {
      alert('メッセージの送信に失敗しました')
    }
  }

  const handleEditMessage = async (messageId: string, content: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'メッセージの編集に失敗しました')
      }
    } catch (error) {
      alert('メッセージの編集に失敗しました')
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('このメッセージを削除しますか？')) return
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'メッセージの削除に失敗しました')
      }
    } catch (error) {
      alert('メッセージの削除に失敗しました')
    }
  }

  if (!channel) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">チャンネルを選択してください</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  const groupedReactions = (reactions: Reaction[]) => {
    const grouped: Record<string, Reaction[]> = {}
    reactions.forEach((r) => {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = []
      }
      grouped[r.emoji].push(r)
    })
    return grouped
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 bg-white p-4">
        <h2 className="text-xl font-semibold">#{channel.name}</h2>
        {channel.description && (
          <p className="mt-1 text-sm text-gray-600">{channel.description}</p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto bg-white p-4">
        {messages.map((message) => (
          <div key={message.id} className="mb-4 rounded p-2 hover:bg-gray-50">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-semibold">{message.user.username}</span>
              <span className="text-xs text-gray-500">
                {new Date(message.createdAt).toLocaleString('ja-JP')}
              </span>
            </div>
            <div className="mb-2 whitespace-pre-wrap">{message.content}</div>
            {message.reactions.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {Object.entries(groupedReactions(message.reactions)).map(([emoji, reactions]) => (
                  <ReactionButton
                    key={emoji}
                    emoji={emoji}
                    count={reactions.length}
                    users={reactions.map((r) => r.user)}
                    messageId={message.id}
                    channelId={channel.id}
                  />
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 opacity-0 transition-opacity hover:opacity-100">
              <ReactionButton
                emoji=""
                count={0}
                users={[]}
                messageId={message.id}
                channelId={channel.id}
                isAddButton
              />
              {message.userId === currentUser?.id && (
                <>
                  <button
                    onClick={() => {
                      const newContent = prompt('メッセージを編集:', message.content)
                      if (newContent && newContent !== message.content) {
                        handleEditMessage(message.id, newContent)
                      }
                    }}
                    className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(message.id)}
                    className="rounded border border-red-300 px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                  >
                    削除
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput onSend={handleSendMessage} />
    </div>
  )
}
