# UYIRINAI Proposed Database Design Notes

Status: approved design prepared. The active `prisma/schema.prisma` matches `uyirinai-proposed-schema.prisma` and uses a permanent native UUID for Hospital identity and all `hospitalId` references; Hospital code is fixed to `UYIRINAI`. The actual Hospital row/UUID is not embedded or seeded by migrations. A second forward migration draft follows the retained initial migration. Neither migration has been executed. Prisma validation checks schema structure only; it does not validate custom SQL or apply the schema.

## Architecture

There is one hospital, UYIRINAI MULTISPECIALITY HOSPITAL, with multiple branches. `Hospital.id` is a permanent native PostgreSQL UUID (`@db.Uuid`); the actual UUID is generated/provisioned once in a separate approved setup step and is not embedded as a literal in migrations. The approved canonical code is `UYIRINAI`, also provisioned as the Hospital row. A unique singleton index permits at most one Hospital row and a CHECK requires the approved code. Hospital identity fields are immutable after provisioning. `Branch` belongs to that hospital. Super Admin and Hospital Admin each receive hospital-wide `UserRole` assignments (null branch and department), with distinct permissions; only Super Admin has system-owner capabilities. Other operational users cannot receive hospital-wide scope. Department Admin assignments require both branch and department scope. `scopeKey` is a server-generated canonical scope identifier so PostgreSQL's NULL-distinct unique behavior cannot permit duplicate identical assignments.

Hospital-wide records use a null branch only when the workflow is actually hospital-wide: examples are organization profile, system roles/permissions, system master-data sets, and Super Admin role assignments. Branch-operational events have required `branchId`: appointments, consultations, prescriptions, nursing events, lab/radiology orders, batches/dispensing, wards/admissions, invoices/payments/claims, ambulance/trips, and patient-document uploads. Patient registration has a `registrationBranchId`, but patient identity and longitudinal records remain hospital-wide. An event's branch is the care/operation location, not necessarily the patient's registration branch.

Patient cross-branch access is permission-based: the API first verifies the user's hospital assignment, then checks the specific permission and permitted branch/department scope. A cross-branch patient read or write emits an audit record containing actor, branch, patient/resource, action, outcome, and request context. A patient portal user can only access their own linked `Patient` record.

## Model groups and relationships

The proposed schema retains every old model and its old field declarations unless an explicit security/scope change below applies.

- **Organization:** `Hospital` owns `Branch`, `Department`, `User`, `Patient`, `Ward`, ambulance, policy, master-data, export, and audit records. `Branch` is the operating location referenced by user assignments and branch-operational records. `Department` may be hospital-wide (`branchId` null) or branch-specific. Existing branch profile fields remain.
- **Identity and authorization:** `User` has a required hospital. `Role` and `Permission` define system capabilities. `RolePermission` links them. `UserRole` records the user's hospital/branch/department scope and canonical `scopeKey`. `HospitalRolePolicy` retains the old policy representation. `AccountAccessToken` stores invitation/reset digests. `PasswordResetChallenge` stores only OTP/destination hashes and one-time lifecycle timestamps. `RefreshToken` stores `tokenHash`, family, expiry, revocation and rotation linkage; raw bearer tokens are never stored.
- **Staff and doctors:** `Employee` links a user to optional branch/department and employee data. `Doctor` extends Employee and is assigned to exactly one required operating branch; qualifications, schedules and leave are separate records. The one-branch rule is approved.
- **Patients and visits:** `Patient` links to Hospital, optional portal User, and registration Branch. Documents link to Patient and the upload Branch. `Appointment` links Patient, Doctor, Department and operating Branch. `Consultation` links the appointment, patient and doctor. `Prescription` links patient, doctor, optional consultation, and items; items link Medicine.
- **Nursing:** `NursingStaff` extends Employee; `NursingAssignment` links nurse and Ward; `VitalsRecord` links Patient, optional Admission and recorder ID; `NursingTask` links Patient, Admission and optional nurse; `MedicationAdministration` links PrescriptionItem and Admission, with administering nurse ID and branch.
- **Laboratory:** `LabTest` owns `TestParameter` and is referenced by `LabOrderItem`; `LabOrder` links patient/doctor and operating branch; `LabResult` links order and parameter. Result release actor/timestamps remain on the old model; amendments/versioning are not added without UI evidence.
- **Pharmacy:** `Medicine` owns `MedicineBatch` and prescription references. Batches are branch-local. `DispensingRecord` links prescription, batch and pharmacist ID; `InventoryMovement` is the immutable, idempotent dispense/reversal ledger tied to batch and dispensing row. Only full dispense reversal is supported, linked to its original DISPENSE movement, with at most one reversal per original. The old interface includes a purchase-order affordance, but handler behavior and required purchasing lifecycle are unconfirmed; purchasing remains unresolved rather than presumed absent or invented.
- **Radiology:** `RadiologyTest` owns orders. `RadiologyOrder` links patient, doctor, test, operating branch, findings/impression and report-release data. The inspected schema/UI does not establish report amendment history, so none is invented.
- **Wards:** `Ward` belongs to Hospital and Branch and may link Department. `Bed` belongs to Ward. `Admission` links patient, admitting doctor, ward and bed. Nursing and invoice records may link an admission.
- **Billing:** `Invoice` belongs to Patient, optional Admission and Appointment; items, payments and insurance claims link to the invoice. Payments are retained; refunds are not added as a user workflow because no old-screen refund action was confirmed. If required, model refunds as compensating records, never by deleting or rewriting a payment.
- **Ambulance:** `Ambulance` belongs to Hospital/Branch; `AmbulanceDriver` extends Employee; `AmbulanceTrip` links ambulance and driver and records dispatch, pickup, destination, status and handover. The old UI supports trip-stage changes; a separate GPS/event-history model is not assumed.
- **Notifications and audit:** Notifications belong to User and may be branch-specific. AuditLog keeps old actor snapshots/details and adds optional Branch. Audit writes are append-only by API/database privileges.
- **Master data and reports:** `MasterDataSet` distinguishes SYSTEM and HOSPITAL scope; `MasterDataItem` belongs to one set. `ReportExportJob` records report key, format, filters, requesting user, scope, state and expiring storage key; report contents are not stored in the database.

