# UYIRINAI Super Admin setup

Follow [Database setup](DATABASE_SETUP.md) for the pinned package manager, private environment configuration, migration history, and Prisma Client generation. Run `pnpm exec prisma migrate deploy --schema prisma/schema.prisma` only on the verified target and after deployment approval. The Super Admin application changes reuse tables in the existing migrations.

## First account approval

Supply the account holder's first name, last name, individual sign-in email, and a secure channel for delivering the invitation. Supply a phone number only if approved for this account. Confirm that the active UYIRINAI Hospital and the approved SUPER_ADMIN role grants are available. Keep production recovery codes and JWT secrets private.

The first account requires a separately reviewed, one-time operator procedure:

1. Verify the effective database name, migration history, and backup. Select the active, non-deleted Hospital by the exact code `UYIRINAI`.
2. Confirm the approved grants exist, the email is unused, and no Super Admin has already been provisioned for that hospital.
3. In a serializable Prisma transaction, repeat those checks and create one active User with the approved details and a bcrypt hash of an independently generated random credential. Add exactly one UserRole for SUPER_ADMIN with `scopeKey: 'hospital'`, no branch or department, and the same hospital identifier.
4. Generate a separate single-use invitation with 32 random bytes encoded as base64url. Insert its SHA-256 digest and a 24-hour expiration in AccountAccessToken with purpose INVITATION. Leave the optional issuer null for this bootstrap. Insert an append-only AuditLog entry with the hospital ID, authenticated operator identity in `userEmail`, `userRole: 'BOOTSTRAP_OPERATOR'`, `action: 'BOOTSTRAP_SUPER_ADMIN'`, `resource: 'USER'`, and the new user ID as `resourceId`. Keep the invitation out of the audit and command logs. Commit before delivering it. Stop on conflict and investigate before retrying.
5. Deliver the invitation through the approved private channel. Open the sign-in screen and redeem the code using the invitation flow. Confirm the owner can enter the Super Admin workspace and that a second redemption fails. Keep the development recovery bypass disabled outside explicitly enabled local development or test.
6. Use the authenticated workspace for subsequent Hospital Admin or Department Admin invitations. Department Admin assignments require both a valid branch and department. A Hospital Admin branch assignment is administrative metadata and does not narrow hospital-wide authority.

## Tests

Run from the repository root using the pinned pnpm version.

```powershell
pnpm --filter @multispeciality-hms/contracts build
pnpm --filter @multispeciality-hms/api-client build
pnpm --filter @multispeciality-hms/api exec jest --runInBand super-admin.spec.ts auth.phase2.spec.ts
pnpm --filter @multispeciality-hms/api exec tsc --noEmit --incremental false
pnpm --filter @multispeciality-hms/mobile exec tsc --noEmit --incremental false
```

The focused tests mock Prisma. PostgreSQL acceptance requires a separately approved safe environment and approved accounts and fixtures. Validate that a branch and its audit entry commit together, that invitations are single-use, and that users outside the hospital or permitted role cannot read or change workspace data. Compare report totals against read-only queries using the same filters. Keep the live DEMO records intact.
