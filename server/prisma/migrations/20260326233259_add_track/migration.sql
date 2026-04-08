-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "currentTrackIndex" INTEGER NOT NULL DEFAULT -1;

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "youtubeUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