## Branch and relationship integrity

All records belong to the one UYIRINAI hospital through a required Hospital relation directly or through their required owning entity. Branch operational records have required foreign keys to Branch. API services must reject a branch that is inactive or outside the actor's assignment. Branch deletion is restricted; deactivate/soft-delete instead.

Composite `(branchId,hospitalId)` foreign keys establish that branch-operational rows reference a branch in the same hospital. They do not alone prove all related records share a branch. The second migration draft adds a singleton index, ownership triggers for cross-record consistency, and role scope enforcement, in addition to service validation. `Department.branchId` remains optional for hospital-wide departments; its code remains unique hospital-wide as in the old schema.

`Branch.code` is unique within Hospital (`@@unique([hospitalId, code])`). `UserRole.scopeKey` is non-null and canonical; the second migration also adds scope-based partial unique indexes so duplicate grants cannot be created by supplying different scope keys. These are migration-draft rules, not claims about objects currently installed in PostgreSQL.

## Bed occupancy and inventory consistency

A bed's `status` is operational display state; an active Admission (status `ADMITTED`) is occupancy authority. The second migration draft adds a PostgreSQL partial unique index on Admission(bedId) WHERE status='ADMITTED'. Application transactions remain the sole owner synchronizing Admission, Bed status/current-patient display fields, and Ward.occupiedBeds; no trigger updates occupancy values. Admission transfers and post-discharge cleaning/housekeeping remain unresolved. Concurrency-safe services lock the target Bed row and use conditional state changes in one transaction.

MedicineBatch.quantity is authoritative on-hand stock; Medicine.currentStock is the hospital-wide aggregate/cache equal to the sum of branch batch balances. At ledger cutover, create one positive `OPENING_BALANCE` InventoryMovement for each existing batch using its actual cutover quantity and timestamp. This is the auditable starting snapshot, not fabricated pre-cutover history. No historical dispenses are reconstructed. Dispensing locks/rechecks the batch, checks sufficient quantity, rejects expired batches inside the transaction, creates the DispensingRecord, decrements quantity, updates the aggregate cache, and inserts one negative InventoryMovement with a unique idempotency key. Same-key/same-payload retries return the original operation; changed payload conflicts. A full reversal is a positive movement linked to the original dispense movement, permitted once only. Expiry boundary and business timezone remain unresolved.

## Payments and authentication

Payment idempotency is not fully represented by the old Payment model. Before implementation, add an idempotency key and unique scope for a payment operation, plus a request fingerprint. Same key/same fingerprint returns the original result; same key/different fingerprint fails. Persist invoice balance changes and payment in one transaction. Payment reversal/refund requires an explicit approval decision and should be a separate linked compensating record.

