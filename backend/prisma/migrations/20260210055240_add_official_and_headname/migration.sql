-- CreateTable
CREATE TABLE "Official" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Definitif',
    "title" TEXT NOT NULL DEFAULT 'CAMAT GRABAGAN',
    "rank" TEXT NOT NULL DEFAULT 'Pembina Tingkat I'
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Village" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "villageCode" TEXT NOT NULL,
    "headName" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Village" ("id", "name", "villageCode") SELECT "id", "name", "villageCode" FROM "Village";
DROP TABLE "Village";
ALTER TABLE "new_Village" RENAME TO "Village";
CREATE UNIQUE INDEX "Village_name_key" ON "Village"("name");
CREATE UNIQUE INDEX "Village_villageCode_key" ON "Village"("villageCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
