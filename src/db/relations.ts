import { relations } from "drizzle-orm/relations";
import { users, accounts, sessions, events, eventEntries, userEvents, groups, groupMessages, groupMessageReads, groupMessageReactions, tags, eventTags, eventFollows, eventSubmissions, reminders, userNotificationSettings, pushSubscriptions, contactSubmissions, organizerApplications, userGroups } from "./schema";

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	accounts: many(accounts),
	sessions: many(sessions),
	events: many(events),
	userEvents: many(userEvents),
	groups: many(groups),
	groupMessages: many(groupMessages),
	groupMessageReads: many(groupMessageReads),
	groupMessageReactions: many(groupMessageReactions),
	eventFollows: many(eventFollows),
	eventSubmissions: many(eventSubmissions),
	reminders: many(reminders),
	userNotificationSettings: many(userNotificationSettings),
	pushSubscriptions: many(pushSubscriptions),
	contactSubmissions: many(contactSubmissions),
	organizerApplications: many(organizerApplications),
	userGroups: many(userGroups),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	user: one(users, {
		fields: [events.createdByUserId],
		references: [users.id]
	}),
	eventEntries: many(eventEntries),
	userEvents: many(userEvents),
	groups: many(groups),
	eventTags: many(eventTags),
	eventFollows: many(eventFollows),
	reminders: many(reminders),
	userGroups: many(userGroups),
}));

export const eventEntriesRelations = relations(eventEntries, ({one}) => ({
	event: one(events, {
		fields: [eventEntries.eventId],
		references: [events.id]
	}),
}));

export const userEventsRelations = relations(userEvents, ({one}) => ({
	user: one(users, {
		fields: [userEvents.userId],
		references: [users.id]
	}),
	group: one(groups, {
		fields: [userEvents.groupId],
		references: [groups.id]
	}),
	event: one(events, {
		fields: [userEvents.eventId],
		references: [events.id]
	}),
}));

export const groupsRelations = relations(groups, ({one, many}) => ({
	userEvents: many(userEvents),
	user: one(users, {
		fields: [groups.leaderUserId],
		references: [users.id]
	}),
	event: one(events, {
		fields: [groups.eventId],
		references: [events.id]
	}),
	groupMessages: many(groupMessages),
	userGroups: many(userGroups),
}));

export const groupMessagesRelations = relations(groupMessages, ({one, many}) => ({
	user: one(users, {
		fields: [groupMessages.senderId],
		references: [users.id]
	}),
	group: one(groups, {
		fields: [groupMessages.groupId],
		references: [groups.id]
	}),
	groupMessageReads: many(groupMessageReads),
	groupMessageReactions: many(groupMessageReactions),
}));

export const groupMessageReadsRelations = relations(groupMessageReads, ({one}) => ({
	user: one(users, {
		fields: [groupMessageReads.userId],
		references: [users.id]
	}),
	groupMessage: one(groupMessages, {
		fields: [groupMessageReads.messageId],
		references: [groupMessages.id]
	}),
}));

export const groupMessageReactionsRelations = relations(groupMessageReactions, ({one}) => ({
	user: one(users, {
		fields: [groupMessageReactions.userId],
		references: [users.id]
	}),
	groupMessage: one(groupMessages, {
		fields: [groupMessageReactions.messageId],
		references: [groupMessages.id]
	}),
}));

export const eventTagsRelations = relations(eventTags, ({one}) => ({
	tag: one(tags, {
		fields: [eventTags.tagId],
		references: [tags.id]
	}),
	event: one(events, {
		fields: [eventTags.eventId],
		references: [events.id]
	}),
}));

export const tagsRelations = relations(tags, ({many}) => ({
	eventTags: many(eventTags),
}));

export const eventFollowsRelations = relations(eventFollows, ({one}) => ({
	user: one(users, {
		fields: [eventFollows.userId],
		references: [users.id]
	}),
	event: one(events, {
		fields: [eventFollows.eventId],
		references: [events.id]
	}),
}));

export const eventSubmissionsRelations = relations(eventSubmissions, ({one}) => ({
	user: one(users, {
		fields: [eventSubmissions.submitterId],
		references: [users.id]
	}),
}));

export const remindersRelations = relations(reminders, ({one}) => ({
	user: one(users, {
		fields: [reminders.userId],
		references: [users.id]
	}),
	event: one(events, {
		fields: [reminders.eventId],
		references: [events.id]
	}),
}));

export const userNotificationSettingsRelations = relations(userNotificationSettings, ({one}) => ({
	user: one(users, {
		fields: [userNotificationSettings.userId],
		references: [users.id]
	}),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({one}) => ({
	user: one(users, {
		fields: [pushSubscriptions.userId],
		references: [users.id]
	}),
}));

export const contactSubmissionsRelations = relations(contactSubmissions, ({one}) => ({
	user: one(users, {
		fields: [contactSubmissions.submitterId],
		references: [users.id]
	}),
}));

export const organizerApplicationsRelations = relations(organizerApplications, ({one}) => ({
	user: one(users, {
		fields: [organizerApplications.applicantId],
		references: [users.id]
	}),
}));

export const userGroupsRelations = relations(userGroups, ({one}) => ({
	user: one(users, {
		fields: [userGroups.userId],
		references: [users.id]
	}),
	group: one(groups, {
		fields: [userGroups.groupId],
		references: [groups.id]
	}),
	event: one(events, {
		fields: [userGroups.eventId],
		references: [events.id]
	}),
}));