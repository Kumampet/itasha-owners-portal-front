-- events.description を 200 → 1000 文字まで拡張
ALTER TABLE `events` MODIFY `description` VARCHAR(1000) NOT NULL;
