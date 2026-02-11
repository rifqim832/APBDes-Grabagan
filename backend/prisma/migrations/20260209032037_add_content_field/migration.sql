-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Surat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nomor" TEXT NOT NULL,
    "perihal" TEXT NOT NULL,
    "tanggal" DATETIME NOT NULL,
    "desaId" INTEGER NOT NULL,
    "anggaran" DECIMAL NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL DEFAULT '',
    "tipe" TEXT NOT NULL DEFAULT 'KELUAR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Surat_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "Desa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Surat" ("anggaran", "createdAt", "desaId", "id", "nomor", "perihal", "tanggal", "tipe") SELECT "anggaran", "createdAt", "desaId", "id", "nomor", "perihal", "tanggal", "tipe" FROM "Surat";
DROP TABLE "Surat";
ALTER TABLE "new_Surat" RENAME TO "Surat";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
