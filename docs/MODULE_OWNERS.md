# Kizuna HMS — 10-Member Team Structure & Folder Ownership Matrix

To facilitate parallel development without merge conflicts, each of the 10 members owns dedicated feature directories across backend, web, and mobile.

---

## Member Assignment Matrix

| Member | Role / Domain | Backend Ownership (`apps/api/src/`) | Web Frontend Ownership (`apps/web/src/features/`) | Mobile App Ownership (`apps/mobile/app/`) | Shared Responsibilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M1** | **Hospital Admin & System Foundation** | `auth/`, `users/`, `rbac/`, `hospitals/`, `branches/`, `departments/`, `employees/`, `audit/` | `admin/` (Super Admin, Hospital Admin, Dept Admin Dashboards) | — | Root config, Prisma Schema Lead, Shared migrations, Base dependencies |
| **M2** | **Doctor Clinical Module** | `doctors/`, `consultations/`, `prescriptions/` | `doctor/` (OPD Queue, Consultation encounter, Digital Rx generator) | — | ICD-10 diagnosis mappings, Clinical encounter flow |
| **M3** | **Nursing & Inpatient Care** | `nursing/` | `nursing/` (Inpatient census, Vitals chart, MAR, Nursing task delegation) | `(nurse)/` (Nurse Mobile App Tabs) | Vitals threshold alert logic, Head Nurse coordination |
| **M4** | **Reception & Registration** | `patients/`, `appointments/` | `reception/` (Patient registration, UHID generator, Token Queue, Doctor search) | — | UHID formatting (`KZN-YYYY-XXXX`), Walk-in check-in tokens |
| **M5** | **Laboratory Diagnostics** | `laboratory/` | `laboratory/` (Test catalogue, Specimen barcodes, Result entry, Report release) | — | Critical laboratory value notification triggers |
| **M6** | **Pharmacy & Formulary** | `pharmacy/` | `pharmacy/` (Dispense queue, Medicine batches, Expiry surveillance, Low stock) | — | FEFO stock deduction transaction safety |
| **M7** | **Radiology & Imaging** | `radiology/` | `radiology/` (Scan worklist, Procedure status, Findings & Report release) | — | Imaging modality workflows (X-Ray, CT, MRI, USG) |
| **M8** | **Billing, Insurance & Wards** | `billing/`, `insurance/`, `wards/`, `admissions/` | `billing/`, `wards/` (Consolidated invoices, Cashier POS, TPA claims, Bed map) | — | Financial reconciliation, Bed turnover housekeeping |
| **M9** | **Patient Portal & Ambulance** | `ambulance/`, `notifications/` | `patient/`, `ambulance/` (Patient web portal, Dispatch dashboard) | `(patient)/`, `(ambulance)/` (Patient & Driver Mobile Tabs) | Emergency 108 trauma lifecycle & patient self-service |
| **M10**| **Integration, QA & DevOps** | `reports/`, `tests/` | Global navigation verification, Cross-module test runner | End-to-end mobile build checks | CI/CD GitHub workflows, Docker, Integration testing, Postman |

---

## Strict Rules of Engagement to Prevent Merge Conflicts

1. **Feature Directory Isolation**:
   - Never directly modify another member's feature directory (`apps/web/src/features/<other_member>`).
   - If a cross-module function is required, call the shared typed API client in `@multispeciality-hms/api-client` or reference contracts in `@multispeciality-hms/contracts`.

2. **Schema & Migration Rule**:
   - **Only Member 1 coordinates Prisma migrations**.
   - If Member 5 needs a new column on `LabTest`, Member 5 submits a pull request proposing the model update to Member 1. Member 1 integrates the schema, runs the migration, and merges it to `develop`.

3. **Shared UI & Layouts**:
   - Common components (`Sidebar`, `Topbar`, `DataTable`, `Modal`) are maintained collaboratively under code review. Do not introduce customized breaking changes to common layouts without team notice.
