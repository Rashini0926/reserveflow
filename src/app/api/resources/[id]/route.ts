import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await _request.json();

  const updateData: { isActive?: boolean } = {};
  if (typeof body?.isActive === 'boolean') {
    updateData.isActive = body.isActive;
  }

  const resource = await prisma.resource.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ resource });
}
