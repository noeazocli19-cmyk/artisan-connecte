import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
    const { db } = await import('@/lib/db')
    if (!db) { return NextResponse.json({ error: 'Base de données non disponible' }, { status: 503 }) }
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const method = searchParams.get('method')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: Record<string, unknown> = { userId: payload.userId }
    if (status) where.status = status
    if (method) where.method = method

    const payments = await db.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await db.payment.count({ where })

    // Calculate summary stats
    const completedPayments = await db.payment.findMany({
      where: { userId: payload.userId, status: 'completed' },
    })

    const totalSpent = completedPayments
      .filter(p => p.method !== 'cash')
      .reduce((sum, p) => sum + p.amount, 0)

    const totalReceived = completedPayments
      .filter(p => p.recipientId === payload.userId)
      .reduce((sum, p) => sum + p.amount, 0)

    const pendingCount = await db.payment.count({
      where: { userId: payload.userId, status: { in: ['pending', 'processing'] } },
    })

    return NextResponse.json({
      payments,
      total,
      summary: {
        totalSpent,
        totalReceived,
        pendingCount,
        balance: totalReceived - totalSpent,
      },
    })
  } catch (error) {
    console.error('Payment history error:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement' }, { status: 500 })
  }
}

