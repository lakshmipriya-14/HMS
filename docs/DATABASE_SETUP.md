# Local database setup

The team demo uses `uyirinai_hms_team`. The reference-only setup later in this guide uses `uyirinai_hms_new`. Keep local credentials and database backups outside version control.

## Shared team database and demo logins

Use a separate local PostgreSQL database named **`uyirinai_hms_team`**. Each teammate creates their own copy. The same Git revision supplies the schema and synthetic data, including five accounts for each of the 16 application roles.

Install Node.js 22 or later, the repository's pinned pnpm version, and PostgreSQL with its command-line tools. With PostgreSQL running and its tools on PATH, run this from the repository root:

```powershell
git pull --ff-only
npm install --global pnpm@12.21.0
pnpm --version
pnpm install --frozen-lockfile
psql -h localhost -p 5432 -U postgres -W -d postgres -v ON_ERROR_STOP=1
```

At the `psql` prompt, create a role and database once. Reuse `uyirinai_local` if you already created that role. Substitute your local PostgreSQL administrator for `postgres` in the connection command if needed.

```sql
CREATE ROLE uyirinai_local LOGIN;
\password uyirinai_local
CREATE DATABASE uyirinai_hms_team OWNER uyirinai_local;
\q
```

Create or edit the root `.env`:

```powershell
if (-not (Test-Path -LiteralPath .env)) {
    Copy-Item -LiteralPath .env.example -Destination .env
}
notepad .env
```

Set `DATABASE_URL` to the connection below. Replace `ENCODED_PASSWORD` with the URL-encoded PostgreSQL role password. Set `NODE_ENV=development`, `API_HOST=127.0.0.1`, and a private `JWT_SECRET` of at least 32 random characters. To generate the JWT secret, run `node -p "require('node:crypto').randomBytes(32).toString('hex')"` and paste the result into `.env`.

```dotenv
DATABASE_URL="postgresql://uyirinai_local:ENCODED_PASSWORD@localhost:5432/uyirinai_hms_team?schema=public"
```

If you already have an `apps/api/.env`, update its `DATABASE_URL` too. The API uses its local file first and falls back to the root file.

Then run:

```powershell
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
pnpm db:team:setup
pnpm build:packages
pnpm dev:api
```

Start the web UI in another terminal with `pnpm dev:web`. All 80 accounts start with the password **`UyirinaiTeamDemo!24`**. The PostgreSQL role password is only for the database connection.

The first account keeps its original email. Accounts ending in `-02` through `-05` have matching sample records in their scenario's branch. Super Admin and Patient roles use hospital-wide account assignments.

