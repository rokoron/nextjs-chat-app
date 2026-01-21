'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ChannelList from '@/components/ChannelList'
import MessageList from '@/components/MessageList'

interface User {
  id: string
  email: string
  username: string
  profileImage?: string | null
}

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        router.push('/login')
      }
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex w-64 flex-col bg-gray-800 text-white">
        <div className="border-b border-gray-700 p-4">
          <h1 className="mb-2 text-xl font-bold">Chat App</h1>
          <div className="flex items-center justify-between">
            <span className="text-sm">{user.username}</span>
            <button
              onClick={handleLogout}
              className="rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600"
            >
              ログアウト
            </button>
          </div>
        </div>
        <ChannelList
          selectedChannel={selectedChannel}
          onSelectChannel={setSelectedChannel}
        />
      </div>
      <div className="flex flex-1 flex-col">
        <MessageList channel={selectedChannel} />
      </div>
    </div>
  )
}
