'use client'

import { useEffect, useState } from 'react'

interface Channel {
  id: string
  name: string
  description?: string | null
  isPrivate: boolean
  creator: {
    id: string
    username: string
  }
}

interface ChannelListProps {
  selectedChannel: Channel | null
  onSelectChannel: (channel: Channel) => void
}

export default function ChannelList({ selectedChannel, onSelectChannel }: ChannelListProps) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [channelName, setChannelName] = useState('')
  const [channelDescription, setChannelDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)

  useEffect(() => {
    fetchChannels()
  }, [])

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/channels')
      if (response.ok) {
        const data = await response.json()
        setChannels(data.channels)
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: channelName,
          description: channelDescription,
          isPrivate: isPrivate,
        }),
      })

      if (response.ok) {
        setChannelName('')
        setChannelDescription('')
        setIsPrivate(false)
        setShowCreateModal(false)
        fetchChannels()
      } else {
        const data = await response.json()
        alert(data.error || 'チャンネルの作成に失敗しました')
      }
    } catch (error) {
      alert('チャンネルの作成に失敗しました')
    }
  }

  if (loading) {
    return <div className="p-4 text-sm text-gray-400">読み込み中...</div>
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-700 p-4">
          <h2 className="text-lg font-semibold">チャンネル</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded bg-blue-600 px-3 py-1 text-xl font-bold text-white hover:bg-blue-700"
          >
            +
          </button>
        </div>
        <div className="p-2">
          {channels.map((channel) => (
            <div
              key={channel.id}
              onClick={() => onSelectChannel(channel)}
              className={`cursor-pointer rounded p-2 hover:bg-gray-700 ${
                selectedChannel?.id === channel.id ? 'bg-gray-700' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-400">#</span>
                <span className="flex-1">{channel.name}</span>
                {channel.isPrivate && <span>🔒</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-xl font-bold text-gray-800">新しいチャンネルを作成</h3>
            <form onSubmit={handleCreateChannel}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  チャンネル名
                </label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  required
                  placeholder="例: general"
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  説明（任意）
                </label>
                <input
                  type="text"
                  value={channelDescription}
                  onChange={(e) => setChannelDescription(e.target.value)}
                  placeholder="チャンネルの説明"
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">プライベートチャンネル</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
                >
                  作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
