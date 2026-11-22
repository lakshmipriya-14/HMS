# UYIRINAI HMS Schema Review Checklist

Status: the approved permanent native-UUID Hospital ID and `UYIRINAI` code are recorded. The active schema is prepared from the proposal, and a second forward migration draft follows the existing initial migration. Neither migration has been executed and no database was accessed in this preparation step.

## Approved architecture and invariants

- [x] One UYIRINAI Hospital with multiple operating branches.
- [x] Hospital ID is a permanent native UUID; Hospital code is `UYIRINAI`; provision the actual Hospital row separately.
- [x] Super Admin has hospital-wide scope and owner permissions; Hospital Admin has hospital-wide management scope with distinct permissions.
- [x] Department Admin requires assigned branch and department; a hospital-wide Department does not widen branch access.
- [x] Doctor belongs to exactly one branch.
- [x] Ordinary operational users cannot receive hospital-wide scope; deny exceptions unless explicitly approved.
- [x] Full dispense reversal only, linked to original movement, at most once per original.
- [x] Existing batch balances are opening snapshots at ledger cutover; no fabricated historical movements.
- [x] Added an `OPENING_BALANCE` ledger movement type for a positive cutover snapshot per existing batch; uniqueness and movement-shape enforcement remain PostgreSQL migration requirements.
- [x] MedicineBatch.quantity is authoritative; Medicine.currentStock is aggregate/cache.
- [x] Expired medicine is not dispensable; boundary/timezone still needs a business decision.
- [x] Active Admissions determine occupancy; application transactions alone synchronize Bed and Ward display/cache fields.

## Proposal changes recorded

- [x] InventoryMovement includes a named self-relation to the original dispense movement and its opposite relation; `reversesMovementId` is unique.
- [x] Added Hospital inventory ledger cutover timestamp.
- [x] Added composite candidate keys for cross-ownership compound references and retained required operational ownership keys.
- [x] Removed redundant prefix indexes where a unique index or longer-prefix index already covers access.
- [x] Documented exact compound FK/trigger enforcement still needed; candidate keys alone do not enforce relation consistency.
- [x] Documented active-admission-per-bed partial unique index on `status='ADMITTED'`.
- [x] Documented scope triggers/checks for UserRole, singleton Hospital and MasterDataSet.
- [x] Documented concurrency-safe dispense/reversal, stock-cache synchronization and admission/discharge transactions.
- [x] Updated old mobile/web mapping with approved scope and feature dependencies; preserved all routes/actions as requirements.
- [x] Documented safe migration reproducibility, non-destructive reference seed, and environment-backed one-time Super Admin bootstrap.
- [x] Preserve `20261119111627_init`; prepare a second forward migration from the 47-table schema to the 54-model proposal.

## Prisma and repository status

- [x] Prisma CLI validation passed for both the updated proposal and active schema using the existing local installation. No `npx`, install, or dependency change was used.
- [ ] Review generated forward DDL and custom PostgreSQL constraints/functions/triggers; they have not been executed or validated against PostgreSQL.
- [x] Existing initial migration was retained unchanged; new migration is a forward schema diff, not another from-empty baseline.
- [x] Target was previously confirmed empty with no `_prisma_migrations`; migration two includes a preflight guard requiring migration one and empty application tables.
- [x] No migration SQL was executed.

## Old-schema and workflow parity review gates

- [x] Static comparison found all 49 old-reference models preserved; User hospital scope and RefreshToken credential changes are intentional. Remaining handler/workflow uncertainties are listed below.
- [ ] Verify all old mobile and web screens, buttons, validation, role guards, state transitions, exports and patient portal behavior against handlers.
- [ ] Verify route-to-API-to-model coverage for Super Admin, Hospital Admin, Department Admin, Doctor, Nurse, Reception, Lab, Pharmacy, Radiology, Billing, Ward, Ambulance and Patient.
- [ ] Verify dependency order: Hospital/Branch and RBAC → Users/Employees/Doctors/Patients → appointments/consultations/prescriptions → wards/admissions/nursing → lab/radiology/pharmacy → invoices/payments/claims/ambulance → reports/notifications/audit/export.
- [ ] Require audit coverage for cross-branch patient access and sensitive changes; clinical, patient, financial, inventory and audit history is protected from accidental deletion.
- [ ] No UI redesign or workflow reduction is allowed during integration.

## Required database/application invariants before migration

- [x] Canonical Hospital ID is a permanent native UUID and Hospital code is `UYIRINAI`; provision the actual Hospital row separately, with no literal UUID in migration SQL.
- [x] Drafted singleton index, `UYIRINAI` code check, and post-provision identity immutability guard.
- [x] Added direct composite branch/hospital FKs and cross-record scope triggers for the documented ownership matrix; parent-only ownership changes and business reassignment rules still need review.
- [x] Added active-admission partial unique index and nonnegative batch and Ward count checks.
- [x] Added full reversal trigger validation: original kind DISPENSE, reversal kind DISPENSE_REVERSAL, same hospital/branch/batch/medicine, exact inverse delta, unique original link, no reversal-of-reversal.
- [x] Added MasterDataSet scope/hospital/isSystem CHECK and UserRole role/scope trigger.
- [ ] Keep Bed/Ward occupancy synchronization exclusively in application transactions; no occupancy-maintaining DB triggers.
- [ ] Verify payment idempotency and refresh/OTP one-time consume transactions; refund policy remains unresolved.
- [ ] Verify all operational history uses restrictive deletion/soft deletion and immutable audit permissions.
- [ ] Reconcile Medicine.currentStock to SUM(MedicineBatch.quantity) and Ward.occupiedBeds to active admissions before cutover.

## Decisions that remain unresolved

- [ ] Whether Department Admin may have multiple branch/department assignments.
- [ ] Any exceptional scope for other staff; default is deny.
- [ ] Parent branch/hospital reassignment behavior and the matching parent-side database guards when dependent records exist.
- [ ] Department code uniqueness policy for future branch-local departments; current uniqueness remains hospital-wide.
- [ ] `Department.headOfDepartmentId` target relation.
- [ ] Old-handler confirmation for `Bed.currentPatientId` target.
- [ ] Admission transfers and cleaning-bed housekeeping.
- [ ] Purchase-order button behavior and procurement rules.
- [ ] Expiry boundary and business timezone.
- [ ] Payment refunds, voids and reversals.
- [ ] Patient portal permissions, reporting/export details and notification delivery/visibility.

## Safety record

- [x] Existing `prisma/migrations/20261119111627_init/migration.sql` remains unchanged; only a new second migration file was prepared.
- [x] No database was accessed or modified; no SQL, migration, seed, reset, install, or Git operation was performed.
- [x] Package files, `.env` files, old project, and other databases remain untouched.
