import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const teamDatabase = 'uyirinai_hms_team';

export function teamDatabaseUrl() {
  const envFile = fileURLToPath(new URL('../.env', import.meta.url));
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error('Set DATABASE_URL in the root .env file.');
  const url = new URL(value);
  if (
    !['postgresql:', 'postgres:'].includes(url.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    !['/uyirinai_hms_team', '/uyirinai_hms_new'].includes(url.pathname) ||
    [...url.searchParams].some(([key, schema]) => key !== 'schema' || schema !== 'public')
  ) {
    throw new Error(`Use a local PostgreSQL database named ${teamDatabase} with the public schema.`);
  }
  return value;
}
