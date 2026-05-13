-- AlterTable: イベント側の住所相当フィールド venue_name と名称を揃える
ALTER TABLE `event_submissions` CHANGE COLUMN `venue` `venue_name` VARCHAR(512) NULL;