Refresh rotation is represented by hash, family, revokedAt, and a self-linked replacement. Rotation must atomically consume one live token and insert the successor; reuse revokes the family. OTP challenges store hashes and use conditional single-consumption updates, expiry and attempt limits. Password reset revokes active refresh-token families. Passwords use the existing password-hash mechanism; no plaintext password field is added.

## Master data scope

System-wide sets (for immutable shared enumerations/reference catalogs) have `scope=SYSTEM`, null `hospitalId`, and are managed only by deployment/system configuration. Hospital-specific records have `scope=HOSPITAL` and the UYIRINAI hospital ID; edits are audited. The old UI establishes a generic Master Settings manager but does not enumerate categories. Lab/radiology catalogs and medicine definitions are retained as their existing domain models; whether those catalogs should be system-wide or hospital-specific remains unresolved.

## Proposed migration SQL (draft only)

These snippets are design notes, not executable migration instructions. The target was found empty in a prior read-only inspection, but it must be rechecked immediately before deployment. Identifiers must match the final active schema and second-migration history.

```sql
-- Singleton Hospital and approved UYIRINAI code constraints are drafted in the final review section below.

-- One active admission per bed. Confirm the final active-state predicate first.
CREATE UNIQUE INDEX "Admission_one_active_per_bed"
  ON "Admission" ("bedId")
  WHERE "status" = 'ADMITTED';

-- Prevent negative batch stock (only if quantity remains a stored current balance).
ALTER TABLE "MedicineBatch"
  ADD CONSTRAINT "MedicineBatch_quantity_nonnegative" CHECK ("quantity" >= 0);

-- Example hospital-wide / branch-local Department code uniqueness if branch-local
-- codes are approved instead of the old hospital-wide uniqueness rule:
-- DROP the old unique constraint only after collision analysis and approval.
CREATE UNIQUE INDEX "Department_hospital_code_when_global"
  ON "Department" ("hospitalId", "code") WHERE "branchId" IS NULL;
CREATE UNIQUE INDEX "Department_branch_code_when_local"
  ON "Department" ("hospitalId", "branchId", "code") WHERE "branchId" IS NOT NULL;
```

Additional cross-record branch consistency triggers or composite FKs are needed for Admission↔Ward/Bed, Appointment↔Doctor/Department, and similar relationships. Their exact SQL must be generated from the finalized schema and reviewed in full; it is not safe to guess against an unknown existing database.

## Migration and rollback approach

1. **Approved clean-install path:** retain `prisma/migrations/20261119111627_init` unchanged and create a second forward migration from the active 47-table schema to this approved proposal. A clean empty target applies both migrations in order; do not run the older migration alone or substitute the from-empty review SQL. Generate/review the forward SQL without database access, then test the full chain on a disposable PostgreSQL database after separate approval. Before target deployment, confirm the target remains empty and has no migration history.
2. **Existing database path:** never assume the initial migration ran. Read-only inspect `_prisma_migrations`, catalog tables, constraints, and existing data. Compare actual schema/data to migration history. Prepare additive nullable columns, backfill only deterministically attributable rows, report collisions/ambiguous ownership, then add constraints. No reset, drop, truncate or destructive seed.
3. **Rollback:** prefer a forward corrective migration. For additive nullable columns/indexes, a reviewed down script can remove only newly added objects if no application data has been written to them. Once new production records exist, dropping those columns/tables is data loss; stop writes, take/verify backup, export affected data, and prepare a forward repair or approved restore. Never automatically roll back clinical, financial, audit, or patient records.

## Reference comparison

Before this preparation, the active repository schema and original migration had 47 models/tables and no enums. The complete old HMS reference has 49 models and 1 enum; the approved proposal retains all 47 existing table names, restores two old-reference models absent from the active baseline, adds 5 new models (`PasswordResetChallenge`, `MasterDataSet`, `MasterDataItem`, `InventoryMovement`, `ReportExportJob`), and adds 3 new enums while retaining `AccountAccessPurpose`. The active schema now matches the proposal at 54 models and 4 enums. Existing schema fields are preserved except the documented security/scope changes: required User hospital, native UUID Hospital identity and references, branch-local Branch code, scoped UserRole, hashed/rotating RefreshToken, Patient registration branch, branch fields on operational records, AuditLog branch, and batch movement relation. The opening-balance movement type is included in `InventoryMovementType`.
## Model-by-model purpose index

The complete fields and opposite relations for all 49 reference models are in the proposed schema itself. This index states each model's responsibility:

