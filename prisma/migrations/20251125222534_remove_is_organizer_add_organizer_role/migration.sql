-- 既存のis_organizerがtrueのユーザーのroleをORGANIZERに更新
UPDATE users SET role = 'ORGANIZER' WHERE is_organizer = true;

-- is_organizerカラムを削除
ALTER TABLE `users` DROP COLUMN `is_organizer`;

