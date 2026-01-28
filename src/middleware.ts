import { defineMiddleware } from 'astro:middleware';
import { db } from './lib/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

// Routes that don't require authentication
const publicRoutes = ['/unauthorized', '/api/telegram/webhook'];

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  // Skip auth for public routes and API routes (except telegram webhook check)
  if (publicRoutes.some(route => url.pathname.startsWith(route))) {
    return next();
  }

  // Check for token in URL (new auth)
  const token = url.searchParams.get('token');

  if (token) {
    try {
      const user = await db.select()
        .from(users)
        .where(eq(users.authToken, token))
        .get();

      if (user) {
        // Set session cookie
        context.cookies.set('session', token, {
          httpOnly: true,
          secure: url.protocol === 'https:',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/',
        });

        // Update last visit
        await db.update(users)
          .set({ lastVisit: new Date() })
          .where(eq(users.id, user.id));

        // Redirect to clean URL (remove token)
        return context.redirect(url.pathname, 302);
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  }

  // Check session cookie
  const sessionToken = context.cookies.get('session')?.value;

  if (!sessionToken) {
    return context.redirect('/unauthorized', 302);
  }

  try {
    const user = await db.select()
      .from(users)
      .where(eq(users.authToken, sessionToken))
      .get();

    if (!user) {
      context.cookies.delete('session', { path: '/' });
      return context.redirect('/unauthorized', 302);
    }

    // Add user to context for use in pages
    context.locals.user = {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    return next();
  } catch (error) {
    console.error('Session validation error:', error);
    return context.redirect('/unauthorized', 302);
  }
});