- Hospital — the single UYIRINAI tenant and organization profile.
- Branch — one operating location and branch profile.
- Department — hospital-wide or branch-specific clinical department.
- User — login identity and linked hospital account.
- Role — named authorization role.
- HospitalRolePolicy — hospital-specific role grants retained from reference.
- AccountAccessToken — hashed invitation/reset access code lifecycle.
- Permission — resource/action capability.
- UserRole — user role plus hospital/branch/department scope.
- RolePermission — role-to-permission join.
- RefreshToken — hashed refresh credential, family and rotation linkage.
- Employee — staff identity, employment data and optional location/department.
- Doctor — doctor profile and fees, specialty and availability.
- DoctorQualification — doctor degree/institution/year.
- DoctorSchedule — recurring doctor availability.
- DoctorLeave — doctor leave range, reason and approval.
- Patient — hospital patient identity, demographics, history and registration branch.
- PatientDocument — patient document metadata and uploader/location.
- Appointment — patient/doctor/department booking, date/token and workflow status.
- Consultation — appointment-linked complaint, examination, diagnosis and plan.
- Prescription — doctor/patient/consultation prescription header and dispensing state.
- PrescriptionItem — medicine dose/frequency/duration/instructions.
- NursingStaff — employee-linked nurse and shift/head-nurse flag.
- NursingAssignment — nurse-to-ward date/shift assignment.
- VitalsRecord — patient/admission measurements and recorder.
- NursingTask — patient/admission task, nurse, due time, priority and completion.
- MedicationAdministration — administration of a prescription item during admission.
- LabTest — laboratory test catalog, sample, price and turnaround.
- TestParameter — analyte and reference/critical ranges.
- LabOrder — patient/doctor order, barcode and release status.
- LabOrderItem — tests included in a lab order.
- LabResult — measured value, range, abnormal/critical flags and notes.
- Medicine — medicine catalog, price and reorder fields retained from reference.
- MedicineBatch — branch batch, expiry, quantity and prices.
- DispensingRecord — prescription dispensing quantity, batch and pharmacist.
- RadiologyTest — modality/test catalog and price.
- RadiologyOrder — patient/doctor study, indication, findings and released report.
- Ward — hospital/branch ward and department association.
- Bed — ward room/bed, operational status and rate.
- Admission — patient/doctor/ward/bed stay, diagnosis and discharge.
- Invoice — patient/admission/appointment invoice totals and status.
- InvoiceItem — invoice line item/category/quantity/pricing.
- Payment — invoice payment, receiver, status and idempotency fingerprint.
- InsuranceClaim — invoice/patient/provider/policy and claim lifecycle.
- Ambulance — hospital/branch vehicle, availability and current GPS.
- AmbulanceDriver — employee-linked driver, license and duty status.
- AmbulanceTrip — dispatch, pickup, patient condition, trip states and handover.
- Notification — user-targeted in-app message and read state.
- AuditLog — immutable actor/resource/action/context snapshot.
- PasswordResetChallenge — one-time OTP challenge using stored hashes only.
- MasterDataSet — system-wide or hospital-specific master category.
- MasterDataItem — coded, status-bearing item in a master category.
- InventoryMovement — immutable dispense/reversal stock movement with idempotency.
- ReportExportJob — scoped report format/filter/status and expiring artifact metadata.

## Corrections and enforcement review (2026-11-21)

### Corrections made to this proposal

- AmbulanceTrip.destinationHospital is required caller/dispatch-entered text with no preset destination. Dispatch may identify an UYIRINAI branch or an external destination; the old UI has no confirmed destination-branch selector, so destinationBranchId is intentionally not inferred.
- InventoryMovement.performedByUserId now has the named User relation InventoryPerformer and User.performedInventoryMovements opposite. The actor and movement must belong to the same hospital through the composite (userId,hospitalId) FK.
- RefreshToken now includes hospitalId because its user FK is composite. Employee now has the required candidate key (id,hospitalId,branchId) for Doctor, NursingStaff, and AmbulanceDriver branch-matched employee FKs.
- Patient-to-portal-User linkage is hospital matched; deletion is restricted because setting only userId null through a composite FK would also attempt to null the required hospitalId. Disable/soft-delete the login instead.
- Removed any legacy identifier-format comment from the proposed schema. UHID format is governed by the approved UYIRINAI numbering policy, not an assumed prefix.

### Ownership and branch-consistency contract

