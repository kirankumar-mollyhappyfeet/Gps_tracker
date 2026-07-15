-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "homeLat" REAL NOT NULL,
    "homeLng" REAL NOT NULL,
    "geofenceRadiusMeters" INTEGER NOT NULL DEFAULT 150,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vehicle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GpsDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    CONSTRAINT "GpsDevice_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GpsPing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "recordedAt" DATETIME NOT NULL,
    "speed" REAL,
    "ignition" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GpsPing_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LocationBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME,
    "centerLat" REAL NOT NULL,
    "centerLng" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LocationBlock_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "externalRef" TEXT,
    "customerName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "serviceLocationId" TEXT,
    "scheduledAt" DATETIME NOT NULL,
    "technicianName" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceOrder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SiteVisit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "locationBlockId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "arrivedAt" DATETIME,
    "departedAt" DATETIME,
    "dwellMinutes" INTEGER,
    "inFencePingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SiteVisit_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SiteVisit_locationBlockId_fkey" FOREIGN KEY ("locationBlockId") REFERENCES "LocationBlock" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SiteVisitOrderLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteVisitId" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    CONSTRAINT "SiteVisitOrderLink_siteVisitId_fkey" FOREIGN KEY ("siteVisitId") REFERENCES "SiteVisit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SiteVisitOrderLink_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimeAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteVisitId" TEXT NOT NULL,
    "serviceOrderId" TEXT,
    "minutes" INTEGER NOT NULL,
    "isNonBillable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimeAllocation_siteVisitId_fkey" FOREIGN KEY ("siteVisitId") REFERENCES "SiteVisit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TimeAllocation_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimeEditAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteVisitId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT NOT NULL,
    "newValue" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "editedBy" TEXT NOT NULL,
    "editedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimeEditAudit_siteVisitId_fkey" FOREIGN KEY ("siteVisitId") REFERENCES "SiteVisit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GpsDevice_vehicleId_key" ON "GpsDevice"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "GpsDevice_externalId_key" ON "GpsDevice"("externalId");

-- CreateIndex
CREATE INDEX "GpsPing_vehicleId_recordedAt_idx" ON "GpsPing"("vehicleId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GpsPing_deviceId_recordedAt_key" ON "GpsPing"("deviceId", "recordedAt");

-- CreateIndex
CREATE INDEX "LocationBlock_vehicleId_startAt_idx" ON "LocationBlock"("vehicleId", "startAt");

-- CreateIndex
CREATE INDEX "ServiceOrder_vehicleId_scheduledAt_idx" ON "ServiceOrder"("vehicleId", "scheduledAt");

-- CreateIndex
CREATE INDEX "ServiceOrder_serviceLocationId_idx" ON "ServiceOrder"("serviceLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteVisitOrderLink_siteVisitId_serviceOrderId_key" ON "SiteVisitOrderLink"("siteVisitId", "serviceOrderId");
