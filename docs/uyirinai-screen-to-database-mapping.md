# Old Mobile Screen to Proposed Database/API Mapping

This maps the old Expo Router route inventory to docs/uyirinai-proposed-schema.prisma. Screen appearance, labels, navigation, buttons, forms, validation and workflows remain unchanged requirements. API responsibilities below describe database-backed behavior, not permission to alter the UI.

## Shared routes

| Old mobile screen | Workflow to preserve | Models and API responsibility |
|---|---|---|
| app/_layout.tsx | Restore session; route to auth or role portal | User, UserRole, RefreshToken; validate session and resolve scope from DB |
| app/index.tsx | Select role's initial route | UserRole, Role; return permitted portal route |
| (auth)/login.tsx | Email/password login, submit/loading/error, role-aware redirect | User, UserRole, Role, RefreshToken, AuditLog; login, refresh, logout, current-user; hash and rotate tokens |

The old web login also has forgot-password request, OTP verify, new password, and administrator access-code redemption controls. They map to PasswordResetChallenge, AccountAccessToken, User, RefreshToken, and AuditLog. Confirm whether those exact controls exist in the mobile login before mapping them to mobile.

## Super Admin portal

All screens below live under (super-admin). Super Admin has one hospital-wide UserRole assignment with null branch and department. Dashboard and list APIs remain filtered to the one UYIRINAI hospital.

| Screen | Existing controls/workflow to preserve | Models and API operations |
|---|---|---|
| _layout.tsx | Home, Branches, Admins, Reports, More tabs; hidden detail routes; role redirect | UserRole, Role, Permission; resolve route entitlement and scope |
| index.tsx | Executive metrics, branch/activity cards, Add Branch/Create Admin/View Branches/Reports, notifications/profile, refresh | Hospital, Branch, User, Employee, Doctor, Department, Patient, AuditLog, Notification and aggregates; dashboard summary, recent audit, notification count. Keep unavailable metrics unavailable until their calculation is verified. |
| branches.tsx | Search, multi-select filters, sorting, CSV/PDF/print, Add and details | Branch, Hospital, AuditLog; paginated list/filter/sort/export/create navigation |
| add-branch.tsx | Required name/code, facility type and remaining original fields, validation, submit/loading/success/error/back | Branch; create after duplicate-code validation; audit. Preserve all original fields. |
| branch-details.tsx | Branch record, assigned admin, activate/deactivate, assign admin, return/back | Branch, UserRole, User, Employee, AuditLog; detail, status change and audit |
| edit-branch.tsx | Load/edit original branch profile, validation, submit/status/back | Branch, AuditLog; scoped read/update and audit |
| admins.tsx | Roster, search/filter/sort, CSV/PDF/print, New and details | User, UserRole, Role, Employee, Branch; list/export/detail |
| create-admin.tsx | Name, employee ID, official email and remaining form fields; hospital/department role and location selection | User, Employee, UserRole, Role, Branch, Department, AccountAccessToken; create account/profile/assignment transactionally; issue one-time invitation code |
| assign-admin.tsx | Select admin and target branch; review; assign/reassign | UserRole, User, Branch, AuditLog; atomically replace assignment and audit |
| admin-details.tsx | Admin profile, employee ID, department, branch; activate/deactivate | User, Employee, UserRole, Branch, Department, AuditLog |
| users.tsx | Directory, search/filter/sort, role/status, exports, employee edit, activate/deactivate, invitation/reset code confirmations | User, UserRole, Role, Employee, Branch, Department, AccountAccessToken, AuditLog |
| departments.tsx | Branch filter, search/sort, add, status, CSV/PDF/print | Department, Branch, Employee, Doctor, Ward, AuditLog |
| doctors.tsx | Search, branch filters, sort, CSV/PDF/print | Doctor, Employee, User, Department, DoctorQualification, DoctorSchedule, DoctorLeave |
| patients.tsx | Census, branch filters, search/sort, CSV/PDF/print | Patient, PatientDocument, Appointment, Admission, Consultation, Branch, AuditLog; audit cross-branch access |
| organization-profile.tsx | Load/edit legal identity, code/license and corporate profile | Hospital, AuditLog; get/update and audit |
| roles-permissions.tsx | Role/module matrix, save, immutable Super Admin warning | Role, Permission, RolePermission, HospitalRolePolicy, UserRole, AuditLog; read/update grants, protect Super Admin |
| master-settings.tsx | Existing categories/tabs, search, add name/code/description, active toggle | MasterDataSet, MasterDataItem, AuditLog; list/create/status per existing tab. Do not invent categories. |
| audit-logs.tsx | Search, branch filter, sort, CSV/PDF/print | AuditLog, User, Branch; filtered read/export; audit exports |
| notifications.tsx | Notification center, empty state, notification rows | Notification, User; list/mark read |
| reports.tsx | 12 report types: branch performance/creation/admin/user/employee/doctor/department/patient registration/appointment/revenue/branch comparison/user activity | ReportExportJob plus operational tables; authorized branch filters, CSV/PDF, expiring export. Exact columns/formulas need source-handler review. |
| profile-security.tsx | Profile; current/new/confirm password, validation and submit | User, RefreshToken, AuditLog; verify current password, hash new password, apply approved session policy |
| more.tsx | Navigation shortcuts to profile, organization, users, doctors, departments, patients, permissions, master, audit, notifications | No new persistence; route entitlements from UserRole/Permission |

