-- AlterTable
ALTER TABLE "Journal" ADD COLUMN     "mood" TEXT,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "wordCount" INTEGER;
