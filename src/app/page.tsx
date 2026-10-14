import { prisma } from '@/lib/prisma';
import { DashboardClient } from '@/components/reserve-flow-dashboard';

export default async function HomePage() {
  const resources = await prisma.resource.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      reservations: {
        orderBy: { startTime: 'asc' },
      },
    },
  });

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

  return (
    <DashboardClient
      initialResources={resources.map((resource) => ({
        ...resource,
        createdAt: resource.createdAt.toISOString(),
        description: resource.description ?? null,
        reservations: resource.reservations.map((reservation) => ({
          ...reservation,
          createdAt: reservation.createdAt.toISOString(),
          startTime: reservation.startTime.toISOString(),
          endTime: reservation.endTime.toISOString(),
          resource: {
            id: resource.id,
            name: resource.name,
            type: resource.type,
          },
        })),
      }))}
      initialReservations={reservations.map((reservation) => ({
        ...reservation,
        createdAt: reservation.createdAt.toISOString(),
        startTime: reservation.startTime.toISOString(),
        endTime: reservation.endTime.toISOString(),
        resource: reservation.resource ?? undefined,
      }))}
    />
  );
}
