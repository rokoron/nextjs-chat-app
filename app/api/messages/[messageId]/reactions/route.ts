import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { sseManager } from '@/lib/sse'
import { z } from 'zod'

const createReactionSchema = z.object({
  emoji: z.string().min(1).max(10),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const reactions = await prisma.reaction.findMany({
      where: { messageId: params.messageId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    const groupedReactions = reactions.reduce((acc, reaction) => {
      const emoji = reaction.emoji
      if (!acc[emoji]) {
        acc[emoji] = {
          emoji,
          users: [],
          count: 0,
        }
      }
      acc[emoji].users.push(reaction.user)
      acc[emoji].count++
      return acc
    }, {} as Record<string, { emoji: string; users: any[]; count: number }>)

    return NextResponse.json({ reactions: Object.values(groupedReactions) })
  } catch (error) {
    console.error('Get reactions error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { messageId: string } }
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
    const { emoji } = createReactionSchema.parse(body)

    const message = await prisma.message.findUnique({
      where: { id: params.messageId },
    })

    if (!message) {
      return NextResponse.json(
        { error: 'メッセージが見つかりません' },
        { status: 404 }
      )
    }

    const channelMember = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId: message.channelId,
          userId: user.id,
        },
      },
    })

    if (!channelMember) {
      return NextResponse.json(
        { error: 'このチャンネルへのアクセス権限がありません' },
        { status: 403 }
      )
    }

    const existingReaction = await prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId: params.messageId,
          userId: user.id,
          emoji,
        },
      },
    })

    if (existingReaction) {
      return NextResponse.json(
        { error: '既にこのリアクションを追加しています' },
        { status: 400 }
      )
    }

    const reaction = await prisma.reaction.create({
      data: {
        messageId: params.messageId,
        userId: user.id,
        emoji,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    sseManager.broadcast(message.channelId, {
      type: 'reaction_added',
      data: { messageId: params.messageId, channelId: message.channelId, reaction },
    })

    return NextResponse.json({ reaction }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Add reaction error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
