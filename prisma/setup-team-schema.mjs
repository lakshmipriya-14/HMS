import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { teamDatabaseUrl } from './team-database.mjs';

const require = createRequire(import.meta.url);
const manifest = 'prisma/package.json';
const cli = resolve(dirname(require.resolve(manifest)), require(manifest).bin.prisma);
const schema = fileURLToPath(new URL('./schema.prisma', import.meta.url));

try {
  const env = { ...process.env, DATABASE_URL: teamDatabaseUrl() };
  for (const command of [['validate'], ['migrate', 'deploy'], ['migrate', 'status'], ['generate']]) {
    const result = spawnSync(process.execPath, [cli, ...command, '--schema', schema], { env, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