Every branch-operational root record stores required hospitalId and branchId and has a composite FK (branchId,hospitalId) -> Branch(id,hospitalId). This applies to Appointment, Consultation, Prescription and PrescriptionItem, NursingAssignment, VitalsRecord, NursingTask, MedicationAdministration, LabOrder, MedicineBatch, DispensingRecord, RadiologyOrder, Ward, Bed, Admission, Invoice, Payment, InsuranceClaim, Ambulance, AmbulanceTrip, PatientDocument, InventoryMovement, and branch-scoped Notification/AuditLog where branch is present. The FK prevents a record claiming a branch of another hospital. In this deployment the hospital is the sole UYIRINAI tenant; a canonical immutable Hospital row and a reviewed database CHECK prevent a second tenant row.

A branch FK alone does not ensure that related records share the same branch. The final PostgreSQL migration must add composite candidate keys and composite FKs where the relationship is structurally stable, or deferred/transactional constraint triggers where optionality or workflow semantics prevent a direct FK. Required consistency matrix:

- Appointment -> Doctor must match hospital and operating branch; Appointment -> Patient must match hospital only because patients may receive care at any UYIRINAI branch; Department must match hospital and be either hospital-wide (Department.branchId IS NULL) or assigned to the appointment branch.
- Consultation -> Appointment, patient, doctor must all match the consultation hospital/branch and appointment identity; a consultation is unique per appointment.
- Prescription -> patient is hospital matched; doctor and optional consultation are branch matched; PrescriptionItem -> Prescription must match hospital/branch. Medicine is a hospital catalog entry or shared catalog according to the unresolved catalog ownership decision.
- NursingAssignment -> nurse and ward must match assignment hospital/branch. VitalsRecord, NursingTask and MedicationAdministration -> admission must match hospital/branch; assigned nurse must be branch assigned. Vitals may be patient-only when admissionId is null, but patient hospital must still match.
- LabOrder -> patient hospital, doctor branch, and all LabOrderItems/results belonging to that order; Lab catalog scope must match selected catalog policy. RadiologyOrder follows the same patient-hospital/doctor-branch rule and catalog scope policy.
- Ward -> optional Department must match hospital and be global or same branch. Bed -> Ward must match hospital/branch. Admission -> patient hospital, admitting doctor branch, Ward and Bed must all match its branch and Bed.wardId must equal Admission.wardId.
- Invoice -> patient hospital and optional Appointment/Admission branch; if both visit links are present they must agree on patient, hospital and branch. InvoiceItem, Payment and InsuranceClaim must match the parent invoice's hospital/branch; InsuranceClaim patient must equal invoice patient.
- MedicineBatch, DispensingRecord and InventoryMovement must all match branch/hospital and medicine/batch. Dispensing prescription must match the dispensing branch. Movement medicineId must equal the batch medicineId; movement branch must equal batch and dispensing branch. At most one base DISPENSE movement per DispensingRecord; reversal rows are separate immutable compensations and must identify the original dispense in the finalized ledger design.
- AmbulanceTrip -> ambulance and driver must match trip hospital/branch. Branch transfer is an explicit operational reassignment, not a silent update of historical trip rows.
- PatientDocument -> patient hospital, uploader hospital and upload branch; patient's registration branch may differ by design.
- Notification -> recipient hospital; an optional branch is either null for hospital-wide delivery or must be within that hospital. AuditLog preserves actor/branch snapshots; branch must belong to the logged hospital when both are present.

Implement compound FKs wherever the child stores matching ownership keys. For department's global-or-branch rule and multi-parent matches that cannot be expressed with a single FK, use constraint triggers that run in the same transaction as writes. Triggers must reject cross-branch references and reject updates that would invalidate dependents. This SQL is still draft-only and must be generated from final physical names, reviewed, and tested; it has not been run.

### Scope rules

UserRole is one authorization assignment per role and scope. Super Admin and Hospital Admin have branchId=NULL and departmentId=NULL within the singleton UYIRINAI hospital, with distinct permission sets. Department Admin requires both branchId and departmentId. Its Department may be branch-local to that branch or hospital-wide, but a hospital-wide Department does not widen access beyond the assigned branch. Ordinary operational roles require branchId and cannot have hospital-wide null scope. Exceptional scope for other staff is not approved and must be denied by default. Multiple Department Admin assignments may use separate UserRole rows only if the unresolved multiplicity decision permits it. Patient role has no staff branch/department grant and access is anchored to User.patient.