## Hospital Admin and Department Admin

| Screens | Workflow | Models/API |
|---|---|---|
| (admin)/_layout.tsx, index.tsx | Role guard and dashboard | UserRole, Hospital, Branch, Department, Employee, Doctor, Patient, AuditLog; hospital/assigned-branch summary |
| (admin)/departments.tsx | Department listing/management | Department, Branch, Employee, Doctor, Ward; only original actions |
| (admin)/profile.tsx | Own profile | User, Employee, UserRole; self read/update allowed fields |
| Department Admin role | Old role shares the admin web shell and department authorization; no dedicated mobile Department Admin route group appears in the mobile inventory | UserRole must carry both assigned branch and department. Queries and writes require both; a hospital-wide Department may be referenced but never widens branch access. Multiple assignments remain unresolved. Do not invent a new screen. |

## Clinical and operational role portals

| Old screen(s) | Workflow | Models/API responsibilities |
|---|---|---|
| (doctor)/_layout.tsx, index.tsx | Role guard, daily OPD queue, token/patient/status, start consultation | Doctor, Employee, Appointment, Patient, Department, Consultation; today/queue/check-in/start/complete |
| (doctor)/patients.tsx | Authorized patient list and details | Patient, Appointment, Consultation, Admission; branch/department filter; audit exceptional cross-branch reads |
| (doctor)/prescriptions.tsx | Prescription list/create/update and medicine items | Prescription, PrescriptionItem, Medicine, Consultation |
| (doctor)/profile.tsx | Professional profile | User, Employee, Doctor, DoctorQualification, DoctorSchedule, DoctorLeave; only UI-supported edits |
| (nurse)/_layout.tsx, index.tsx | Nurse/head nurse guard, ward census and tasks | NursingStaff, NursingAssignment, Ward, Bed, Admission, NursingTask |
| (nurse)/patients.tsx | Assigned inpatient list/details | Patient, Admission, Ward, NursingAssignment, VitalsRecord |
| (nurse)/medications.tsx | Medication due/administered dose/notes | Prescription, PrescriptionItem, MedicationAdministration, Admission, NursingStaff; record outcome once |
| (nurse)/tasks.tsx | Assigned tasks and completion | NursingTask, Admission, Patient, NursingStaff; permitted status update |
| (nurse)/profile.tsx | Own profile/shift | User, Employee, NursingStaff, NursingAssignment |
| (reception)/_layout.tsx, index.tsx | Reception queue, refresh, token, patient/doctor/slot/status/actions | Appointment, Patient, Doctor, Department, Branch; queue/check-in/status |
| (reception)/register.tsx | Patient demographics, gender/blood group/contact/identity, duplicate search, UHID | Patient, optional portal User, PatientDocument; duplicate search within hospital, register at current branch |
| (reception)/profile.tsx | Own profile | User, Employee |
| (lab)/_layout.tsx, index.tsx | Lab role guard, worklist, tests and status | LabOrder, LabOrderItem, LabTest, Patient, Doctor |
| (lab)/samples.tsx | Barcode/sample collection/status | LabOrder, LabOrderItem, Patient; idempotent collection |
| (lab)/profile.tsx | Own profile | User, Employee |
| (pharmacy)/_layout.tsx, index.tsx | Dispense queue, patient/prescription/doctor, dispense action | Prescription, PrescriptionItem, Patient, Doctor, DispensingRecord, MedicineBatch, InventoryMovement; idempotent transaction checks expiry and balance, decrements authoritative batch quantity and synchronizes Medicine.currentStock. |
| (pharmacy)/inventory.tsx | Medicine catalogue, stock, price, batch/expiry/reorder display and visible purchase-order affordance | Medicine, MedicineBatch, InventoryMovement; search and alerts. Batch balances are authoritative and currentStock is the hospital aggregate/cache. At cutover, each existing batch receives one positive OPENING_BALANCE movement for its actual opening quantity; no pre-cutover dispense history is fabricated. Purchase-order handler and lifecycle remain unresolved. |
| (pharmacy)/profile.tsx | Own profile | User, Employee |
| (radiology)/_layout.tsx, index.tsx | Worklist, modality, patient/referrer/indication/status, report release | RadiologyOrder, RadiologyTest, Patient, Doctor; findings/impression/release and audit |
| (radiology)/profile.tsx | Own profile | User, Employee |
| (billing)/_layout.tsx, index.tsx | Invoice list/detail/items/amounts/status, payments and claims | Invoice, InvoiceItem, Payment, InsuranceClaim, Patient; list/detail/create/payment/claim, idempotent payment |
| (billing)/beds.tsx | Bed availability/status view | Ward, Bed, Admission, Patient; scoped read, not admission without its existing workflow |
| (billing)/profile.tsx | Own profile | User, Employee |
| (ambulance)/_layout.tsx, index.tsx | Coordinator/driver guard, fleet, active trips, emergency dispatch entry | Ambulance, AmbulanceDriver, Employee, AmbulanceTrip |
| (ambulance)/trips.tsx | Trip list and stage transitions | AmbulanceTrip, Ambulance, AmbulanceDriver; dispatch, valid stage update, handover, audit |
| (ambulance)/profile.tsx | Own profile | User, Employee, AmbulanceDriver |
| (patient)/_layout.tsx, index.tsx | Patient-only guard and dashboard | User, Patient, Appointment, Prescription, LabOrder, LabResult, RadiologyOrder, Notification; resolve the linked patient only |
| (patient)/appointments.tsx | Own appointments and existing actions | Appointment, Patient, Doctor, Department, Branch; self-book/cancel rights remain subject to original handler verification |
| (patient)/records.tsx | Own documents, consultations, admissions, prescriptions and results | PatientDocument, Consultation, Admission, Prescription, LabOrder, LabResult, RadiologyOrder; show only released patient-visible records |
| (patient)/notifications.tsx | Own notifications/read state | Notification, User; recipient-only |
| (patient)/profile.tsx | Patient contact/profile fields | Patient, linked User; only existing fields editable; medical history separately protected |

