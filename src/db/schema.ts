import { sqliteTable, AnySQLiteColumn, uniqueIndex, text, numeric, index, foreignKey, integer, primaryKey } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const users = sqliteTable("users", {
	id: text().primaryKey().notNull(),
	email: text(),
	isBanned: integer("is_banned", { mode: "boolean" }).notNull(),
	role: text().default("USER").notNull(),
	isProfilePublic: integer("is_profile_public", { mode: "boolean" }).notNull(),
	customProfileUrl: text("custom_profile_url"),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric("updated_at").notNull(),
	emailVerified: numeric(),
	image: text(),
	name: text(),
	password: text(),
	mustChangePassword: integer("must_change_password", { mode: "boolean" }).notNull(),
	displayName: text("display_name"),
	deletedAt: numeric("deleted_at"),
},
(table) => [
	uniqueIndex("users_custom_profile_url_key").on(table.customProfileUrl),
	uniqueIndex("users_email_key").on(table.email),
]);

export const accounts = sqliteTable("accounts", {
	id: text().primaryKey().notNull(),
	userId: text().notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
},
(table) => [
	uniqueIndex("accounts_provider_providerAccountId_key").on(table.provider, table.providerAccountId),
	index("accounts_userId_fkey").on(table.userId),
]);

export const sessions = sqliteTable("sessions", {
	id: text().primaryKey().notNull(),
	sessionToken: text().notNull(),
	userId: text().notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	expires: numeric().notNull(),
},
(table) => [
	index("sessions_userId_fkey").on(table.userId),
	uniqueIndex("sessions_sessionToken_key").on(table.sessionToken),
]);

export const verificationTokens = sqliteTable("verification_tokens", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: numeric().notNull(),
},
(table) => [
	uniqueIndex("verification_tokens_identifier_token_key").on(table.identifier, table.token),
	uniqueIndex("verification_tokens_token_key").on(table.token),
]);

export const events = sqliteTable("events", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	eventDate: numeric("event_date").notNull(),
	approvalStatus: text("approval_status").default("DRAFT").notNull(),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric("updated_at").notNull(),
	city: text(),
	postalCode: text("postal_code"),
	prefecture: text(),
	streetAddress: text("street_address"),
	venueName: text("venue_name"),
	eventEndDate: numeric("event_end_date"),
	imageUrl: text("image_url"),
	isMultiDay: integer("is_multi_day", { mode: "boolean" }).notNull(),
	keywords: text(),
	officialUrls: text("official_urls").notNull(),
	paymentMethods: text("payment_methods"),
	createdByUserId: text("created_by_user_id").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" } ),
	entrySelectionMethod: text("entry_selection_method").default("FIRST_COME").notNull(),
	maxParticipants: integer("max_participants"),
},
(table) => [
	index("events_created_by_user_id_fkey").on(table.createdByUserId),
	index("events_event_date_approval_status_idx").on(table.eventDate, table.approvalStatus),
	index("events_approval_status_idx").on(table.approvalStatus),
	index("events_event_date_idx").on(table.eventDate),
]);

export const eventEntries = sqliteTable("event_entries", {
	id: text().primaryKey().notNull(),
	eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	entryNumber: integer("entry_number").notNull(),
	entryStartAt: numeric("entry_start_at"),
	entryStartPublicAt: numeric("entry_start_public_at"),
	entryDeadlineAt: numeric("entry_deadline_at"),
	paymentDueAt: numeric("payment_due_at"),
	paymentDuePublicAt: numeric("payment_due_public_at"),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric("updated_at").notNull(),
	paymentDueDaysAfterEntry: integer("payment_due_days_after_entry"),
	paymentDueType: text("payment_due_type").default("ABSOLUTE").notNull(),
},
(table) => [
	uniqueIndex("event_entries_event_id_entry_number_key").on(table.eventId, table.entryNumber),
]);

