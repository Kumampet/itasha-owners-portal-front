-- AlterTable
ALTER TABLE `events` ADD COLUMN `created_by_user_id` VARCHAR(36) NULL;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
