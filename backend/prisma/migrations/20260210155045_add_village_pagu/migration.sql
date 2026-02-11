-- CreateTable
CREATE TABLE "VillagePagu" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "villageId" INTEGER NOT NULL,
    CONSTRAINT "VillagePagu_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "Village" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "VillagePagu_villageId_year_key" ON "VillagePagu"("villageId", "year");
