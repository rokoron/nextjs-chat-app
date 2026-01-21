import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { sseManager } from '@/lib/sse'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { messageId: string; emoji: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 }
      )
    }

    const reaction = await prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId: params.messageId,
          userId: user.id,
          emoji: decodeURIComponent(params.emoji),
        },
      },
      include: {
        message: true,
      },
    })

    if (!reaction) {
      return NextResponse.json(
        { error: 'リアクションが見つかりません' },
        { status: 404 }
      )
    }

    await prisma.reaction.delete({
      where: {
        id: reaction.id,
      },
    })

    sseManager.broadcast(reaction.message.channelId, {
      type: 'reaction_removed',
      data: {
        messageId: params.messageId,
        channelId: reaction.message.channelId,
        emoji: decodeURIComponent(params.emoji),
        userId: user.id,
      },
    })

    return NextResponse.json({ message: 'リアクションを削除しました' })
  } catch (error) {
    console.error('Remove reaction error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
