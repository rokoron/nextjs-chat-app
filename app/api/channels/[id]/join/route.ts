import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(
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

    const channel = await prisma.channel.findUnique({
      where: { id: params.id },
    })

    if (!channel) {
      return NextResponse.json(
        { error: 'チャンネルが見つかりません' },
        { status: 404 }
      )
    }

    if (channel.isPrivate) {
      return NextResponse.json(
        { error: 'プライベートチャンネルには招待が必要です' },
        { status: 403 }
      )
    }

    const existingMember = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId: params.id,
          userId: user.id,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: '既にこのチャンネルに参加しています' },
        { status: 400 }
      )
    }

    await prisma.channelMember.create({
      data: {
        channelId: params.id,
        userId: user.id,
      },
    })

    return NextResponse.json({ message: 'チャンネルに参加しました' })
  } catch (error) {
    console.error('Join channel error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
