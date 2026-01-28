import { Telegraf } from 'telegraf';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

const BOT_TOKEN = import.meta.env.BOT_TOKEN || process.env.BOT_TOKEN || '';
const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'http://localhost:4321';

export const bot = new Telegraf(BOT_TOKEN);

bot.command('start', async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const username = ctx.from.username || null;
    const firstName = ctx.from.first_name || null;
    const lastName = ctx.from.last_name || null;

    const authToken = uuidv4();

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .get();

    if (existingUser) {
      // Update existing user with new token
      await db.update(users)
        .set({
          authToken,
          username,
          firstName,
          lastName,
        })
        .where(eq(users.telegramId, telegramId));
    } else {
      // Create new user
      await db.insert(users).values({
        telegramId,
        username,
        firstName,
        lastName,
        authToken,
        createdAt: new Date(),
      });
    }

    const authUrl = `${SITE_URL}?token=${authToken}`;

    await ctx.reply(
      `Привет${firstName ? `, ${firstName}` : ''}! 👋\n\n` +
      `Твоя персональная ссылка для доступа к гайдам:\n\n` +
      `${authUrl}\n\n` +
      `Ссылка привязана к твоему аккаунту.`
    );
  } catch (error) {
    console.error('Error in /start command:', error);
    await ctx.reply('Произошла ошибка. Попробуй позже.');
  }
});

export async function handleWebhook(body: unknown) {
  await bot.handleUpdate(body as Parameters<typeof bot.handleUpdate>[0]);
}
