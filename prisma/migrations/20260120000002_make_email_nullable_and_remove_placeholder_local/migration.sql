-- まず、unique制約を一時的に削除（空文字列や@placeholder.localをnullに変換するため）
ALTER TABLE `users` DROP INDEX `users_email_key`;

-- 既存の空文字列のメールアドレスをnullにする
UPDATE `users` SET `email` = NULL WHERE `email` = '';

-- 既存の@placeholder.localユーザーのメールアドレスをnullにする
UPDATE `users` SET `email` = NULL WHERE `email` LIKE '%@placeholder.local';

-- emailカラムをnullableにする
ALTER TABLE `users` MODIFY COLUMN `email` VARCHAR(255) NULL;

-- unique制約を再作成（MySQLではnull値はunique制約の対象外）
ALTER TABLE `users` ADD UNIQUE INDEX `users_email_key` (`email`);
