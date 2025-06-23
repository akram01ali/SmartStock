-- CreateEnum
CREATE TYPE "Measures" AS ENUM ('centimeters', 'meters', 'amount');

-- CreateEnum
CREATE TYPE "TypeOfComponent" AS ENUM ('printer', 'group', 'component');

-- CreateTable
CREATE TABLE "Components" (
    "componentName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "measure" "Measures" NOT NULL,
    "lastScanned" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannedBy" TEXT NOT NULL,
    "durationOfDevelopment" INTEGER NOT NULL,
    "triggerMinAmount" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "type" "TypeOfComponent" NOT NULL
);

-- CreateTable
CREATE TABLE "ComponentHistory" (
    "componentName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "scanned" TIMESTAMP(3) NOT NULL,
    "scannedBy" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Relationships" (
    "topComponent" TEXT NOT NULL,
    "subComponent" TEXT NOT NULL,
    "amount" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Components_componentName_key" ON "Components"("componentName");

-- CreateIndex
CREATE UNIQUE INDEX "ComponentHistory_componentName_amount_scanned_scannedBy_key" ON "ComponentHistory"("componentName", "amount", "scanned", "scannedBy");

-- CreateIndex
CREATE UNIQUE INDEX "Relationships_topComponent_subComponent_key" ON "Relationships"("topComponent", "subComponent");
