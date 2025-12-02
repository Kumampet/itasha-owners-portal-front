-- AlterTable
ALTER TABLE `event_entries` MODIFY `entry_deadline_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `events` ADD COLUMN `payment_methods` JSON NULL;
