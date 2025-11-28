/*
  Warnings:

  - You are about to drop the column `entry_start_at` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `original_url` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `payment_due_at` on the `events` table. All the data in the column will be lost.
  - Added the required column `official_urls` to the `events` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `events` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizer_email` on table `events` required. This step will fail if there are existing NULL values in that column.

*/
-- 既存データの移行準備
-- 1. descriptionがNULLの場合は空文字列に設定
UPDATE `events` SET `description` = '' WHERE `description` IS NULL;

-- 2. organizer_emailがNULLの場合は空文字列に設定
UPDATE `events` SET `organizer_email` = '' WHERE `organizer_email` IS NULL;

-- 3. original_urlをofficial_urls（JSON配列）に移行
-- 一時カラムを追加
ALTER TABLE `events` ADD COLUMN `official_urls_temp` JSON NULL;

-- original_urlの値をJSON配列に変換して移行
UPDATE `events` SET `official_urls_temp` = JSON_ARRAY(`original_url`) WHERE `original_url` IS NOT NULL AND `original_url` != '';

-- DropIndex
DROP INDEX `events_original_url_key` ON `events`;

-- AlterTable
-- まず新しいカラムを追加（NULL許可）
ALTER TABLE `events` 
    ADD COLUMN `event_end_date` DATETIME(3) NULL,
    ADD COLUMN `image_url` VARCHAR(500) NULL,
    ADD COLUMN `is_multi_day` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `keywords` JSON NULL,
    ADD COLUMN `official_urls` JSON NULL;

-- official_urls_tempの値をofficial_urlsにコピー
UPDATE `events` SET `official_urls` = `official_urls_temp` WHERE `official_urls_temp` IS NOT NULL;

-- official_urlsがNULLの場合は空配列を設定
UPDATE `events` SET `official_urls` = JSON_ARRAY('') WHERE `official_urls` IS NULL;

-- 一時カラムを削除
ALTER TABLE `events` DROP COLUMN `official_urls_temp`;

-- 既存のカラムを削除・変更
ALTER TABLE `events` 
    DROP COLUMN `entry_start_at`,
    DROP COLUMN `original_url`,
    DROP COLUMN `payment_due_at`,
    MODIFY `description` VARCHAR(200) NOT NULL,
    MODIFY `organizer_email` VARCHAR(255) NOT NULL,
    MODIFY `official_urls` JSON NOT NULL;

-- AlterTable
ALTER TABLE `user_notification_settings` MODIFY `browser_notification_enabled` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `email_notification_enabled` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `event_entries` (
    `id` VARCHAR(36) NOT NULL,
    `event_id` VARCHAR(36) NOT NULL,
    `entry_number` INTEGER NOT NULL,
    `entry_start_at` DATETIME(3) NOT NULL,
    `entry_start_public_at` DATETIME(3) NULL,
    `entry_deadline_at` DATETIME(3) NOT NULL,
    `payment_due_at` DATETIME(3) NOT NULL,
    `payment_due_public_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `event_entries_event_id_entry_number_key`(`event_id`, `entry_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `event_entries` ADD CONSTRAINT `event_entries_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
