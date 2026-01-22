-- まず、unique制約を一時的に削除（空文字列や@placeholder.localをnullに変換するため）
-- エラーが発生しても続行できるように、存在チェックなしで実行（既に削除されている場合はエラーを無視）
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
               WHERE table_schema = DATABASE() 
               AND table_name = 'users' 
               AND index_name = 'users_email_key');
SET @sqlstmt := IF(@exist > 0, 'ALTER TABLE `users` DROP INDEX `users_email_key`', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 既存の空文字列のメールアドレスをnullにする
UPDATE `users` SET `email` = NULL WHERE `email` = '';

-- 既存の@placeholder.localユーザーのメールアドレスをnullにする
UPDATE `users` SET `email` = NULL WHERE `email` LIKE '%@placeholder.local';

-- emailカラムをnullableにする（既にnullableの場合はエラーを無視）
SET @is_nullable := (SELECT IS_NULLABLE FROM information_schema.columns 
                     WHERE table_schema = DATABASE() 
                     AND table_name = 'users' 
                     AND column_name = 'email');
SET @sqlstmt2 := IF(@is_nullable = 'NO', 'ALTER TABLE `users` MODIFY COLUMN `email` VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt2 FROM @sqlstmt2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- unique制約を再作成（MySQLではnull値はunique制約の対象外）
-- 既に存在する場合はエラーを無視
SET @exist2 := (SELECT COUNT(*) FROM information_schema.statistics 
                WHERE table_schema = DATABASE() 
                AND table_name = 'users' 
                AND index_name = 'users_email_key');
SET @sqlstmt3 := IF(@exist2 = 0, 'ALTER TABLE `users` ADD UNIQUE INDEX `users_email_key` (`email`)', 'SELECT 1');
PREPARE stmt3 FROM @sqlstmt3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;
