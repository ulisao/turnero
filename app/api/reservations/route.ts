import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const fieldId = searchParams.get('fieldId')

  if (!date || !fieldId) {
    return NextResponse.json({ error: 'Date and field ID are required' }, { status: 400 })
  }

  try {
    const reservations = await prisma.reservation.findMany({
      where: {
        date: new Date(date),
        fieldId: fieldId,
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    })

    return NextResponse.json(reservations)
  } catch (error) {
    console.error('Failed to fetch reservations:', error)
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { date, startTime, endTime, fieldId, userId } = await request.json()

    if (!date || !startTime || !endTime || !fieldId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existingReservation = await prisma.reservation.findFirst({
      where: {
        date: new Date(date),
        fieldId: fieldId,
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime }
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime }
          }
        ]
      },
    })

    if (existingReservation) {
      return NextResponse.json({ error: 'This time slot is already reserved' }, { status: 409 })
    }

    const newReservation = await prisma.reservation.create({
      data: {
        date: new Date(date),
        startTime,
        endTime,
        fieldId,
        userId,
      },
    })

    return NextResponse.json(newReservation, { status: 201 })
  } catch (error) {
    console.error('Failed to create reservation:', error)
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 })
  }
}