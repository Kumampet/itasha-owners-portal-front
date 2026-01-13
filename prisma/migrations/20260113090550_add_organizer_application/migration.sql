-- CreateTable
CREATE TABLE `organizer_applications` (
    `id` VARCHAR(36) NOT NULL,
    `applicant_id` VARCHAR(36) NULL,
    `display_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `experience` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `admin_note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `organizer_applications` ADD CONSTRAINT `organizer_applications_applicant_id_fkey` FOREIGN KEY (`applicant_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
