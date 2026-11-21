# Kizuna HMS — Role-Based Access Control (RBAC) Matrix

Kizuna HMS enforces fine-grained permission guards across all backend controllers and frontend navigation routes. Below is the authorized capability matrix across all 16 system roles.

---

## 1. Permission Matrix

| Resource | SUPER_ADMIN | HOSPITAL_ADMIN | DEPT_ADMIN | DOCTOR | NURSE | HEAD_NURSE | RECEPTION | LAB_TECH | PHARMACIST | RADIOLOGY | BILLING | INSURANCE | WARD_MGR | PATIENT | AMB_COORD | AMB_DRIVER |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Users & Staff** | ALL | CRUD | VIEW | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **Hospitals & Depts** | ALL | CRUD | VIEW/EDIT | VIEW | VIEW | VIEW | VIEW | — | — | — | — | — | — | — | — | — |
| **Patients** | ALL | VIEW/EXP | VIEW | VIEW | VIEW | VIEW | CRUD | VIEW | VIEW | VIEW | VIEW | VIEW | VIEW | VIEW (Self) | CRUD | — |
| **Appointments** | ALL | ALL | VIEW/MANAGE| VIEW/EDIT | VIEW | VIEW | CRUD | — | — | — | VIEW | — | — | VIEW/BOOK | — | — |
| **Consultations** | ALL | VIEW | VIEW | CRUD | VIEW | VIEW | — | — | — | — | — | — | — | VIEW (Self) | — | — |
| **Prescriptions** | ALL | VIEW | VIEW | CRUD | VIEW | VIEW | — | — | VIEW/DISPENSE | — | — | — | — | VIEW (Self) | — | — |
| **Vitals & Notes** | ALL | VIEW | VIEW | VIEW | CRUD | CRUD | — | — | — | — | — | — | VIEW | VIEW (Self) | — | — |
| **Nursing Tasks** | ALL | VIEW | VIEW | — | VIEW/DONE | ALL | — | — | — | — | — | — | VIEW | — | — | — |
| **Lab Tests & Orders** | ALL | VIEW | VIEW | CREATE/VIEW| — | — | — | ALL | — | — | — | — | — | VIEW (Self) | — | — |
| **Lab Reports Release**| ALL | VIEW | — | VIEW | VIEW | VIEW | — | RELEASE | — | — | — | — | — | VIEW (Self) | — | — |
| **Pharmacy Inventory** | ALL | ALL | — | — | — | — | — | — | ALL | — | — | — | — | — | — | — |
| **Radiology & Scans** | ALL | VIEW | — | CREATE/VIEW| — | — | — | — | — | ALL/RELEASE | — | — | — | VIEW (Self) | — | — |
| **Wards & Beds** | ALL | ALL | — | VIEW | VIEW | MANAGE | VIEW | — | — | — | — | — | ALL | — | — | — |
| **Inpatient Admissions**| ALL | ALL | — | ADMIT/REC | VIEW | MANAGE | CREATE | — | — | — | VIEW | VIEW | MANAGE | VIEW (Self) | — | — |
| **Invoicing & Cashier** | ALL | ALL | — | — | — | — | CREATE | — | CREATE | — | ALL | VIEW | — | VIEW (Self) | — | — |
| **Insurance Claims** | ALL | ALL | — | — | — | — | — | — | — | — | CREATE | ALL/APPROVE | — | VIEW (Self) | — | — |
| **Ambulance Dispatch** | ALL | VIEW | — | — | — | — | — | — | — | — | — | — | — | — | ALL | UPDATE |
| **Security Audit Logs** | ALL | VIEW | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **Hospital Analytics** | ALL | ALL | DEPT_ONLY | MY_STATS | — | WARD_STATS| QUEUE_STATS| LAB_STATS | PHARM_STATS | RAD_STATS | REV_STATS | CLAIM_STATS| BED_STATS | — | FLEET_STATS| — |

---

## 2. Dynamic Scope Resolution

1. **Hospital & Branch Scoping**:
   - Except for `SUPER_ADMIN`, all database queries automatically apply `WHERE hospitalId = :userHospitalId`.
2. **Department Scoping**:
   - `DEPARTMENT_ADMIN` can only assign staff and review schedules within their assigned `departmentId`.
3. **Patient Self-Service Boundary**:
   - Users with role `PATIENT` can query only records matching their linked `patientProfileId`. Access to other patient records returns `403 Forbidden`.
