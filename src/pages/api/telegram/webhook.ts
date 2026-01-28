import type { APIRoute } from 'astro';
import { handleWebhook } from '../../../lib/telegram';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    await handleWebhook(body);
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500 });
  }
};

export const GET: APIRoute = async () => {
  return new Response('Telegram webhook is active', { status: 200 });
};
