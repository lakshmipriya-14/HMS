# Kizuna Multispeciality Hospital Management System (HMS)
### கிஜுனா பன்னோக்கு மருத்துவமனை

> **"Excellence in Care, Compassion in Healing"**  
> An integrated, enterprise-grade, collaborative Hospital Management System designed for a 10-member software engineering team developing simultaneously in a shared GitHub repository.

---

## 🏥 Hospital Overview & Architecture

**Kizuna Multispeciality Hospital** is a modern hospital network with its apex medical center in Madurai and city campus in Chennai, Tamil Nadu. The platform provides a single integrated backend, unified database, central authentication, shared API contracts, and dedicated role-specific portals for all clinical and administrative personnel.

```
multispeciality-hms/
├── apps/
│   ├── web/                     # React + Vite + Tailwind CSS Web Portal (10 Feature Modules)
│   ├── mobile/                  # React Native + Expo Router App (Nurse, Patient, Ambulance)
│   └── api/                     # NestJS + TypeScript REST Engine (JWT + RBAC + Audit Logs)
├── packages/
│   ├── contracts/               # Shared Enums, DTOs, API Endpoints & Response Wrappers
│   ├── shared-types/            # Domain Entities & Database Record Models
│   ├── validation/              # Zod Schemas for Form & API Request Validation
│   ├── api-client/              # Typed Axios Client with Automatic Token Refresh
│   └── config/                  # Clinical Color Palette & Hospital Metadata
├── prisma/
│   ├── schema.prisma            # PostgreSQL Relational Schema (52 Models)
│   └── seed.ts                  # Realistic Hospital Seed Data (All 16 Demo Roles)
├── docs/                        # Complete Team & Architecture Documentation
│   ├── ARCHITECTURE.md          # Monorepo Design & Security Layers
│   ├── DATABASE.md              # Relational ER Model & Migration Protocol
│   ├── API_CONTRACTS.md         # Versioned REST API Endpoint Specifications
│   ├── MODULE_OWNERS.md         # 10-Member Assignment & Folder Ownership
│   ├── GIT_WORKFLOW.md          # Branch Management & Conflict Prevention
│   ├── SETUP.md                 # Local Installation & Execution Guide
│   ├── INTEGRATION_WORKFLOW.md  # End-to-End Clinical Lifecycle
│   └── ROLE_PERMISSIONS.md      # RBAC Capability Matrix
├── tests/                       # Automated Test Suite (Auth, RBAC, Clinical Journeys)
├── .github/workflows/ci.yml     # Automated Lint, Typecheck & Test CI Pipeline
├── .env.example                 # Environment Variable Template
├── package.json                 # Monorepo Root Script Definitions
└── pnpm-workspace.yaml          # pnpm Monorepo Workspace Configuration
```

---

## 🛠️ Technology Stack

| Domain | Technology Selected |
| :--- | :--- |
| **Web Portal** | React 18, Vite, TypeScript, React Router v7, Tailwind CSS, TanStack Query, Axios, Lucide Icons |
| **Mobile App** | React Native, Expo SDK 52, TypeScript, Expo Router v4, React Native Safe Area |
| **Backend API** | Node.js, NestJS v10, TypeScript, Passport JWT, bcryptjs, class-validator, Swagger OpenAPI |
| **Database & ORM**| PostgreSQL 16, Prisma ORM v6, Automated Prisma Migrations, Database Seed Script |
| **Monorepo** | pnpm Workspaces, TypeScript Base Configurations |
| **Deployment** | Web: Vercel; API: Render / Railway; Database: Hosted PostgreSQL; Mobile: Expo EAS |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js `v20+` or `v22+`
- `pnpm` installed globally: `npm install -g pnpm`
- PostgreSQL instance running locally (or cloud PostgreSQL)

### 2. Setup Environment
```bash
# Clone the repository
git clone https://github.com/organization/multispeciality-hms.git
cd multispeciality-hms

# Copy environment variables
cp .env.example .env
```

### 3. Install & Seed Database
```bash
# Install workspace dependencies
pnpm install

# Build shared contracts, validation & API client packages
pnpm build:packages

# Run database migrations
pnpm db:migrate

# Seed realistic hospital data & demo accounts
pnpm db:seed
```

### 4. Run the Applications
```bash
# Start Backend API & Web Application concurrently
pnpm dev

# Or run individual applications:
pnpm dev:api       # Starts NestJS API on http://localhost:4000/api/v1
pnpm dev:web       # Starts React Web App on http://localhost:3000
pnpm dev:mobile    # Starts Expo Mobile App on http://localhost:8081
```

- **Web Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
- **Interactive Swagger Documentation**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## 🔑 Demo Accounts (Password: `Password@123`)

*Note: The web and mobile login screens include a 1-click role switcher to instantly populate credentials for any role!*

