-- AlterTable
ALTER TABLE `events` ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `postal_code` VARCHAR(191) NULL,
    ADD COLUMN `prefecture` VARCHAR(191) NULL,
    ADD COLUMN `street_address` VARCHAR(191) NULL,
    ADD COLUMN `venue_name` VARCHAR(191) NULL;
