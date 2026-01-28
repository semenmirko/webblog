import { Telegraf } from 'telegraf';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

const BOT_TOKEN = import.meta.env.BOT_TOKEN || process.env.BOT_TOKEN || '';
const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'http://localhost:4321';

// Твой Telegram ID - только ты можешь делать рассылку
const ADMIN_ID = '257047011';

export const bot = new Telegraf(BOT_TOKEN);

// Команда /start - выдаёт ссылку на сайт
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

// Команда /broadcast - рассылка всем пользователям (только для админа)
bot.command('broadcast', async (ctx) => {
  try {
    const senderId = ctx.from.id.toString();

    // Проверяем что это админ
    if (senderId !== ADMIN_ID) {
      await ctx.reply('У тебя нет прав для рассылки.');
      return;
    }

    // Получаем текст сообщения (всё после /broadcast )
    const message = ctx.message.text.replace('/broadcast ', '').trim();

    if (!message || message === '/broadcast') {
      await ctx.reply('Использование: /broadcast Текст сообщения\n\nПример: /broadcast Привет! Вышел новый гайд!');
      return;
    }

    // Получаем всех пользователей
    const allUsers = await db.select().from(users);

    let sent = 0;
    let failed = 0;

    await ctx.reply(`Начинаю рассылку для ${allUsers.length} пользователей...`);

    for (const user of allUsers) {
      try {
        await bot.telegram.sendMessage(user.telegramId, message);
        sent++;
      } catch (error) {
        failed++;
        console.error(`Failed to send to ${user.telegramId}:`, error);
      }
      // Небольшая задержка чтобы не превысить лимиты Telegram
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    await ctx.reply(`Рассылка завершена!\n\nОтправлено: ${sent}\nНе доставлено: ${failed}`);
  } catch (error) {
    console.error('Error in /broadcast command:', error);
    await ctx.reply('Ошибка при рассылке.');
  }
});

// Команда /stats - статистика (только для админа)
bot.command('stats', async (ctx) => {
  try {
    const senderId = ctx.from.id.toString();

    if (senderId !== ADMIN_ID) {
      await ctx.reply('У тебя нет прав для просмотра статистики.');
      return;
    }

    const allUsers = await db.select().from(users);

    await ctx.reply(
      `📊 Статистика:\n\n` +
      `Всего пользователей: ${allUsers.length}`
    );
  } catch (error) {
    console.error('Error in /stats command:', error);
    await ctx.reply('Ошибка при получении статистики.');
  }
});

export async function handleWebhook(body: unknown) {
  await bot.handleUpdate(body as Parameters<typeof bot.handleUpdate>[0]);
}