## Patient portal security mapping

Patient portal authorization is anchored by the authenticated User-to-Patient one-to-one relation. Every dashboard, appointments, records, profile and notifications request derives patient/user scope server-side; client-supplied patient IDs are checked against that link. Data dependencies are Appointment, Consultation, Admission, PatientDocument, Prescription/PrescriptionItem, LabOrder/LabOrderItem/LabResult, RadiologyOrder and Notification. Portal-visible appointment actions, upload rights, dashboard tiles and release/visibility rules remain unresolved until handlers confirm them. Do not expose drafts or unreleased results by assumption. Staff cross-branch reads use explicit permission and are audited.

## Coverage and uncertainties

The mapping covers every old mobile route file in the extracted inventory: root/auth and role groups admin, ambulance, billing, doctor, lab, nurse, patient, pharmacy, radiology, reception and super-admin, including layouts and profile routes. Old web feature folders additionally include Admin, Ambulance, Billing, Doctor, Laboratory, Nursing, Patient, Pharmacy, Radiology, Reception and Wards; the old mobile and web workflows must both be regression-mapped.

Still to confirm from original event handlers: master-setting categories; report columns/formulas; patient self-book/cancel/upload and result visibility rights; refund UI; purchase-order button behavior; expiry date/timezone boundary; and notification details. Doctor multi-branch operation is not an open requirement: the approved design assigns each Doctor to exactly one branch.
## Old web screen/workflow mapping (supplement to the mobile route map)

This table preserves the old web module pages and observed action classes. Exact fields, transition guards, report calculations and handlers remain pending source-event review where flagged; table names do not imply that an action has already been implemented.

