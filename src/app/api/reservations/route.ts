import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET() {
  const reservations = await prisma.reservation.findMany({
    orderBy: { startTime: 'asc' },
    include: {
      resource: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  return NextResponse.json({ reservations });
}

export async function POST(request: Request) {
  const body = await request.json();
  const resourceId = typeof body?.resourceId === 'string' ? body.resourceId : '';
  const reservedByName =
    typeof body?.reservedByName === 'string' ? body.reservedByName.trim() : '';
  const reservedByEmail =
    typeof body?.reservedByEmail === 'string' ? body.reservedByEmail.trim() : '';
  const startTimeRaw = typeof body?.startTime === 'string' ? body.startTime : '';
  const endTimeRaw = typeof body?.endTime === 'string' ? body.endTime : '';

  if (!resourceId || !reservedByName || !reservedByEmail || !startTimeRaw || !endTimeRaw) {
    return NextResponse.json(
      { error: 'Resource, attendee name, email, start time, and end time are required.' },
      { status: 400 },
    );
  }

  const startTime = new Date(startTimeRaw);
  const endTime = new Date(endTimeRaw);

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return NextResponse.json(
      { error: 'Start and end time must be valid datetimes.' },
      { status: 400 },
    );
  }

  if (startTime >= endTime) {
    return NextResponse.json(
      { error: 'Reservation end time must be later than the start time.' },
      { status: 400 },
    );
  }

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: { isActive: true },
  });

  if (!resource) {
    return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });
  }

  if (!resource.isActive) {
    return NextResponse.json(
      { error: 'This resource is inactive and cannot accept new reservations.' },
      { status: 409 },
    );
  }

  try {
    const reservation = await prisma.reservation.create({
      data: {
        resourceId,
        reservedByName,
        reservedByEmail,
        startTime,
        endTime,
        status: 'CONFIRMED',
      },
      include: {
        resource: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('overlapping') || message.includes('inactive resource')) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: 'Unable to create reservation.' }, { status: 400 });
  }
}