| Role Group | Email Address | Portal Features |
| :--- | :--- | :--- |
| **SUPER_ADMIN** | `superadmin@kizunahospital.com` | Hospital Executive Command & Global User Directory |
| **HOSPITAL_ADMIN** | `hospitaladmin@kizunahospital.com` | Organization Operations & Audit Trail |
| **DEPARTMENT_ADMIN** | `departmentadmin@kizunahospital.com` | Departmental Rosters & Clinical Queues |
| **DOCTOR** | `doctor@kizunahospital.com` | Today's OPD Queue, Consultation Notes & Digital Rx |
| **DOCTOR (Physician)**| `doctor.physician@kizunahospital.com` | General Medicine & Diabetes Follow-ups |
| **NURSE** | `nurse@kizunahospital.com` | Inpatient Bed Census, Vitals Recording & MAR |
| **HEAD_NURSE** | `headnurse@kizunahospital.com` | Ward Supervision & Nursing Task Delegation |
| **RECEPTIONIST** | `reception@kizunahospital.com` | Patient Registration, UHID Issuance & Token Queue |
| **LAB_TECHNICIAN** | `lab@kizunahospital.com` | Specimen Barcodes, Analyzer Results & Reports |
| **PHARMACIST** | `pharmacy@kizunahospital.com` | Prescription Queue, Batch Tracking & FEFO Dispensing |
| **RADIOLOGY_STAFF** | `radiology@kizunahospital.com` | CT/MRI/X-Ray Worklists, Findings & Report Release |
| **BILLING_STAFF** | `billing@kizunahospital.com` | Consolidated Invoices, Cashier POS (Cash/UPI/Cards) |
| **INSURANCE_STAFF** | `insurance@kizunahospital.com` | Cashless TPA Claims & Pre-authorization Tracking |
| **WARD_MANAGER** | `wardmanager@kizunahospital.com` | Visual Bed Layout Map & Housekeeping Turnover |
| **PATIENT** | `patient@kizunahospital.com` | Digital Health Card, My Prescriptions & Lab Results |
| **AMBULANCE_COORD** | `ambulance@kizunahospital.com` | 108 Emergency Dispatch & Fleet Tracking |
| **AMBULANCE_DRIVER** | `driver@kizunahospital.com` | Mobile Driver Run Navigation & ER Trauma Handover |

---

## 👥 10-Member Team Ownership

| Member | Focus Module | Frontend Directory | Backend Directory | Mobile Directory |
| :--- | :--- | :--- | :--- | :--- |
| **M1** | Admin & Security | `apps/web/src/features/admin` | `apps/api/src/auth`, `users`, `rbac` | — |
| **M2** | Doctor Clinical | `apps/web/src/features/doctor` | `apps/api/src/doctors`, `consultations` | — |
| **M3** | Nursing Inpatient | `apps/web/src/features/nursing` | `apps/api/src/nursing` | `apps/mobile/app/(nurse)` |
| **M4** | Reception & Registration | `apps/web/src/features/reception` | `apps/api/src/patients`, `appointments` | — |
| **M5** | Laboratory Diagnostics | `apps/web/src/features/laboratory` | `apps/api/src/laboratory` | — |
| **M6** | Pharmacy & Inventory | `apps/web/src/features/pharmacy` | `apps/api/src/pharmacy` | — |
| **M7** | Radiology & Imaging | `apps/web/src/features/radiology` | `apps/api/src/radiology` | — |
| **M8** | Billing, Insurance & Wards | `apps/web/src/features/billing`, `wards` | `apps/api/src/billing`, `wards` | — |
| **M9** | Patient & Ambulance | `apps/web/src/features/patient`, `ambulance` | `apps/api/src/ambulance` | `apps/mobile/app/(patient)`, `(ambulance)` |
| **M10** | Integration & DevOps | Shared UI & Cross-module integration | `apps/api/src/reports`, `audit` | CI/CD & Test Automation |

---

## 🧪 Testing

Run the automated test suite covering RBAC permissions and the cross-module patient lifecycle:
```bash
pnpm test
```

---

## 📜 Documentation Links

- [Architecture Guide](file:///d:/Multispeciality%20Hospital/docs/ARCHITECTURE.md)
- [Database Schema & ER Model](file:///d:/Multispeciality%20Hospital/docs/DATABASE.md)
- [REST API Contracts](file:///d:/Multispeciality%20Hospital/docs/API_CONTRACTS.md)
- [Team Member Ownership](file:///d:/Multispeciality%20Hospital/docs/MODULE_OWNERS.md)
- [Git Branching Strategy](file:///d:/Multispeciality%20Hospital/docs/GIT_WORKFLOW.md)
- [Local Setup Instructions](file:///d:/Multispeciality%20Hospital/docs/SETUP.md)
- [Clinical Integration Workflow](file:///d:/Multispeciality%20Hospital/docs/INTEGRATION_WORKFLOW.md)
- [Role-Based Access Control Matrix](file:///d:/Multispeciality%20Hospital/docs/ROLE_PERMISSIONS.md)
