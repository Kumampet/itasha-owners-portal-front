-- 既存の@placeholder.localユーザーのメールアドレスをnullにする
UPDATE `users` SET `email` = NULL WHERE `email` LIKE '%@placeholder.local';

-- emailカラムをnullableにする
ALTER TABLE `users` MODIFY COLUMN `email` VARCHAR(255) NULL;

-- unique制約を維持（MySQLではnull値はunique制約の対象外）
-- 既存のunique制約はそのまま維持される
