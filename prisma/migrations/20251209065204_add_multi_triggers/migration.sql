/*
  Warnings:

  - You are about to drop the column `trigger` on the `command` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Command` DROP COLUMN `trigger`,
    ADD COLUMN `triggers` JSON NOT NULL;
