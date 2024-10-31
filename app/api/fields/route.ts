import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const fields = await prisma.field.findMany()
    return NextResponse.json(fields)
  } catch (error) {
    console.error('Failed to fetch fields:', error)
    return NextResponse.json({ error: 'Failed to fetch fields' }, { status: 500 })
  }
}