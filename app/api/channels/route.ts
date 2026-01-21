import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const createChannelSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 }
      )
    }

    const publicChannels = await prisma.channel.findMany({
      where: { isPrivate: false },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const userChannels = await prisma.channelMember.findMany({
      where: { userId: user.id },
      include: {
        channel: {
          include: {
            creator: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    })

    const privateChannels = userChannels
      .map((cm) => cm.channel)
      .filter((ch) => ch && ch.isPrivate)

    const allChannels = [...publicChannels, ...privateChannels]

    return NextResponse.json({ channels: allChannels })
  } catch (error) {
    console.error('Get channels error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, isPrivate } = createChannelSchema.parse(body)

    const existingChannel = await prisma.channel.findUnique({
      where: { name },
    })

    if (existingChannel) {
      return NextResponse.json(
        { error: 'このチャンネル名は既に使用されています' },
        { status: 400 }
      )
    }

    const channel = await prisma.channel.create({
      data: {
        name,
        description: description || null,
        isPrivate: isPrivate || false,
        createdBy: user.id,
        members: {
          create: {
            userId: user.id,
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    return NextResponse.json({ channel }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Create channel error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