The API derives hospitalId and authorized branch/department sets from the authenticated principal's persisted UserRole rows and Permission grants. It ignores client tenant IDs as authority. Every list, detail, export, write, mutation and report applies the scope predicate in the service/query layer. Cross-branch patient access requires an explicit permission and a recorded audit event with outcome and reason. Database FKs protect ownership consistency but do not replace authorization.

### Constraints, idempotency, occupancy, history

- Branch-local code: Branch has unique (hospitalId,code); Department currently has (hospitalId,code), which is hospital-wide uniqueness and permits global/branch departments only if their codes do not collide. If branch-local Department codes are approved, replace it with partial unique indexes: (hospitalId,code) where branchId IS NULL and (hospitalId,branchId,code) where branchId IS NOT NULL. PostgreSQL NULLs are distinct by default, so a plain composite unique containing nullable branchId does not enforce global uniqueness as intended. User/employee/patient/document numbers remain as shown until scope policy is approved.
- Optional branch: nullable branchId plus required hospitalId uses composite FK (branchId,hospitalId); PostgreSQL MATCH SIMPLE skips validation when branchId is NULL. Null means organization/hospital-level only for Department, authorized Super Admin/Hospital Admin UserRole, Employee records explicitly hospital-based, Notification, ReportExportJob, and AuditLog snapshots. It never grants a user scope by itself. Department Admin and ordinary operational UserRole rows require branchId. Required branch-operational rows must never set branchId null. Cross-column role/department scope rules require CHECK/trigger constraints.
- Bed occupancy: approved active state is `ADMITTED`; partial unique index Admission(bedId) WHERE status='ADMITTED'. Admit locks Bed, confirms AVAILABLE and matching hospital/branch/ward, conditionally claims it, creates Admission, updates display patient fields and increments Ward.occupiedBeds once in one transaction. Discharge locks Admission, Bed and Ward in stable order, conditionally transitions ADMITTED to DISCHARGED once, clears display fields, applies only an approved post-discharge bed state, decrements Ward.occupiedBeds once and commits. Application transactions alone synchronize these values; no DB trigger updates them. Active admissions are authority; reconciliation detects cache drift. Transfers and cleaning-housekeeping remain unresolved. `Bed.currentPatientId` target semantics still require old-handler confirmation.
- Inventory: MedicineBatch.quantity is authoritative; Medicine.currentStock is the aggregate/cache across its batches. Dispense locks the batch, validates matching hospital/branch/medicine, rejects expired stock per the future approved boundary, checks sufficient quantity, creates DispensingRecord and negative InventoryMovement, decrements the batch, synchronizes Medicine.currentStock and prescription state atomically. Same idempotency key/fingerprint returns the prior operation; changed payload conflicts. A full reversal is one positive movement linked to the original DISPENSE movement, with matching batch/medicine/hospital/branch and exact opposite quantity; a unique original link permits at most one reversal and reversal-of-reversal is rejected. DB constraints validate movement types/values; application transaction alone synchronizes balances. Existing quantities become cutover opening snapshots, not fabricated history. Expiry boundary/timezone and purchasing behavior remain unresolved.
- Payments: Payment idempotencyKey is unique and requestFingerprint binds invoice, amount, method and transaction reference. In a transaction, same key/fingerprint returns the committed Payment; changed payload returns conflict; lock invoice, insert payment, update paidAmount/status atomically. Do not trust client paidAmount. Payment history is append-only; void/refund needs a separately approved compensating-payment workflow.
- Refresh tokens: persist only cryptographic tokenHash; rotate atomically with a single-use conditional update/revoke of old row and insert successor in the same family. Reuse of revoked/consumed token revokes the whole family. ReplacedById unique prevents two successors for one token. Revoke all family rows on logout-all/password reset; do not cascade-delete tokens from audit evidence if session retention policy requires it.
- OTP: persist otpHash and destinationHash only. Verification increments attemptCount atomically and checks expiry, revokedAt, consumedAt, attempt ceiling, and verifiedAt. Consumption is a conditional single-row update where consumedAt IS NULL and challenge remains valid; only one concurrent request can win. Rate-limit requests/resends by user and destination in application controls; unique/partial active challenge rule requires exact resend policy decision.
- Operational data deletion: patient, clinical, lab/radiology, medication, admission, invoice, payment, claim, inventory and audit rows are protected by Restrict/soft-delete and append-only permissions. Cascade is limited to disposable auth tokens and pure RBAC join rows/derived qualification/schedule metadata. AuditLog actor links are SetNull only when the actor account is physically removed; actor snapshots remain. Accounts and patients should normally be deactivated, not physically deleted.

