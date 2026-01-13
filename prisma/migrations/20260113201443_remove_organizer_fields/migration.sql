/*
  Warnings:

  - You are about to drop the column `organizer_email` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `organizer_user_id` on the `events` table. All the data in the column will be lost.
  - You are about to drop the foreign key `events_organizer_user_id_fkey` on the `events` table. All the data in the column will be lost.

*/

-- 既存データの移行: organizer_user_idをcreated_by_user_idにコピー
-- organizer_user_idが設定されていて、created_by_user_idがNULLの場合のみ移行
UPDATE `events` 
SET `created_by_user_id` = `organizer_user_id` 
WHERE `organizer_user_id` IS NOT NULL 
  AND `created_by_user_id` IS NULL;

-- DropForeignKey
ALTER TABLE `events` DROP FOREIGN KEY `events_organizer_user_id_fkey`;

-- AlterTable
ALTER TABLE `events` DROP COLUMN `organizer_email`,
    DROP COLUMN `organizer_user_id`;

