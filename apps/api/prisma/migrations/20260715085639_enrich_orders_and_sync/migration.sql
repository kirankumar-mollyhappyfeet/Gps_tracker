-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ServiceOrder" (
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
    "jobDescription" TEXT NOT NULL DEFAULT '',
    "keyBoxLocation" TEXT,
    "accessCodes" TEXT,
    "parkingInfo" TEXT,
    "onSiteContact" TEXT,
    "onSitePhone" TEXT,
    "safetyNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceOrder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ServiceOrder" ("address", "createdAt", "customerName", "externalRef", "id", "lat", "lng", "organizationId", "scheduledAt", "serviceLocationId", "status", "technicianName", "vehicleId") SELECT "address", "createdAt", "customerName", "externalRef", "id", "lat", "lng", "organizationId", "scheduledAt", "serviceLocationId", "status", "technicianName", "vehicleId" FROM "ServiceOrder";
DROP TABLE "ServiceOrder";
ALTER TABLE "new_ServiceOrder" RENAME TO "ServiceOrder";
CREATE INDEX "ServiceOrder_vehicleId_scheduledAt_idx" ON "ServiceOrder"("vehicleId", "scheduledAt");
CREATE INDEX "ServiceOrder_serviceLocationId_idx" ON "ServiceOrder"("serviceLocationId");
CREATE TABLE "new_SiteVisit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "locationBlockId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "arrivedAt" DATETIME,
    "departedAt" DATETIME,
    "lastInFenceAt" DATETIME,
    "dwellMinutes" INTEGER,
    "inFencePingCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "syncStatus" TEXT NOT NULL DEFAULT 'none',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SiteVisit_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SiteVisit_locationBlockId_fkey" FOREIGN KEY ("locationBlockId") REFERENCES "LocationBlock" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SiteVisit" ("arrivedAt", "createdAt", "departedAt", "dwellMinutes", "id", "inFencePingCount", "lastInFenceAt", "locationBlockId", "status", "updatedAt", "vehicleId") SELECT "arrivedAt", "createdAt", "departedAt", "dwellMinutes", "id", "inFencePingCount", "lastInFenceAt", "locationBlockId", "status", "updatedAt", "vehicleId" FROM "SiteVisit";
DROP TABLE "SiteVisit";
ALTER TABLE "new_SiteVisit" RENAME TO "SiteVisit";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
