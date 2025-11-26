-- CreateTable
CREATE TABLE `contact_submissions` (
    `id` VARCHAR(36) NOT NULL,
    `submitter_id` VARCHAR(36) NULL,
    `title` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `admin_note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `contact_submissions` ADD CONSTRAINT `contact_submissions_submitter_id_fkey` FOREIGN KEY (`submitter_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
