-- CreateTable
CREATE TABLE "Parish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Mass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parishId" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "description" TEXT,
    "maxIntentions" INTEGER NOT NULL DEFAULT 6,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Mass_parishId_fkey" FOREIGN KEY ("parishId") REFERENCES "Parish" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MassIntention" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "massId" TEXT NOT NULL,
    "honoreeName" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "requesterPhone" TEXT,
    "intentionType" TEXT NOT NULL DEFAULT 'LIVING',
    "specialNote" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "pllentyPaymentId" TEXT,
    "amountCents" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MassIntention_massId_fkey" FOREIGN KEY ("massId") REFERENCES "Mass" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