| Workspace role | Account 1 | Account 2 | Account 3 | Account 4 | Account 5 |
| --- | --- | --- | --- | --- | --- |
| Super admin | `super_admin@demo.uyirinai.test` | `super_admin-02@demo.uyirinai.test` | `super_admin-03@demo.uyirinai.test` | `super_admin-04@demo.uyirinai.test` | `super_admin-05@demo.uyirinai.test` |
| Hospital admin | `hospital_admin@demo.uyirinai.test` | `hospital_admin-02@demo.uyirinai.test` | `hospital_admin-03@demo.uyirinai.test` | `hospital_admin-04@demo.uyirinai.test` | `hospital_admin-05@demo.uyirinai.test` |
| Department admin | `department_admin@demo.uyirinai.test` | `department_admin-02@demo.uyirinai.test` | `department_admin-03@demo.uyirinai.test` | `department_admin-04@demo.uyirinai.test` | `department_admin-05@demo.uyirinai.test` |
| Doctor | `doctor@demo.uyirinai.test` | `doctor-02@demo.uyirinai.test` | `doctor-03@demo.uyirinai.test` | `doctor-04@demo.uyirinai.test` | `doctor-05@demo.uyirinai.test` |
| Nurse | `nurse@demo.uyirinai.test` | `nurse-02@demo.uyirinai.test` | `nurse-03@demo.uyirinai.test` | `nurse-04@demo.uyirinai.test` | `nurse-05@demo.uyirinai.test` |
| Head nurse | `head_nurse@demo.uyirinai.test` | `head_nurse-02@demo.uyirinai.test` | `head_nurse-03@demo.uyirinai.test` | `head_nurse-04@demo.uyirinai.test` | `head_nurse-05@demo.uyirinai.test` |
| Receptionist | `receptionist@demo.uyirinai.test` | `receptionist-02@demo.uyirinai.test` | `receptionist-03@demo.uyirinai.test` | `receptionist-04@demo.uyirinai.test` | `receptionist-05@demo.uyirinai.test` |
| Lab technician | `lab_technician@demo.uyirinai.test` | `lab_technician-02@demo.uyirinai.test` | `lab_technician-03@demo.uyirinai.test` | `lab_technician-04@demo.uyirinai.test` | `lab_technician-05@demo.uyirinai.test` |
| Pharmacist | `pharmacist@demo.uyirinai.test` | `pharmacist-02@demo.uyirinai.test` | `pharmacist-03@demo.uyirinai.test` | `pharmacist-04@demo.uyirinai.test` | `pharmacist-05@demo.uyirinai.test` |
| Radiology staff | `radiology_staff@demo.uyirinai.test` | `radiology_staff-02@demo.uyirinai.test` | `radiology_staff-03@demo.uyirinai.test` | `radiology_staff-04@demo.uyirinai.test` | `radiology_staff-05@demo.uyirinai.test` |
| Billing staff | `billing_staff@demo.uyirinai.test` | `billing_staff-02@demo.uyirinai.test` | `billing_staff-03@demo.uyirinai.test` | `billing_staff-04@demo.uyirinai.test` | `billing_staff-05@demo.uyirinai.test` |
| Insurance staff | `insurance_staff@demo.uyirinai.test` | `insurance_staff-02@demo.uyirinai.test` | `insurance_staff-03@demo.uyirinai.test` | `insurance_staff-04@demo.uyirinai.test` | `insurance_staff-05@demo.uyirinai.test` |
| Ward manager | `ward_manager@demo.uyirinai.test` | `ward_manager-02@demo.uyirinai.test` | `ward_manager-03@demo.uyirinai.test` | `ward_manager-04@demo.uyirinai.test` | `ward_manager-05@demo.uyirinai.test` |
| Patient | `patient@demo.uyirinai.test` | `patient-02@demo.uyirinai.test` | `patient-03@demo.uyirinai.test` | `patient-04@demo.uyirinai.test` | `patient-05@demo.uyirinai.test` |
| Ambulance coordinator | `ambulance_coordinator@demo.uyirinai.test` | `ambulance_coordinator-02@demo.uyirinai.test` | `ambulance_coordinator-03@demo.uyirinai.test` | `ambulance_coordinator-04@demo.uyirinai.test` | `ambulance_coordinator-05@demo.uyirinai.test` |
| Ambulance driver | `ambulance_driver@demo.uyirinai.test` | `ambulance_driver-02@demo.uyirinai.test` | `ambulance_driver-03@demo.uyirinai.test` | `ambulance_driver-04@demo.uyirinai.test` | `ambulance_driver-05@demo.uyirinai.test` |

The schema stage is available separately as `pnpm db:team:schema`. It deploys the actual [PostgreSQL migrations](../prisma/migrations) in order, checks their status, and generates Prisma Client. The baseline contains 55 application tables plus `_prisma_migrations`. The migration files include database triggers and constraints alongside the tables and indexes.

The data stage is available separately as `pnpm db:team:seed`. It installs default permissions and reference lists and adds five linked workflow scenarios. Each scenario has its own branch accounts, two patients, two appointments, a public appointment request, an admission, pharmacy and diagnostic records, two invoices, and sample insurance, ambulance, nursing, notification, audit, and report-export data. The five receptionist accounts each have a completed and a scheduled appointment in their branch. Login, password recovery, and invitation flows create their own session and token records. The patient document rows use placeholder URLs.

If you previously installed the single-scenario seed, run `pnpm db:team:seed` to add scenarios 2–5. Rerunning the seed preserves installed scenarios and any passwords changed during testing. Clinical dates are set when each scenario is installed. To recover a changed demo password, use the app's local recovery flow. Existing teammate credentials and their local patient records remain in their own databases. Use the demo credentials only on local developer instances. Old Hospital Admin assignments without a branch require an explicitly chosen branch before those users can sign in.

## Reference-only database setup

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

The table list should include 55 application tables and `_prisma_migrations` after the migrations are applied. This procedure creates the database structure without provisioning a Hospital, creating users, or seeding records.

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
