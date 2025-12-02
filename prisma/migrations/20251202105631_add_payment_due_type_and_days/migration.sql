-- AlterTable: 新しいカラムを追加（payment_due_atは一旦NULL許可に変更）
ALTER TABLE `event_entries` ADD COLUMN `payment_due_days_after_entry` INTEGER NULL,
    ADD COLUMN `payment_due_type` VARCHAR(191) NOT NULL DEFAULT 'ABSOLUTE',
    MODIFY `payment_due_at` DATETIME(3) NULL;

-- 既存データの移行: payment_due_atが設定されている場合はABSOLUTEタイプに設定
UPDATE `event_entries` SET `payment_due_type` = 'ABSOLUTE' WHERE `payment_due_at` IS NOT NULL;
