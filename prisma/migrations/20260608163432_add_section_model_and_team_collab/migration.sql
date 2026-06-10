/*
  Warnings:

  - You are about to alter the column `totalPoints` on the `OverallStanding` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- AlterTable
ALTER TABLE "Competition" ADD COLUMN "config" TEXT;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN "bracketSlot" INTEGER;

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#0891B2',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Section_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OverallStanding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "totalPoints" REAL NOT NULL DEFAULT 0,
    "goldCount" INTEGER NOT NULL DEFAULT 0,
    "silverCount" INTEGER NOT NULL DEFAULT 0,
    "bronzeCount" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OverallStanding_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OverallStanding" ("bronzeCount", "eventId", "goldCount", "id", "rank", "section", "silverCount", "totalPoints", "updatedAt") SELECT "bronzeCount", "eventId", "goldCount", "id", "rank", "section", "silverCount", "totalPoints", "updatedAt" FROM "OverallStanding";
DROP TABLE "OverallStanding";
ALTER TABLE "new_OverallStanding" RENAME TO "OverallStanding";
CREATE UNIQUE INDEX "OverallStanding_eventId_section_key" ON "OverallStanding"("eventId", "section");
CREATE TABLE "new_Ranking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competitionId" TEXT NOT NULL,
    "teamId" TEXT,
    "participantId" TEXT,
    "position" INTEGER NOT NULL,
    "points" REAL NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "bestTime" TEXT,
    "bestScore" REAL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ranking_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ranking_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ranking_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ranking" ("bestTime", "competitionId", "draws", "id", "losses", "participantId", "points", "position", "teamId", "updatedAt", "wins") SELECT "bestTime", "competitionId", "draws", "id", "losses", "participantId", "points", "position", "teamId", "updatedAt", "wins" FROM "Ranking";
DROP TABLE "Ranking";
ALTER TABLE "new_Ranking" RENAME TO "Ranking";
CREATE TABLE "new_Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "section" TEXT,
    "logoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "seedNumber" INTEGER,
    "groupName" TEXT,
    "isCollaboration" BOOLEAN NOT NULL DEFAULT false,
    "sections" TEXT,
    "sectionWeights" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Team_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("competitionId", "createdAt", "groupName", "id", "logoUrl", "name", "section", "seedNumber", "status") SELECT "competitionId", "createdAt", "groupName", "id", "logoUrl", "name", "section", "seedNumber", "status" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Section_eventId_name_key" ON "Section"("eventId", "name");
