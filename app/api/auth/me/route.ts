import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)

  if (!user) {
    return NextResponse.json(
      { error: '認証されていません' },
      { status: 401 }
    )
  }

  return NextResponse.json({ user })
}
