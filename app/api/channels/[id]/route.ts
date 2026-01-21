import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(
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
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
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
            channelId: params.id,
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

    return NextResponse.json({ channel })
  } catch (error) {
    console.error('Get channel error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
