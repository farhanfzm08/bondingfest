/*
  Warnings:

  - You are about to drop the column `institution` on the `Champion` table. All the data in the column will be lost.
  - You are about to alter the column `score` on the `MatchParticipant` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to drop the column `institution` on the `OverallStanding` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `contact` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `institution` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `photoUrl` on the `Participant` table. All the data in the column will be lost.
  - You are about to alter the column `points` on the `Ranking` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to drop the column `institution` on the `Team` table. All the data in the column will be lost.
  - Added the required column `section` to the `OverallStanding` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Match" ADD COLUMN "groupName" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Champion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competitionId" TEXT NOT NULL,
    "teamId" TEXT,
    "participantId" TEXT,
    "position" INTEGER NOT NULL,
    "awardPoints" INTEGER NOT NULL DEFAULT 0,
    "section" TEXT,
    "awardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Champion_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Champion_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Champion_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Champion" ("awardPoints", "awardedAt", "competitionId", "id", "participantId", "position", "teamId") SELECT "awardPoints", "awardedAt", "competitionId", "id", "participantId", "position", "teamId" FROM "Champion";
DROP TABLE "Champion";
ALTER TABLE "new_Champion" RENAME TO "Champion";
CREATE TABLE "new_Competition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "type" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "format" TEXT NOT NULL DEFAULT 'BRACKET',
    "category" TEXT,
    "maxParticipants" INTEGER,
    "registrationDeadline" DATETIME,
    "rules" TEXT,
    "venue" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Competition_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Competition" ("bannerUrl", "category", "createdAt", "description", "eventId", "id", "logoUrl", "maxParticipants", "name", "order", "registrationDeadline", "rules", "slug", "status", "type", "updatedAt", "venue") SELECT "bannerUrl", "category", "createdAt", "description", "eventId", "id", "logoUrl", "maxParticipants", "name", "order", "registrationDeadline", "rules", "slug", "status", "type", "updatedAt", "venue" FROM "Competition";
DROP TABLE "Competition";
ALTER TABLE "new_Competition" RENAME TO "Competition";
CREATE UNIQUE INDEX "Competition_eventId_slug_key" ON "Competition"("eventId", "slug");
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'BONDING EVENT 2026',
    "slug" TEXT NOT NULL DEFAULT 'bonding-event-2026',
    "description" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "themeColor" TEXT NOT NULL DEFAULT '#0891B2',
    "pointSystem" TEXT NOT NULL DEFAULT '{"first":100,"second":75,"third":50}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Event" ("bannerUrl", "createdAt", "description", "endDate", "id", "location", "logoUrl", "name", "pointSystem", "slug", "startDate", "status", "themeColor", "updatedAt") SELECT "bannerUrl", "createdAt", "description", "endDate", "id", "location", "logoUrl", "name", "pointSystem", "slug", "startDate", "status", "themeColor", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
CREATE TABLE "new_MatchParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT,
    "participantId" TEXT,
    "score" REAL NOT NULL DEFAULT 0,
    "result" TEXT,
    "timeResult" TEXT,
    "details" TEXT,
    CONSTRAINT "MatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MatchParticipant_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MatchParticipant_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MatchParticipant" ("details", "id", "matchId", "participantId", "result", "score", "teamId") SELECT "details", "id", "matchId", "participantId", "result", "score", "teamId" FROM "MatchParticipant";
DROP TABLE "MatchParticipant";
ALTER TABLE "new_MatchParticipant" RENAME TO "MatchParticipant";
CREATE TABLE "new_OverallStanding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "goldCount" INTEGER NOT NULL DEFAULT 0,
    "silverCount" INTEGER NOT NULL DEFAULT 0,
    "bronzeCount" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OverallStanding_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OverallStanding" ("bronzeCount", "eventId", "goldCount", "id", "rank", "silverCount", "totalPoints", "updatedAt") SELECT "bronzeCount", "eventId", "goldCount", "id", "rank", "silverCount", "totalPoints", "updatedAt" FROM "OverallStanding";
DROP TABLE "OverallStanding";
ALTER TABLE "new_OverallStanding" RENAME TO "OverallStanding";
CREATE UNIQUE INDEX "OverallStanding_eventId_section_key" ON "OverallStanding"("eventId", "section");
CREATE TABLE "new_Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "npk" TEXT,
    "section" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Participant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Participant" ("createdAt", "eventId", "id", "name") SELECT "createdAt", "eventId", "id", "name" FROM "Participant";
DROP TABLE "Participant";
ALTER TABLE "new_Participant" RENAME TO "Participant";
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
    "bestTime" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ranking_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ranking_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ranking_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ranking" ("competitionId", "draws", "id", "losses", "participantId", "points", "position", "teamId", "updatedAt", "wins") SELECT "competitionId", "draws", "id", "losses", "participantId", "points", "position", "teamId", "updatedAt", "wins" FROM "Ranking";
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Team_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("competitionId", "createdAt", "id", "logoUrl", "name", "seedNumber", "status") SELECT "competitionId", "createdAt", "id", "logoUrl", "name", "seedNumber", "status" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
