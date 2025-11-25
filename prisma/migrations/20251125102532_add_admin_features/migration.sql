-- AlterTable
ALTER TABLE `events` MODIFY `approval_status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE `users` ADD COLUMN `password` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `event_submissions` (
    `id` VARCHAR(36) NOT NULL,
    `submitter_id` VARCHAR(36) NULL,
    `submitter_email` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `theme` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `original_url` VARCHAR(191) NOT NULL,
    `event_date` DATETIME(3) NULL,
    `entry_start_at` DATETIME(3) NULL,
    `payment_due_at` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `admin_note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `event_submissions` ADD CONSTRAINT `event_submissions_submitter_id_fkey` FOREIGN KEY (`submitter_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