export const userEvents = sqliteTable("user_events", {
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	eventId: text("event_id").notNull().references(() => events.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	groupId: text("group_id").references(() => groups.id, { onDelete: "set null", onUpdate: "cascade" } ),
	status: text().default("INTERESTED").notNull(),
	pushSubscription: text("push_subscription"),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric("updated_at").notNull(),
},
(table) => [
	index("user_events_group_id_fkey").on(table.groupId),
	index("user_events_event_id_fkey").on(table.eventId),
	primaryKey({ columns: [table.userId, table.eventId], name: "user_events_user_id_event_id_pk"})
]);

export const groups = sqliteTable("groups", {
	id: text().primaryKey().notNull(),
	eventId: text("event_id").notNull().references(() => events.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	name: text().notNull(),
	theme: text(),
	maxMembers: integer("max_members"),
	leaderUserId: text("leader_user_id").notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric("updated_at").notNull(),
	groupCode: text("group_code").notNull(),
	ownerNote: text("owner_note"),
	groupDescription: text("group_description"),
},
(table) => [
	uniqueIndex("groups_event_id_name_key").on(table.eventId, table.name),
	index("groups_leader_user_id_fkey").on(table.leaderUserId),
	uniqueIndex("groups_group_code_key").on(table.groupCode),
]);

export const groupMessages = sqliteTable("group_messages", {
	id: text().primaryKey().notNull(),
	groupId: text("group_id").notNull().references(() => groups.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	content: text().notNull(),
	isAnnouncement: integer("is_announcement", { mode: "boolean" }).notNull(),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("group_messages_sender_id_fkey").on(table.senderId),
	index("group_messages_group_id_fkey").on(table.groupId),
]);

export const groupMessageReads = sqliteTable("group_message_reads", {
	id: text().primaryKey().notNull(),
	messageId: text("message_id").notNull().references(() => groupMessages.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	readAt: numeric("read_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	uniqueIndex("group_message_reads_message_id_user_id_key").on(table.messageId, table.userId),
	index("group_message_reads_message_id_idx").on(table.messageId),
	index("group_message_reads_user_id_idx").on(table.userId),
]);

export const groupMessageReactions = sqliteTable("group_message_reactions", {
	id: text().primaryKey().notNull(),
	messageId: text("message_id").notNull().references(() => groupMessages.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	emoji: text().notNull(),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	uniqueIndex("group_message_reactions_message_id_user_id_emoji_key").on(table.messageId, table.userId, table.emoji),
	index("group_message_reactions_user_id_idx").on(table.userId),
	index("group_message_reactions_message_id_idx").on(table.messageId),
]);

export const tags = sqliteTable("tags", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	usageCount: integer("usage_count").default(1).notNull(),
},
(table) => [
	uniqueIndex("tags_name_key").on(table.name),
]);

export const eventTags = sqliteTable("event_tags", {
	eventId: text("event_id").notNull().references(() => events.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("event_tags_tag_id_fkey").on(table.tagId),
	primaryKey({ columns: [table.eventId, table.tagId], name: "event_tags_event_id_tag_id_pk"})
]);

export const eventFollows = sqliteTable("event_follows", {
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	eventId: text("event_id").notNull().references(() => events.id, { onDelete: "restrict", onUpdate: "cascade" } ),
	followedAt: numeric("followed_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("event_follows_event_id_fkey").on(table.eventId),
	primaryKey({ columns: [table.userId, table.eventId], name: "event_follows_user_id_event_id_pk"})
]);

export const eventSubmissions = sqliteTable("event_submissions", {
	id: text().primaryKey().notNull(),
	submitterId: text("submitter_id").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" } ),
	submitterEmail: text("submitter_email"),
	name: text().notNull(),
	venueName: text("venue_name"),
	theme: text(),
	description: text(),
	originalUrl: text("original_url"),
	eventDate: numeric("event_date"),
	entryStartAt: numeric("entry_start_at"),
	paymentDueAt: numeric("payment_due_at"),
	status: text().default("PENDING").notNull(),
	adminNote: text("admin_note"),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric("updated_at").notNull(),
},
(table) => [
	index("event_submissions_submitter_id_fkey").on(table.submitterId),
]);

export const reminders = sqliteTable("reminders", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	eventId: text("event_id").references(() => events.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	reminderData: text("reminder_data").notNull(),
	notified: integer("notified", { mode: "boolean" }).notNull(),
	notifiedAt: numeric("notified_at"),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric("updated_at").notNull(),
	note: text(),
},
(table) => [
	index("reminders_event_id_fkey").on(table.eventId),
	index("reminders_user_id_event_id_idx").on(table.userId, table.eventId),
]);

export const userNotificationSettings = sqliteTable("user_notification_settings", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	browserNotificationEnabled: integer("browser_notification_enabled", { mode: "boolean" }).notNull(),
	emailNotificationEnabled: integer("email_notification_enabled", { mode: "boolean" }).default(true).notNull(),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric("updated_at").notNull(),
	groupMessageUnreadNotificationEnabled: integer("group_message_unread_notification_enabled", { mode: "boolean" }).default(true).notNull(),
},
(table) => [
	uniqueIndex("user_notification_settings_user_id_key").on(table.userId),
]);

export const pushSubscriptions = sqliteTable("push_subscriptions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	endpoint: text().notNull(),
	p256Dh: text().notNull(),
	auth: text().notNull(),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric("updated_at").notNull(),
},
(table) => [
	uniqueIndex("push_subscriptions_user_id_endpoint_key").on(table.userId, table.endpoint),
	index("push_subscriptions_user_id_idx").on(table.userId),
]);

export const contactSubmissions = sqliteTable("contact_submissions", {
	id: text().primaryKey().notNull(),
	submitterId: text("submitter_id").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" } ),
	title: text().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	content: text().notNull(),
	status: text().default("PENDING").notNull(),
	adminNote: text("admin_note"),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric("updated_at").notNull(),
},
(table) => [
	index("contact_submissions_submitter_id_fkey").on(table.submitterId),
]);

export const organizerApplications = sqliteTable("organizer_applications", {
	id: text().primaryKey().notNull(),
	applicantId: text("applicant_id").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" } ),
	displayName: text("display_name").notNull(),
	email: text().notNull(),
	experience: text().notNull(),
	status: text().default("PENDING").notNull(),
	adminNote: text("admin_note"),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric("updated_at").notNull(),
},
(table) => [
	index("organizer_applications_applicant_id_fkey").on(table.applicantId),
]);

export const userGroups = sqliteTable("user_groups", {
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	groupId: text("group_id").notNull().references(() => groups.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade", onUpdate: "cascade" } ),
	status: text().default("INTERESTED").notNull(),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: numeric("updated_at").notNull(),
},
(table) => [
	index("user_groups_event_id_fkey").on(table.eventId),
	index("user_groups_group_id_idx").on(table.groupId),
	index("user_groups_user_id_event_id_idx").on(table.userId, table.eventId),
	primaryKey({ columns: [table.userId, table.groupId], name: "user_groups_user_id_group_id_pk"})
]);

