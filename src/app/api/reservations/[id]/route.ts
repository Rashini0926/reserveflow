import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const reservation = await prisma.reservation.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  return NextResponse.json({ reservation });
}