### MasterDataSet scope enforcement

The intended invariant is (SYSTEM AND hospitalId IS NULL AND isSystem=true) OR (HOSPITAL AND hospitalId IS NOT NULL AND isSystem=false). Add a PostgreSQL CHECK for this enum-to-nullability relation; Prisma cannot express it as a CHECK. The Hospital singleton and required UUID foreign key ensure any non-null hospital scope references the one UYIRINAI Hospital. `@@unique([scope,key])` gives one key per scope in this single-hospital design, while SYSTEM/HOSPITAL remain distinct scopes. If multi-hospital reuse is ever introduced, replace with partial unique indexes for global SYSTEM key and per-hospital HOSPITAL key; do not rely on NULL-containing unique tuples. MasterDataItem code uniqueness is per set; item status/deletedAt should be treated as soft state, and set scope/hospital changes are blocked once items or references exist.

### Actual repository comparison (read-only inspection)

Active `prisma/schema.prisma` and `prisma/migrations/20261119111627_init/migration.sql` each define 47 models/tables and no enums. The proposal retains the existing tables, restores two old-reference models absent from the active baseline, and adds five models. The migration has the old nullable User hospital field, no branch-aware operational ownership on most event records, a branch-agnostic role assignment design, plain RefreshToken structure, and an Aalayam destination default. The forward migration removes that default and replaces the two raw/revocation RefreshToken fields. The target was separately inspected read-only and found empty with no `_prisma_migrations` table; no database is accessed by this document.

### Additional identity-link consistency correction

AccountAccessToken and PasswordResetChallenge link to a User using hospital-matched composite keys; Notification recipient is also constrained to the same hospital. AuditLog actor uses the hospital-matched composite relation when actor and hospital are present, while its immutable userEmail/userRole snapshot survives account deactivation. Account access tokens therefore cannot be issued for a user from a different hospital context. Composite candidate keys are defined on User. Auth rows are still revoked/expired by application policy; physical account deletion is generally restricted by staff/patient history.

### Static check scope

A local text-based structural scan counted 54 models and 4 enums. `pnpm exec prisma validate --schema docs/uyirinai-proposed-schema.prisma` and validation of the active `prisma/schema.prisma` both succeeded after native UUID typing. Prisma validation does not execute SQL, connect to PostgreSQL, validate custom constraints/triggers, or prove runtime authorization behavior.

## Approved decisions and remaining decisions (authoritative update)

The following approved requirements supersede any stale wording elsewhere in this historical review: one UYIRINAI hospital with multiple branches; permanent native UUID Hospital ID and code UYIRINAI, with the Hospital row provisioned separately; Super Admin and Hospital Admin are hospital-wide with distinct permissions; Department Admin is branch-and-department scoped; Doctor has exactly one branch; inventory reversals are full-only and link to the original movement; batch quantity is authoritative and Medicine.currentStock is its aggregate/cache; expired medicine is never dispensed; active ADMITTED rows determine bed occupancy; application transactions alone synchronize bed and ward display state; no ordinary operational role gets hospital-wide scope. A hospital-wide Department does not broaden a Department Admin's branch scope.

### PostgreSQL enforcement in the second migration draft (not executed)

Candidate keys alone do not enforce cross-record ownership. The second migration draft adds branch/hospital FKs from the schema and triggers for the relationship matrix: Doctor/Employee and Department scope; Appointment→Doctor/Patient/Department; Consultation and Prescription→their visit/patient/doctor; nursing, lab, radiology and medication records; Ward/Bed/Admission; Invoice/Payment/Claim; dispensing; AmbulanceTrip; PatientDocument; and UserRole scope. Parent-only ownership changes can still invalidate old children; the service must prohibit unsafe reassignment until explicit reassignment workflows and database parent guards are approved. Composite FKs also tie auth, notification, audit, and export actors to their hospital.

The full review SQL is in `prisma/migrations/20261121160000_uyirinai_approved_schema_upgrade/migration.sql`. The excerpts below summarize selected rules; they are not a separate migration and have not been executed:

