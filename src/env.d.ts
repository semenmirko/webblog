/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly TURSO_DATABASE_URL: string;
  readonly TURSO_AUTH_TOKEN: string;
  readonly BOT_TOKEN: string;
  readonly SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    user?: {
      id: number;
      telegramId: string;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
    };
  }
}
