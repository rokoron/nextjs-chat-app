import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sseManager } from '@/lib/sse'

export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  const user = await getAuthUser(request)
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const channel = await prisma.channel.findUnique({
    where: { id: params.channelId },
  })

  if (!channel) {
    return new Response('Channel not found', { status: 404 })
  }

  if (channel.isPrivate) {
    const member = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId: params.channelId,
          userId: user.id,
        },
      },
    })
    if (!member) {
      return new Response('Forbidden', { status: 403 })
    }
  }

  const stream = new ReadableStream({
    start(controller) {
      sseManager.addClient(params.channelId, controller)

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': keepalive\n\n'))
        } catch {
          clearInterval(keepAlive)
          sseManager.removeClient(params.channelId, controller)
        }
      }, 30000)

      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive)
        sseManager.removeClient(params.channelId, controller)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
