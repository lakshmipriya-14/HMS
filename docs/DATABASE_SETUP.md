# Local database setup

Each developer uses a separate local PostgreSQL database named `uyirinai_hms_new`. Keep local credentials and database backups outside version control.

## Install PostgreSQL and dependencies

Install PostgreSQL with the command-line tools and start its Windows service. Add PostgreSQL's `bin` directory to your PATH so PowerShell can find `psql`. Install Node.js with npm, then install pnpm `12.21.0`, as pinned in `package.json`. Run the following from the repository root.

```powershell
psql --version
node --version
npm install --global pnpm@12.21.0
pnpm --version
pnpm install --frozen-lockfile
```

## Create the database and configure the connection

Connect to the local server with the administrative role configured during installation. Replace `postgres` if your installation uses a different administrator. The server prompts for its password.

```powershell
psql -h localhost -p 5432 -U postgres -W -d postgres -v ON_ERROR_STOP=1
```

At the `psql` prompt, create a local login and a database it owns. The password command prompts for a password without putting it into the SQL command.

```sql
CREATE ROLE uyirinai_local LOGIN;
\password uyirinai_local
CREATE DATABASE uyirinai_hms_new OWNER uyirinai_local;
\q
```

Copy the environment template if you do not already have a local `.env`.

```powershell
if (-not (Test-Path -LiteralPath .env)) {
    Copy-Item -LiteralPath .env.example -Destination .env
}
notepad .env
```

Set `DATABASE_URL` in the editor using this format. Replace `ENCODED_PASSWORD` with your local login's URL-encoded password.

```dotenv
DATABASE_URL="postgresql://uyirinai_local:ENCODED_PASSWORD@localhost:5432/uyirinai_hms_new?schema=public"
```

Encode the username and password separately if they contain reserved characters. For example, a fictional password `demo@name#1%` becomes `demo%40name%231%25`. Encode each value once and leave the connection URL separators intact. If the shell already has a `DATABASE_URL` environment variable, clear it before using the local file.

```powershell
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
```

## Apply and verify the migrations

These commands are for a developer's own empty local database. Use the committed migration files in order.

```powershell
pnpm exec prisma validate --schema prisma/schema.prisma
pnpm exec prisma migrate deploy --schema prisma/schema.prisma
pnpm exec prisma migrate status --schema prisma/schema.prisma
pnpm exec prisma generate --schema prisma/schema.prisma
psql -h localhost -p 5432 -U uyirinai_local -W -d uyirinai_hms_new -v ON_ERROR_STOP=1 -c 'SELECT current_database();' -c '\dt public.*'
```

The table list should include 55 application tables and `_prisma_migrations` once the public appointment request migration is approved and deployed. This procedure creates the database structure without provisioning a Hospital, creating users, or seeding records.

## Public appointment requests

`POST /api/v1/public/appointment-requests` accepts a patient name, mobile number, listed specialty, and preferred date in `YYYY-MM-DD` format. It saves a pending request for the active UYIRINAI Hospital and returns an opaque reference. Dates are evaluated in Asia/Kolkata and limited to today through 90 days ahead. Identical normalized submissions return the same reference. The API allows up to eight submissions per minute per source address per API process and five distinct saved requests per hour per normalized phone number. When deployed behind a proxy, configure trusted proxy handling and shared edge rate limits so the process can distinguish real visitor addresses and apply limits across replicas.

The hospital must be separately provisioned before intake can accept requests. Reception routing, identity verification, and booking are separate from public intake. Reception will assign a branch, verify identity against existing hospital records, resolve any ambiguous matches, and link the verified Patient. Creating a Patient when no match exists and booking a slot both require authorized workflows. There is no public request lookup.

The focused unit tests use a mocked Prisma client. The opt-in PostgreSQL test requires an already migrated, isolated local database named `uyirinai_hms_test` with an active canonical Hospital fixture. It only runs when `APPOINTMENT_REQUEST_TEST_DATABASE_URL` is set and deletes its test request after verification. Run it only in an authorized test environment.

## Initial reference data

Run the seed only after the reference data has been reviewed and approved. Use the local `uyirinai_hms_new` database and Node.js with `process.loadEnvFile` support. From the repository root, the entry point is `pnpm db:seed`. It builds the shared contracts and uses the generated Prisma Client.

The seed adds the roles and default grants in the shared permission matrix and two global reference lists from the patient-registration contracts. It preserves existing rows and creates no accounts or hospital records. Rerunning it fills missing defaults, including a default grant that was deliberately removed. Review the matrix before rerunning it on a database with customized grants.

## Troubleshoot

- **Authentication failed**. Verify the port and username. Try the same login directly with `psql` and type the original password at its prompt. If that works, check the URL encoding in `.env` and whether an inherited environment variable overrides it.
- **Connection refused**. Verify that the local PostgreSQL service is running and listening on the configured port.
- **Migration failed**. Save the error with credentials removed and run `prisma migrate status` against the intended database. Investigate the failed migration and catalog state before retrying. Avoid using reset or schema push to recover a failed deployment.
- **Prisma Client generation cannot download the query engine**. Check access to `binaries.prisma.sh`. If the matching engine is already installed by `@prisma/engines`, set `PRISMA_QUERY_ENGINE_LIBRARY` to that local engine file for the generation command.
- **Schema changes**. Commit the schema and corresponding forward migration together, including any database-only constraints, indexes, or triggers. Preserve shared migration files after they have been issued. Commit the migration lock file, package manager lockfile, and environment template alongside the setup instructions as applicable.
- **Local backups**. Store backups outside the checkout or under its ignored `local-db-backups/` directory, including plain SQL dumps.

## Authentication and development-only recovery

Set `JWT_SECRET` in the private API environment to an independently generated random secret of at least 32 characters. Keep the API and browser UI on the same site for the HttpOnly, SameSite=Strict refresh cookie. Use HTTPS in production and configure the exact browser origins in `CORS_ORIGINS`. Browser sessions restore on reload through the cookie. Native Expo sessions use memory until a secure device-storage adapter is available.

To test recovery locally, set `NODE_ENV=development`, `API_HOST=127.0.0.1`, `AUTH_DEV_OTP_ENABLED=true`, and `AUTH_DEV_OTP=123456` in the private environment. Sign in and recovery require separately provisioned accounts and role assignments. The development provider sends no email or SMS. Production rejects development mode and rejects that fixed code. To enable real delivery, replace the `OTP_DELIVERY` provider in `apps/api/src/auth/auth.module.ts` with an adapter that generates random six-digit codes excluding the development code and sends them through an approved provider. Keep provider credentials private and never log recovery codes.

Authorization uses database role grants on each protected request. A hospital policy can narrow those grants, including to an empty list. Ambiguous multiple assignments are denied until explicit role selection is supported. Operational API routes without a reviewed permission and row-scope implementation are temporarily denied. The public appointment request retains its own validation and rate limiting.

Run the focused offline auth tests from the repository root with `pnpm --filter @multispeciality-hms/api exec jest --runInBand auth.phase2.spec.ts`. Database-backed acceptance requires an authorized environment with the Hospital, role grants and test accounts already provisioned.
