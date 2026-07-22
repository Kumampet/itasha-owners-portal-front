CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_provider_providerAccountId_key` ON `accounts` (`provider`,`providerAccountId`);--> statement-breakpoint
CREATE INDEX `accounts_userId_fkey` ON `accounts` (`userId`);--> statement-breakpoint
CREATE TABLE `contact_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`submitter_id` text,
	`title` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`admin_note` text,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` numeric NOT NULL,
	FOREIGN KEY (`submitter_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `contact_submissions_submitter_id_fkey` ON `contact_submissions` (`submitter_id`);--> statement-breakpoint
CREATE TABLE `event_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`entry_number` integer NOT NULL,
	`entry_start_at` numeric,
	`entry_start_public_at` numeric,
	`entry_deadline_at` numeric,
	`payment_due_at` numeric,
	`payment_due_public_at` numeric,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` numeric NOT NULL,
	`payment_due_days_after_entry` integer,
	`payment_due_type` text DEFAULT 'ABSOLUTE' NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_entries_event_id_entry_number_key` ON `event_entries` (`event_id`,`entry_number`);--> statement-breakpoint
CREATE TABLE `event_follows` (
	`user_id` text NOT NULL,
	`event_id` text NOT NULL,
	`followed_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	PRIMARY KEY(`user_id`, `event_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `event_follows_event_id_fkey` ON `event_follows` (`event_id`);--> statement-breakpoint
CREATE TABLE `event_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`submitter_id` text,
	`submitter_email` text,
	`name` text NOT NULL,
	`venue_name` text,
	`theme` text,
	`description` text,
	`original_url` text,
	`event_date` numeric,
	`entry_start_at` numeric,
	`payment_due_at` numeric,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`admin_note` text,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` numeric NOT NULL,
	FOREIGN KEY (`submitter_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `event_submissions_submitter_id_fkey` ON `event_submissions` (`submitter_id`);--> statement-breakpoint
CREATE TABLE `event_tags` (
	`event_id` text NOT NULL,
	`tag_id` text NOT NULL,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	PRIMARY KEY(`event_id`, `tag_id`),
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `event_tags_tag_id_fkey` ON `event_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`event_date` numeric NOT NULL,
	`approval_status` text DEFAULT 'DRAFT' NOT NULL,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` numeric NOT NULL,
	`city` text,
	`postal_code` text,
	`prefecture` text,
	`street_address` text,
	`venue_name` text,
	`event_end_date` numeric,
	`image_url` text,
	`is_multi_day` integer NOT NULL,
	`keywords` text,
	`official_urls` text NOT NULL,
	`payment_methods` text,
	`created_by_user_id` text,
	`entry_selection_method` text DEFAULT 'FIRST_COME' NOT NULL,
	`max_participants` integer,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `events_created_by_user_id_fkey` ON `events` (`created_by_user_id`);--> statement-breakpoint
CREATE INDEX `events_event_date_approval_status_idx` ON `events` (`event_date`,`approval_status`);--> statement-breakpoint
CREATE INDEX `events_approval_status_idx` ON `events` (`approval_status`);--> statement-breakpoint
CREATE INDEX `events_event_date_idx` ON `events` (`event_date`);--> statement-breakpoint
CREATE TABLE `group_message_reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`user_id` text NOT NULL,
	`emoji` text NOT NULL,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `group_messages`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `group_message_reactions_message_id_user_id_emoji_key` ON `group_message_reactions` (`message_id`,`user_id`,`emoji`);--> statement-breakpoint
CREATE INDEX `group_message_reactions_user_id_idx` ON `group_message_reactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `group_message_reactions_message_id_idx` ON `group_message_reactions` (`message_id`);--> statement-breakpoint
CREATE TABLE `group_message_reads` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`user_id` text NOT NULL,
	`read_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `group_messages`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `group_message_reads_message_id_user_id_key` ON `group_message_reads` (`message_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `group_message_reads_message_id_idx` ON `group_message_reads` (`message_id`);--> statement-breakpoint
CREATE INDEX `group_message_reads_user_id_idx` ON `group_message_reads` (`user_id`);--> statement-breakpoint
CREATE TABLE `group_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`content` text NOT NULL,
	`is_announcement` integer NOT NULL,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `group_messages_sender_id_fkey` ON `group_messages` (`sender_id`);--> statement-breakpoint
CREATE INDEX `group_messages_group_id_fkey` ON `group_messages` (`group_id`);--> statement-breakpoint
CREATE TABLE `groups` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`name` text NOT NULL,
	`theme` text,
	`max_members` integer,
	`leader_user_id` text NOT NULL,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` numeric NOT NULL,
	`group_code` text NOT NULL,
	`owner_note` text,
	`group_description` text,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`leader_user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `groups_event_id_name_key` ON `groups` (`event_id`,`name`);--> statement-breakpoint
CREATE INDEX `groups_leader_user_id_fkey` ON `groups` (`leader_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `groups_group_code_key` ON `groups` (`group_code`);--> statement-breakpoint
CREATE TABLE `organizer_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`applicant_id` text,
	`display_name` text NOT NULL,
	`email` text NOT NULL,
	`experience` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`admin_note` text,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` numeric NOT NULL,
	FOREIGN KEY (`applicant_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `organizer_applications_applicant_id_fkey` ON `organizer_applications` (`applicant_id`);--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256Dh` text NOT NULL,
	`auth` text NOT NULL,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` numeric NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscriptions_user_id_endpoint_key` ON `push_subscriptions` (`user_id`,`endpoint`);--> statement-breakpoint
CREATE INDEX `push_subscriptions_user_id_idx` ON `push_subscriptions` (`user_id`);--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`event_id` text,
	`reminder_data` text NOT NULL,
	`notified` integer NOT NULL,
	`notified_at` numeric,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` numeric NOT NULL,
	`note` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reminders_event_id_fkey` ON `reminders` (`event_id`);--> statement-breakpoint
CREATE INDEX `reminders_user_id_event_id_idx` ON `reminders` (`user_id`,`event_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`sessionToken` text NOT NULL,
	`userId` text NOT NULL,
	`expires` numeric NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_userId_fkey` ON `sessions` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_sessionToken_key` ON `sessions` (`sessionToken`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`usage_count` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_key` ON `tags` (`name`);--> statement-breakpoint
CREATE TABLE `user_events` (
	`user_id` text NOT NULL,
	`event_id` text NOT NULL,
	`group_id` text,
	`status` text DEFAULT 'INTERESTED' NOT NULL,
	`push_subscription` text,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` numeric NOT NULL,
	PRIMARY KEY(`user_id`, `event_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `user_events_group_id_fkey` ON `user_events` (`group_id`);--> statement-breakpoint
CREATE INDEX `user_events_event_id_fkey` ON `user_events` (`event_id`);--> statement-breakpoint
CREATE TABLE `user_groups` (
	`user_id` text NOT NULL,
	`group_id` text NOT NULL,
	`event_id` text NOT NULL,
	`status` text DEFAULT 'INTERESTED' NOT NULL,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` numeric NOT NULL,
	PRIMARY KEY(`user_id`, `group_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_groups_event_id_fkey` ON `user_groups` (`event_id`);--> statement-breakpoint
CREATE INDEX `user_groups_group_id_idx` ON `user_groups` (`group_id`);--> statement-breakpoint
CREATE INDEX `user_groups_user_id_event_id_idx` ON `user_groups` (`user_id`,`event_id`);--> statement-breakpoint
CREATE TABLE `user_notification_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`browser_notification_enabled` integer NOT NULL,
	`email_notification_enabled` integer DEFAULT true NOT NULL,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` numeric NOT NULL,
	`group_message_unread_notification_enabled` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_notification_settings_user_id_key` ON `user_notification_settings` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`is_banned` integer NOT NULL,
	`role` text DEFAULT 'USER' NOT NULL,
	`is_profile_public` integer NOT NULL,
	`custom_profile_url` text,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` numeric NOT NULL,
	`emailVerified` numeric,
	`image` text,
	`name` text,
	`password` text,
	`must_change_password` integer NOT NULL,
	`display_name` text,
	`deleted_at` numeric
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_custom_profile_url_key` ON `users` (`custom_profile_url`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_key` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` numeric NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_identifier_token_key` ON `verification_tokens` (`identifier`,`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_token_key` ON `verification_tokens` (`token`);