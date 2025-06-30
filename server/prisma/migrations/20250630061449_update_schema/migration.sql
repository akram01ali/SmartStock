-- CreateTable
CREATE TABLE "AppUser" (
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "password" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_name_surname_key" ON "AppUser"("name", "surname");
