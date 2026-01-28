import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  telegramId: text('telegram_id').notNull().unique(),
  username: text('username'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  authToken: text('auth_token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  lastVisit: integer('last_visit', { mode: 'timestamp' }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
