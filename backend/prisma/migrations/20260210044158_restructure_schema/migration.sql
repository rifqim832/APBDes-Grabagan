/*
  Warnings:

  - You are about to drop the `Desa` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Surat` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Desa";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Surat";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Village" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "villageCode" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "IncomingLetter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referenceNo" TEXT NOT NULL,
    "letterDate" DATETIME NOT NULL,
    "totalBudget" REAL NOT NULL DEFAULT 0,
    "receivedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "villageId" INTEGER NOT NULL,
    CONSTRAINT "IncomingLetter_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OutgoingLetter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "letterNo" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "letterDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalBudget" REAL NOT NULL DEFAULT 0,
    "villageId" INTEGER NOT NULL,
    "incomingLetterId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OutgoingLetter_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OutgoingLetter_incomingLetterId_fkey" FOREIGN KEY ("incomingLetterId") REFERENCES "IncomingLetter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpmEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "indexNo" INTEGER NOT NULL,
    "spmNo" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "outgoingLetterId" TEXT NOT NULL,
    CONSTRAINT "SpmEntry_outgoingLetterId_fkey" FOREIGN KEY ("outgoingLetterId") REFERENCES "OutgoingLetter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Village_name_key" ON "Village"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Village_villageCode_key" ON "Village"("villageCode");

-- CreateIndex
CREATE UNIQUE INDEX "OutgoingLetter_letterNo_key" ON "OutgoingLetter"("letterNo");

-- CreateIndex
CREATE UNIQUE INDEX "OutgoingLetter_incomingLetterId_key" ON "OutgoingLetter"("incomingLetterId");
