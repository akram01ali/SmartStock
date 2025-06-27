/*
  Warnings:

  - A unique constraint covering the columns `[topComponent,subComponent,root]` on the table `Relationships` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `root` to the `Relationships` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Relationships_topComponent_subComponent_key";

-- AlterTable
ALTER TABLE "Relationships" ADD COLUMN     "root" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Users" (
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Relationships_topComponent_subComponent_root_key" ON "Relationships"("topComponent", "subComponent", "root");
