import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET() {
  const resources = await prisma.resource.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      reservations: {
        orderBy: { startTime: 'asc' },
      },
    },
  });

  return NextResponse.json({ resources });
}

export async function POST(request: Request) {
  const body = await request.json();

  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const type = typeof body?.type === 'string' ? body.type.trim() : '';
  const description =
    typeof body?.description === 'string' ? body.description.trim() : null;
  const capacity =
    body?.capacity === null || body?.capacity === undefined
      ? null
      : Number(body.capacity);
  const isActive = body?.isActive !== false;

  if (!name || !type) {
    return NextResponse.json(
      { error: 'Resource name and type are required.' },
      { status: 400 },
    );
  }

  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) {
    return NextResponse.json(
      { error: 'Capacity must be a positive integer or empty.' },
      { status: 400 },
    );
  }

  const resource = await prisma.resource.create({
    data: {
      name,
      description: description || null,
      type,
      capacity,
      isActive,
    },
  });

  return NextResponse.json({ resource }, { status: 201 });
}
