import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { sseManager } from '@/lib/sse'
import { z } from 'zod'

const updateMessageSchema = z.object({
  content: z.string().min(1).max(5000),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const { content } = updateMessageSchema.parse(body)

    const message = await prisma.message.findUnique({
      where: { id: params.id },
    })

    if (!message) {
      return NextResponse.json(
        { error: 'メッセージが見つかりません' },
        { status: 404 }
      )
    }

    if (message.userId !== user.id) {
      return NextResponse.json(
        { error: 'このメッセージを編集する権限がありません' },
        { status: 403 }
      )
    }

    const updatedMessage = await prisma.message.update({
      where: { id: params.id },
      data: { content },
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

    sseManager.broadcast(updatedMessage.channelId, {
      type: 'message_updated',
      data: updatedMessage,
    })

    return NextResponse.json({ message: updatedMessage })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Update message error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 }
      )
    }

    const message = await prisma.message.findUnique({
      where: { id: params.id },
    })

    if (!message) {
      return NextResponse.json(
        { error: 'メッセージが見つかりません' },
        { status: 404 }
      )
    }

    if (message.userId !== user.id) {
      return NextResponse.json(
        { error: 'このメッセージを削除する権限がありません' },
        { status: 403 }
      )
    }

    await prisma.message.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    sseManager.broadcast(message.channelId, {
      type: 'message_deleted',
      data: { messageId: params.id, channelId: message.channelId },
    })

    return NextResponse.json({ message: 'メッセージを削除しました' })
  } catch (error) {
    console.error('Delete message error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
