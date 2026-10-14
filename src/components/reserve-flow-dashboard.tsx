'use client';

import { useMemo, useState } from 'react';

type ResourceRecord = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  capacity: number | null;
  isActive: boolean;
  createdAt: string;
  reservations: ReservationRecord[];
};

type ReservationRecord = {
  id: string;
  resourceId: string;
  reservedByName: string;
  reservedByEmail: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  resource?: { id: string; name: string; type: string };
};

type DashboardClientProps = {
  initialResources: ResourceRecord[];
  initialReservations: ReservationRecord[];
};

export function DashboardClient({
  initialResources,
  initialReservations,
}: DashboardClientProps) {
  const [resources, setResources] = useState(initialResources);
  const [reservations, setReservations] = useState(initialReservations);
  const [resourceError, setResourceError] = useState('');
  const [reservationError, setReservationError] = useState('');
  const [resourceForm, setResourceForm] = useState({
    name: '',
    description: '',
    type: '',
    capacity: '',
    isActive: true,
  });
  const [reservationForm, setReservationForm] = useState({
    resourceId: initialResources[0]?.id ?? '',
    reservedByName: '',
    reservedByEmail: '',
    startTime: '',
    endTime: '',
  });

  const metrics = useMemo(() => {
    const activeResources = resources.filter((resource) => resource.isActive).length;
    const confirmedReservations = reservations.filter(
      (reservation) => reservation.status !== 'CANCELLED',
    ).length;
    const nextReservation = [...reservations]
      .filter((reservation) => reservation.status !== 'CANCELLED')
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      )[0];

    return {
      totalResources: resources.length,
      activeResources,
      confirmedReservations,
      nextReservation,
    };
  }, [reservations, resources]);

  const handleResourceChange = (
    field: keyof typeof resourceForm,
    value: string | boolean,
  ) => {
    setResourceForm((current) => ({ ...current, [field]: value }));
  };

  const handleReservationChange = (
    field: keyof typeof reservationForm,
    value: string,
  ) => {
    setReservationForm((current) => ({ ...current, [field]: value }));
  };

  const refreshData = async () => {
    const [resourceRes, reservationRes] = await Promise.all([
      fetch('/api/resources'),
      fetch('/api/reservations'),
    ]);

    const [resourcePayload, reservationPayload] = await Promise.all([
      resourceRes.json(),
      reservationRes.json(),
    ]);

    const refreshedResources = Array.isArray(resourcePayload.resources)
      ? resourcePayload.resources
      : [];
    const refreshedReservations = Array.isArray(reservationPayload.reservations)
      ? reservationPayload.reservations
      : [];

    setResources(refreshedResources);
    setReservations(refreshedReservations);
    if (refreshedResources.length > 0) {
      setReservationForm((current) => ({
        ...current,
        resourceId: current.resourceId || refreshedResources[0].id,
      }));
    }
  };

  const submitResource = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResourceError('');

    const payload = {
      name: resourceForm.name.trim(),
      description: resourceForm.description.trim(),
      type: resourceForm.type.trim(),
      capacity: resourceForm.capacity ? Number(resourceForm.capacity) : null,
      isActive: resourceForm.isActive,
    };

    const response = await fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      setResourceError(result?.error ?? 'Unable to create resource.');
      return;
    }

    setResourceForm({
      name: '',
      description: '',
      type: '',
      capacity: '',
      isActive: true,
    });
    await refreshData();
  };

  const submitReservation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReservationError('');

    const payload = {
      resourceId: reservationForm.resourceId,
      reservedByName: reservationForm.reservedByName.trim(),
      reservedByEmail: reservationForm.reservedByEmail.trim(),
      startTime: reservationForm.startTime,
      endTime: reservationForm.endTime,
    };

    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      setReservationError(result?.error ?? 'Unable to create reservation.');
      return;
    }

    setReservationForm((current) => ({
      ...current,
      reservedByName: '',
      reservedByEmail: '',
      startTime: '',
      endTime: '',
    }));
    await refreshData();
  };

  const toggleResourceStatus = async (resourceId: string, isActive: boolean) => {
    const response = await fetch(`/api/resources/${resourceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    });

    if (response.ok) {
      await refreshData();
    }
  };

  const cancelReservation = async (reservationId: string) => {
    const response = await fetch(`/api/reservations/${reservationId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      await refreshData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/20 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
              ReserveFlow
            </p>
            <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
              Resource reservation dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300">
              Operational
            </span>
            <span>{new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Resources" value={String(metrics.totalResources)} tone="cyan" />
          <MetricCard label="Active" value={String(metrics.activeResources)} tone="emerald" />
          <MetricCard label="Bookings" value={String(metrics.confirmedReservations)} tone="violet" />
          <MetricCard
            label="Next booking"
            value={metrics.nextReservation ? new Date(metrics.nextReservation.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
            tone="amber"
          />
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Resources</h2>
                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                  {resources.length} items
                </span>
              </div>

              {resources.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
                  No resources created yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-white">{resource.name}</h3>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                resource.isActive
                                  ? 'bg-emerald-500/10 text-emerald-300'
                                  : 'bg-amber-500/10 text-amber-300'
                              }`}
                            >
                              {resource.isActive ? 'Open' : 'Inactive'}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-300">
                            {resource.type}
                            {resource.capacity ? ` • Capacity ${resource.capacity}` : ''}
                          </p>
                          {resource.description ? (
                            <p className="mt-2 max-w-lg text-sm text-slate-400">
                              {resource.description}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
                            onClick={() =>
                              toggleResourceStatus(resource.id, !resource.isActive)
                            }
                          >
                            {resource.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {resource.reservations.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            No active reservations scheduled.
                          </p>
                        ) : (
                          resource.reservations.map((reservation) => (
                            <div
                              key={reservation.id}
                              className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="font-medium text-white">
                                  {reservation.reservedByName}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {new Date(reservation.startTime).toLocaleString(undefined, {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })}{' '}
                                  –{' '}
                                  {new Date(reservation.endTime).toLocaleString(undefined, {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })}
                                </p>
                              </div>
                              <span className="rounded-full bg-violet-500/10 px-2 py-1 text-xs text-violet-300">
                                {reservation.status}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <h2 className="text-xl font-semibold">Add resource</h2>
              <form className="mt-4 space-y-4" onSubmit={submitResource}>
                <InputField
                  label="Name"
                  value={resourceForm.name}
                  onChange={(value) => handleResourceChange('name', value)}
                />
                <InputField
                  label="Type"
                  value={resourceForm.type}
                  onChange={(value) => handleResourceChange('type', value)}
                />
                <InputField
                  label="Capacity"
                  type="number"
                  min={1}
                  value={resourceForm.capacity}
                  onChange={(value) => handleResourceChange('capacity', value)}
                />
                <textarea
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                  placeholder="Description"
                  rows={3}
                  value={resourceForm.description}
                  onChange={(event) =>
                    handleResourceChange('description', event.target.value)
                  }
                />
                <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={resourceForm.isActive}
                    onChange={(event) =>
                      handleResourceChange('isActive', event.target.checked)
                    }
                  />
                  Resource is available for bookings
                </label>
                {resourceError ? (
                  <p className="text-sm text-rose-300">{resourceError}</p>
                ) : null}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  Save resource
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <h2 className="text-xl font-semibold">Create reservation</h2>
              <form className="mt-4 space-y-4" onSubmit={submitReservation}>
                <label className="block text-sm text-slate-300">
                  Resource
                  <select
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
                    value={reservationForm.resourceId}
                    onChange={(event) =>
                      handleReservationChange('resourceId', event.target.value)
                    }
                  >
                    {resources.length === 0 ? (
                      <option value="">Create a resource first</option>
                    ) : (
                      resources.map((resource) => (
                        <option key={resource.id} value={resource.id}>
                          {resource.name}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <InputField
                  label="Reserved by"
                  value={reservationForm.reservedByName}
                  onChange={(value) => handleReservationChange('reservedByName', value)}
                />
                <InputField
                  label="Email"
                  type="email"
                  value={reservationForm.reservedByEmail}
                  onChange={(value) => handleReservationChange('reservedByEmail', value)}
                />
                <InputField
                  label="Start time"
                  type="datetime-local"
                  value={reservationForm.startTime}
                  onChange={(value) => handleReservationChange('startTime', value)}
                />
                <InputField
                  label="End time"
                  type="datetime-local"
                  value={reservationForm.endTime}
                  onChange={(value) => handleReservationChange('endTime', value)}
                />
                {reservationError ? (
                  <p className="text-sm text-rose-300">{reservationError}</p>
                ) : null}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!reservationForm.resourceId}
                >
                  Reserve resource
                </button>
              </form>
            </div>
          </aside>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upcoming reservations</h2>
            <span className="text-sm text-slate-400">
              {reservations.filter((reservation) => reservation.status !== 'CANCELLED').length} active
            </span>
          </div>

          {reservations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
              No reservations created yet.
            </div>
          ) : (
            <div className="space-y-3">
              {reservations
                .sort(
                  (a, b) =>
                    new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
                )
                .map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">
                          {reservation.resource?.name ?? 'Resource'}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            reservation.status === 'CANCELLED'
                              ? 'bg-rose-500/10 text-rose-300'
                              : 'bg-emerald-500/10 text-emerald-300'
                          }`}
                        >
                          {reservation.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">
                        {reservation.reservedByName} · {reservation.reservedByEmail}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(reservation.startTime).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}{' '}
                        to{' '}
                        {new Date(reservation.endTime).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>

                    {reservation.status !== 'CANCELLED' ? (
                      <button
                        type="button"
                        onClick={() => cancelReservation(reservation.id)}
                        className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 transition hover:border-rose-400 hover:bg-rose-500/20"
                      >
                        Cancel booking
                      </button>
                    ) : null}
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'cyan' | 'emerald' | 'violet' | 'amber';
}) {
  const tones = {
    cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    violet: 'border-violet-500/30 bg-violet-500/10 text-violet-200',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  };

  return (
    <div className={`rounded-3xl border p-4 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-300">{label}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function InputField({
  label,
  value,
  type = 'text',
  min,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  min?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm text-slate-300">
      {label}
      <input
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
      />
    </label>
  );
}
