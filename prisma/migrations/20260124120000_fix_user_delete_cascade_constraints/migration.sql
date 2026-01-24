-- AlterTable: user_eventsのuser_id外部キー制約をRESTRICTからCASCADEに変更
ALTER TABLE `user_events` DROP FOREIGN KEY `user_events_user_id_fkey`;
ALTER TABLE `user_events` ADD CONSTRAINT `user_events_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: group_messagesのsender_id外部キー制約をRESTRICTからCASCADEに変更
ALTER TABLE `group_messages` DROP FOREIGN KEY `group_messages_sender_id_fkey`;
ALTER TABLE `group_messages` ADD CONSTRAINT `group_messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: event_followsのuser_id外部キー制約をRESTRICTからCASCADEに変更
ALTER TABLE `event_follows` DROP FOREIGN KEY `event_follows_user_id_fkey`;
ALTER TABLE `event_follows` ADD CONSTRAINT `event_follows_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: groupsのleader_user_idは物理削除処理で手動でリーダーを変更するため、CASCADEに変更しない