```sql
-- The actual UUID is never embedded in migration SQL.
CREATE UNIQUE INDEX "Hospital_singleton_one_row" ON "Hospital" ((TRUE));
ALTER TABLE "Hospital" ADD CONSTRAINT "Hospital_canonical_code_check"
  CHECK ("code" = 'UYIRINAI');
-- A trigger blocks changing Hospital.id or Hospital.code after provisioning.

-- One active admission per bed.
CREATE UNIQUE INDEX "Admission_one_active_per_bed"
  ON "Admission" ("bedId") WHERE "status" = 'ADMITTED';

ALTER TABLE "MedicineBatch" ADD CONSTRAINT "MedicineBatch_quantity_nonnegative"
  CHECK ("quantity" >= 0);

-- Exactly one positive cutover snapshot per pre-existing batch. Application
-- cutover logic must set its createdAt to the approved ledger cutover instant,
-- and its quantityDelta to the batch quantity at that instant.
CREATE UNIQUE INDEX "InventoryMovement_one_opening_balance_per_batch"
  ON "InventoryMovement" ("batchId") WHERE "movementType" = 'OPENING_BALANCE';
-- A deferred constraint trigger must enforce the movement shapes: opening rows
-- are positive and have no dispensing/reversal link; dispense rows are negative,
-- reference one dispensing record and have no reversal link; reversal rows are
-- positive, reference only the original dispense movement, and exactly negate it.

ALTER TABLE "MasterDataSet" ADD CONSTRAINT "MasterDataSet_scope_consistency"
  CHECK (("scope" = 'SYSTEM' AND "hospitalId" IS NULL AND "isSystem" = TRUE)
      OR ("scope" = 'HOSPITAL' AND "hospitalId" IS NOT NULL AND "isSystem" = FALSE));

-- reversesMovementId unique (also declared unique in Prisma) makes the full
-- reversal at most once. A constraint trigger must validate original.movementType='DISPENSE',
-- new.movementType='DISPENSE_REVERSAL', same batch/medicine/hospital/branch, exact opposite
-- quantity, and reject reversing a reversal. Both rows are immutable thereafter.
-- A UserRole constraint trigger must restrict null branch scope to SUPER_ADMIN and
-- HOSPITAL_ADMIN, require branch+department for DEPARTMENT_ADMIN, and reject a
-- Department whose branch differs from the assignment branch (NULL is permitted).
-- Compound FK DDL for the matrix above must use each table's exact composite key.
-- Do not add occupancy-update triggers: application transactions own that sync.
```

Stock-cache policy: each dispense/reversal transaction adjusts the selected batch and recomputes (or atomically adjusts) Medicine.currentStock from the committed batch total, with concurrent operations serialized by batch locks and safe aggregate update strategy. A scheduled/read-only reconciliation query compares cache with SUM(batch.quantity) and raises drift; it does not silently become another writer. Database validation triggers may reject inconsistent final state but must not duplicate application synchronization.

### Reproducible migrations, seed, and bootstrap

Keep reviewed Prisma migrations reproducible. For a clean install, apply `20261119111627_init` followed by `20261121160000_uyirinai_approved_schema_upgrade`; the second migration refuses to proceed unless the first is recorded and its public application tables are empty. Test both in order on a disposable database after approval. Do not use the from-empty review SQL, `prisma db push`, or `migrate dev` on the target. The target was previously confirmed empty with no `_prisma_migrations`; this preparation did not connect to any database.

Replace destructive/demo seed behavior with an idempotent reference seed limited to required roles, permissions, and approved master settings. It must never delete records, reset operational data, or create fictional patients, doctors, appointments, invoices, or payments. Bootstrap the initial Super Admin separately: one-shot server-side command/process reads credentials from protected environment/secret input, validates the required hospital and role, hashes the password using the application's approved password hasher, creates only the account and hospital-wide Super Admin assignment, writes an audit event, and refuses to overwrite an existing Super Admin. Never store a default or hard-coded password, echo secrets, or include them in seed files. The current README/setup instructions also need a later documentation correction, outside this authorized file list.

### Unresolved decisions (do not infer)

- Whether a Department Admin may hold multiple branch/department assignments.
- Any exceptional hospital-wide or cross-branch scope for other staff (default deny).
- Parent branch/hospital reassignment behavior and parent-side database guards when dependent history exists.
- Whether Department codes should remain hospital-wide unique or become branch-local.
- `Department.headOfDepartmentId` target relation.
- Old-handler confirmation for `Bed.currentPatientId` target.
- Admission transfer and bed cleaning/housekeeping workflow.
- Purchase-order button behavior and procurement lifecycle.
- Expiry-date boundary and business timezone.
- Payment refund/void/reversal workflow.
- Patient portal booking, cancellation, upload, record/result visibility and notification behavior.
- Report formulas, columns, filters and notification delivery details.
