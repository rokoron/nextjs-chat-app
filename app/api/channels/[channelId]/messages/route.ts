import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { sseManager } from '@/lib/sse'
import { z } from 'zod'

const createMessageSchema = z.object({
  content: z.string().min(1).max(5000),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const channel = await prisma.channel.findUnique({
      where: { id: params.channelId },
    })

    if (!channel) {
      return NextResponse.json(
        { error: 'チャンネルが見つかりません' },
        { status: 404 }
      )
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
        return NextResponse.json(
          { error: 'このチャンネルへのアクセス権限がありません' },
          { status: 403 }
        )
      }
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          channelId: params.channelId,
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profileImage: true,
            },
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.message.count({
        where: {
          channelId: params.channelId,
          deletedAt: null,
        },
      }),
    ])

    return NextResponse.json({
      messages: messages.reverse(),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content } = createMessageSchema.parse(body)

    const channel = await prisma.channel.findUnique({
      where: { id: params.channelId },
    })

    if (!channel) {
      return NextResponse.json(
        { error: 'チャンネルが見つかりません' },
        { status: 404 }
      )
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
        return NextResponse.json(
          { error: 'このチャンネルへのアクセス権限がありません' },
          { status: 403 }
        )
      }
    } else {
      const member = await prisma.channelMember.findUnique({
        where: {
          channelId_userId: {
            channelId: params.channelId,
            userId: user.id,
          },
        },
      })
      if (!member) {
        await prisma.channelMember.create({
          data: {
            channelId: params.channelId,
            userId: user.id,
          },
        })
      }
    }

    const message = await prisma.message.create({
      data: {
        channelId: params.channelId,
        userId: user.id,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    })

    sseManager.broadcast(params.channelId, {
      type: 'new_message',
      data: message,
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Create message error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
