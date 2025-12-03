-- AlterTable
ALTER TABLE `events` ADD COLUMN `entry_selection_method` VARCHAR(191) NOT NULL DEFAULT 'FIRST_COME',
    ADD COLUMN `max_participants` INTEGER NULL;
