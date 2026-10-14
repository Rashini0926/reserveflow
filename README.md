# ReserveFlow

ReserveFlow is a resource reservation management system built with Next.js 16, TypeScript, Tailwind CSS, PostgreSQL, and Prisma. It helps teams manage shared resources, create bookings, and prevent scheduling conflicts with database-level validation.

## Business goal

The application centralizes resource allocation for shared facilities such as rooms, equipment, labs, or workspaces. It allows users to:

- view available resources
- create and deactivate resources
- make reservations for a resource
- cancel reservations
- prevent overlapping bookings for the same resource
- keep a clear operational record of resource usage

## Tech stack

- Next.js 16 App Router
- TypeScript
- PostgreSQL
- Prisma 7
- Tailwind CSS
- React 19
- Postgres adapter with Prisma driver support

## Key features

- Resource dashboard with active/inactive management
- Reservation form with required attendee details
- Booking validation for time range and resource availability
- Database-enforced constraints to reduce double-booking risk
- Server-side Prisma client for Next.js App Router
- Responsive UI for local assessment/demo usage

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure PostgreSQL

Create a PostgreSQL database named `reserveflow_db` and make sure PostgreSQL is running locally on `localhost:5432`.

Create a local `.env` file in the project root with a connection string like:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/reserveflow_db?schema=public"
```

Do not commit this file. It is already ignored via the repo's `.gitignore` rules.

### 3. Validate and generate Prisma

```bash
npx prisma validate
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run the app

```bash
npm run dev
```

Then open http://localhost:3000

## Database model design

The schema includes two core entities:

- Resource
- Reservation

Each resource can have many reservations, and each reservation belongs to exactly one resource.

## ER diagram

```mermaid
erDiagram
  RESOURCE ||--o{ RESERVATION : has

  RESOURCE {
    UUID id PK
    STRING name
    TEXT description
    STRING type
    INT capacity
    BOOLEAN isActive
    DATETIME createdAt
  }

  RESERVATION {
    UUID id PK
    UUID resourceId FK
    STRING reservedByName
    STRING reservedByEmail
    DATETIME startTime
    DATETIME endTime
    STRING status
    DATETIME createdAt
  }
```

## Database integrity rules

The initial database layer is designed to support safe booking behavior with maintainable rules:

- reservations must have a valid resource reference
- start time must be before end time
- inactive resources cannot accept new active reservations
- overlapping active bookings on the same resource are prevented using a PostgreSQL exclusion constraint
- cancelled reservations remain stored but do not participate in active overlap checks

## Project structure

```text
reserveflow/
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  └─ page.tsx
│  ├─ components/
│  └─ lib/
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ .env
├─ .gitignore
├─ package.json
├─ prisma.config.ts
├─ README.md
└─ tsconfig.json
```

## Verification

Project validation completed successfully with:

```bash
npx tsc --noEmit
npm run build
```

This ensures the app compiles successfully and the Prisma-backed Next.js app remains functional.

## Notes

- Prisma was kept on the compatible stable 7 release for this project.
- The Prisma config follows the valid Prisma 7 `defineConfig` pattern.
- No secrets were committed or exposed in project files or logs.
