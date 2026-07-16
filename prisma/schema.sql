-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "is_profile_public" BOOLEAN NOT NULL DEFAULT false,
    "custom_profile_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "name" TEXT,
    "password" TEXT,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "display_name" TEXT,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "event_date" DATETIME NOT NULL,
    "approval_status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "city" TEXT,
    "postal_code" TEXT,
    "prefecture" TEXT,
    "street_address" TEXT,
    "venue_name" TEXT,
    "event_end_date" DATETIME,
    "image_url" TEXT,
    "is_multi_day" BOOLEAN NOT NULL DEFAULT false,
    "keywords" TEXT,
    "official_urls" TEXT NOT NULL,
    "payment_methods" TEXT,
    "created_by_user_id" TEXT,
    "entry_selection_method" TEXT NOT NULL DEFAULT 'FIRST_COME',
    "max_participants" INTEGER,
    CONSTRAINT "events_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "entry_number" INTEGER NOT NULL,
    "entry_start_at" DATETIME,
    "entry_start_public_at" DATETIME,
    "entry_deadline_at" DATETIME,
    "payment_due_at" DATETIME,
    "payment_due_public_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "payment_due_days_after_entry" INTEGER,
    "payment_due_type" TEXT NOT NULL DEFAULT 'ABSOLUTE',
    CONSTRAINT "event_entries_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_events" (
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "group_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INTERESTED',
    "push_subscription" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,

    PRIMARY KEY ("user_id", "event_id"),
    CONSTRAINT "user_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_events_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "user_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "theme" TEXT,
    "max_members" INTEGER,
    "leader_user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "group_code" TEXT NOT NULL,
    "owner_note" TEXT,
    "group_description" TEXT,
    CONSTRAINT "groups_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "groups_leader_user_id_fkey" FOREIGN KEY ("leader_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "group_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_announcement" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_messages_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "group_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_message_reads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_message_reads_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "group_messages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_message_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_message_reactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "group_messages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_message_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "event_tags" (
    "event_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("event_id", "tag_id"),
    CONSTRAINT "event_tags_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "event_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_follows" (
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "followed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("user_id", "event_id"),
    CONSTRAINT "event_follows_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "event_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submitter_id" TEXT,
    "submitter_email" TEXT,
    "name" TEXT NOT NULL,
    "venue_name" TEXT,
    "theme" TEXT,
    "description" TEXT,
    "original_url" TEXT,
    "event_date" DATETIME,
    "entry_start_at" DATETIME,
    "payment_due_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "admin_note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "event_submissions_submitter_id_fkey" FOREIGN KEY ("submitter_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT,
    "reminder_data" TEXT NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "notified_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "note" TEXT,
    CONSTRAINT "reminders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_notification_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "browser_notification_enabled" BOOLEAN NOT NULL DEFAULT false,
    "email_notification_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "group_message_unread_notification_enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "user_notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contact_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submitter_id" TEXT,
    "title" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "admin_note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "contact_submissions_submitter_id_fkey" FOREIGN KEY ("submitter_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "organizer_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicant_id" TEXT,
    "display_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "admin_note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "organizer_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_groups" (
    "user_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INTERESTED',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,

    PRIMARY KEY ("user_id", "group_id"),
    CONSTRAINT "user_groups_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_custom_profile_url_key" ON "users"("custom_profile_url");

-- CreateIndex
CREATE INDEX "accounts_userId_fkey" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_fkey" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "events_event_date_idx" ON "events"("event_date");

-- CreateIndex
CREATE INDEX "events_approval_status_idx" ON "events"("approval_status");

-- CreateIndex
CREATE INDEX "events_event_date_approval_status_idx" ON "events"("event_date", "approval_status");

-- CreateIndex
CREATE INDEX "events_created_by_user_id_fkey" ON "events"("created_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_entries_event_id_entry_number_key" ON "event_entries"("event_id", "entry_number");

-- CreateIndex
CREATE INDEX "user_events_event_id_fkey" ON "user_events"("event_id");

-- CreateIndex
CREATE INDEX "user_events_group_id_fkey" ON "user_events"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "groups_group_code_key" ON "groups"("group_code");

-- CreateIndex
CREATE INDEX "groups_leader_user_id_fkey" ON "groups"("leader_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "groups_event_id_name_key" ON "groups"("event_id", "name");

-- CreateIndex
CREATE INDEX "group_messages_group_id_fkey" ON "group_messages"("group_id");

-- CreateIndex
CREATE INDEX "group_messages_sender_id_fkey" ON "group_messages"("sender_id");

-- CreateIndex
CREATE INDEX "group_message_reads_user_id_idx" ON "group_message_reads"("user_id");

-- CreateIndex
CREATE INDEX "group_message_reads_message_id_idx" ON "group_message_reads"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_message_reads_message_id_user_id_key" ON "group_message_reads"("message_id", "user_id");

-- CreateIndex
CREATE INDEX "group_message_reactions_message_id_idx" ON "group_message_reactions"("message_id");

-- CreateIndex
CREATE INDEX "group_message_reactions_user_id_idx" ON "group_message_reactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_message_reactions_message_id_user_id_emoji_key" ON "group_message_reactions"("message_id", "user_id", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "event_tags_tag_id_fkey" ON "event_tags"("tag_id");

-- CreateIndex
CREATE INDEX "event_follows_event_id_fkey" ON "event_follows"("event_id");

-- CreateIndex
CREATE INDEX "event_submissions_submitter_id_fkey" ON "event_submissions"("submitter_id");

-- CreateIndex
CREATE INDEX "reminders_user_id_event_id_idx" ON "reminders"("user_id", "event_id");

-- CreateIndex
CREATE INDEX "reminders_event_id_fkey" ON "reminders"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_settings_user_id_key" ON "user_notification_settings"("user_id");

-- CreateIndex
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_user_id_endpoint_key" ON "push_subscriptions"("user_id", "endpoint");

-- CreateIndex
CREATE INDEX "contact_submissions_submitter_id_fkey" ON "contact_submissions"("submitter_id");

-- CreateIndex
CREATE INDEX "organizer_applications_applicant_id_fkey" ON "organizer_applications"("applicant_id");

-- CreateIndex
CREATE INDEX "user_groups_user_id_event_id_idx" ON "user_groups"("user_id", "event_id");

-- CreateIndex
CREATE INDEX "user_groups_group_id_idx" ON "user_groups"("group_id");

-- CreateIndex
CREATE INDEX "user_groups_event_id_fkey" ON "user_groups"("event_id");

