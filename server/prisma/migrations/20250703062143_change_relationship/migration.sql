/*
  Warnings:

  - You are about to drop the column `root` on the `Relationships` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[topComponent,subComponent]` on the table `Relationships` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Relationships_topComponent_subComponent_root_key";

-- AlterTable
ALTER TABLE "Relationships" DROP COLUMN "root";

-- CreateIndex
CREATE UNIQUE INDEX "Relationships_topComponent_subComponent_key" ON "Relationships"("topComponent", "subComponent");
