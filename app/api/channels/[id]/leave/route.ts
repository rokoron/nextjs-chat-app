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
        { error: 'このチャンネルに参加していません' },
        { status: 400 }
      )
    }

    await prisma.channelMember.delete({
      where: {
        id: member.id,
      },
    })

    return NextResponse.json({ message: 'チャンネルから退出しました' })
  } catch (error) {
    console.error('Leave channel error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
