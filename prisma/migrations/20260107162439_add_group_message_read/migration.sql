-- CreateTable
CREATE TABLE `group_message_reads` (
    `id` VARCHAR(36) NOT NULL,
    `message_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `read_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `group_message_reads_user_id_idx`(`user_id`),
    INDEX `group_message_reads_message_id_idx`(`message_id`),
    UNIQUE INDEX `group_message_reads_message_id_user_id_key`(`message_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `group_message_reads` ADD CONSTRAINT `group_message_reads_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `group_messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_message_reads` ADD CONSTRAINT `group_message_reads_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