| Old web module/screen | Existing workflow represented | Proposed models and required API operations |
|---|---|---|
| AdminDashboard | Hospital administration summary, branch/user activity and navigation | Hospital, Branch, User, Employee, Department, Doctor, Patient, Appointment, Admission, Invoice, AuditLog; scoped aggregate reads, no writes from metrics |
| UserManagement | Search/list users, roles/status, profile/employee updates, activate/deactivate and access-code actions | User, UserRole, Role, Permission, Employee, Branch, Department, AccountAccessToken, AuditLog; scoped list/detail/create/update/deactivate/invite/reset with audit |
| AuditLogs | Filter and inspect audit activity | AuditLog, User, Branch; scoped query/export; no update/delete endpoint |
| AmbulanceDispatchDashboard | Dispatch fleet, record trip, advance stages/handover | Ambulance, AmbulanceDriver, Employee, AmbulanceTrip, Branch; dispatch transaction, stage transition validation and audit |
| BillingDashboard | Invoice detail/line items, receive payment, insurance claims, payment methods | Invoice, InvoiceItem, Payment, InsuranceClaim, Patient; scoped reads, idempotent payment and claim create/status operations; refunds not established |
| DoctorDashboard | OPD queue, patient context, start consultation and prescribe | Appointment, Patient, Doctor, Department, Consultation, Prescription, PrescriptionItem, Medicine; status transition, consultation write, prescription write |
| LaboratoryDashboard | Worklist, sample/barcode, test result entry and release | LabOrder, LabOrderItem, LabTest, TestParameter, LabResult, Patient, Doctor, User; collect, record results, release with actor/time/audit |
| NursingDashboard | Ward/admission list, vitals, tasks and medication administration | Ward, Bed, Admission, NursingAssignment, NursingTask, VitalsRecord, MedicationAdministration, NursingStaff; scoped reads and event writes |
| PatientPortalDashboard | Patient own record summary and links | User, Patient, Appointment, Prescription, LabOrder/LabResult, RadiologyOrder, Notification; derive Patient from login and filter visible/released data; exact dashboard tiles unresolved |
| PharmacyDashboard | Dispense queue, catalogue/batch/expiry and dispense | Prescription, PrescriptionItem, Medicine, MedicineBatch, DispensingRecord, InventoryMovement, User; locked idempotent dispense and branch-scoped stock reads |
| RadiologyDashboard | Imaging worklist, findings/impression and report release | RadiologyOrder, RadiologyTest, Patient, Doctor, User; status/result/release API with audit |
| ReceptionDashboard | Register/search patient, queue, book/check-in appointment | Patient, User, PatientDocument, Appointment, Doctor, Department, Branch; duplicate search, register, schedule, check-in/status operations; preserve source validation |
| WardManagementDashboard | Ward/bed map and admission workflow | Ward, Bed, Admission, Patient, Doctor, Branch; bed census, lock-safe admission, discharge and status operations |
| Super Admin web screens | Organization, branches, users/admins, roles/permissions, settings, audit, notifications, reports | Hospital, Branch, Department, User, Employee, UserRole, Role, Permission, RolePermission, HospitalRolePolicy, MasterDataSet/Item, AuditLog, Notification, ReportExportJob plus report sources; CRUD/export only for observed actions |

Patient portal detail: appointment booking/cancellation permissions; whether patients may upload documents; which lab/radiology states are visible; patient-facing release rules; exact report tiles; and notifications are not confidently settled by route names alone. Keep patient-scoped endpoints and schema links, but do not activate unverified actions or expose unreleased data until original handlers confirm behavior. Mobile routes remain mapped in the table above this supplement; no old route is removed or redesigned.

Additional scope safety mapping: AccountAccessToken, PasswordResetChallenge and Notification recipient records must use the same hospital as their User. AuditLog stores the actor's hospital and branch snapshot; deletion of the linked account does not delete the log. The Patient portal remains anchored to a same-hospital User-Patient relation. Staff API scope still comes from persisted UserRole assignments and is audited for cross-branch patient access.

## Approved access scope and concurrency requirements

- Super Admin receives hospital-wide access within the single UYIRINAI hospital. Hospital Admin also has hospital-wide management scope, with a distinct permission set. Every query remains constrained to the permanent native UUID `Hospital.id`; the canonical hospital code is `UYIRINAI`. The actual Hospital row/UUID is provisioned separately and is not embedded in migration SQL.
- Department Admin API operations require both UserRole branch and department scope. A hospital-wide Department does not grant access to another branch. Ordinary operational roles cannot receive null branch scope.
- Every Doctor is assigned to one branch. Appointment, prescription, nursing, lab, radiology, pharmacy, ward, admission, billing and ambulance writes bind to their operating branch and validate related records against it. Patient identity may be accessed across branches only with explicit permission and an audit event.
- Pharmacy dispense and full reversal require an idempotent transaction, batch lock, non-expired batch check, immutable movement and synchronized aggregate cache. A full reversal links to its original dispense movement and is allowed once only.
- Admission and discharge use row-locked/conditional transactions updating Admission, Bed display state/current-patient fields and Ward.occupiedBeds together. A partial unique active-admission-per-bed index is a second database guard. Database triggers do not synchronize occupancy.

## Module dependency and parity sequence

1. Hospital, branch, user, role, permission and audit foundation.
2. Employee, doctor and patient identity links; secure patient portal identity.
3. Appointment and reception flows, then consultation and prescription.
4. Ward/bed/admission foundation, then nursing assignment, vitals, tasks and medication administration.
5. Laboratory and radiology order/sample/result/release flows.
6. Medicine batches and dispensing, then inventory ledger/reversal and stock reports.
7. Invoice, payment and insurance claim flows; payment refund/reversal remains unresolved.
8. Ambulance fleet and trip transitions.
9. Master settings, notifications, report calculations and CSV/PDF/print exports.

Each stage must map every old screen control, form field, button action, API authorization, status transition and report output to the models and operations above. This is a dependency plan, not permission to change UI or omit a workflow. No purchase-order behavior, patient permission, report formula, or notification delivery behavior should be invented where the existing handler has not confirmed it.
