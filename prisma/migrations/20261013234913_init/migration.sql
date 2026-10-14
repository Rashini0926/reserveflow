-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Resource" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "reservedByName" TEXT NOT NULL,
    "reservedByEmail" TEXT NOT NULL,
    "startTime" TIMESTAMPTZ(3) NOT NULL,
    "endTime" TIMESTAMPTZ(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reservation_resourceId_startTime_endTime_idx" ON "Reservation"("resourceId", "startTime", "endTime");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enforce valid reservation windows and prevent overlapping active bookings.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Reservation"
ADD CONSTRAINT "Reservation_startTime_before_endTime_check"
CHECK ("startTime" < "endTime");

ALTER TABLE "Reservation"
ADD CONSTRAINT "Reservation_no_overlapping_active"
EXCLUDE USING GIST (
    "resourceId" WITH =,
    tstzrange("startTime", "endTime", '[)') WITH &&
)
WHERE ("status" <> 'CANCELLED');

CREATE FUNCTION "reject_reservation_for_inactive_resource"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    resource_is_active BOOLEAN;
BEGIN
    IF NEW."status" <> 'CANCELLED' THEN
        SELECT "isActive"
        INTO resource_is_active
        FROM "Resource"
        WHERE "id" = NEW."resourceId"
        FOR SHARE;

        IF resource_is_active IS DISTINCT FROM TRUE THEN
            RAISE EXCEPTION 'Cannot create an active reservation for an inactive resource'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "Reservation_require_active_resource"
BEFORE INSERT OR UPDATE OF "resourceId", "status"
ON "Reservation"
FOR EACH ROW
EXECUTE FUNCTION "reject_reservation_for_inactive_resource"();
