# Kizuna HMS — Local Development & Environment Setup Guide

Follow this guide to get the Kizuna Multispeciality Hospital Management System running locally from a clean clone.

---

## 1. Prerequisites

- **Node.js**: `v20+` or `v22+` recommended
- **Package Manager**: `pnpm` (`v9+` or `v12+`)
- **Database**: PostgreSQL 15+ running locally (or hosted via Supabase / Neon / Render)
- **Mobile Development (Optional)**: Expo Go app on iOS/Android or Android Studio Emulator

---

## 2. Environment Configuration

Copy `.env.example` to `.env` in the repository root:
```bash
cp .env.example .env
```

Verify your database connection URL in `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kizuna_hms?schema=public"
JWT_SECRET="kizuna-enterprise-hms-jwt-access-secret-key-2026-very-secure"
JWT_REFRESH_SECRET="kizuna-enterprise-hms-jwt-refresh-secret-key-2026-very-secure"
API_PORT=4000
WEB_PORT=3000
```

---

## 3. Installation & Database Setup

Run the following commands in the monorepo root:

```bash
# 1. Install all workspace dependencies
pnpm install

# 2. Build the shared contracts, validation & API client packages
pnpm build:packages

# 3. Generate Prisma client & apply database migrations
pnpm db:migrate

# 4. Populate realistic hospital seed data (Departments, Doctors, Wards, Medicines, Invoices & All 16 Demo Accounts)
pnpm db:seed
```

---

## 4. Running Applications

### Run Full Stack (Backend API + Web Dashboard concurrently)
```bash
pnpm dev
```
- **Web Application**: `http://localhost:3000`
- **Backend REST API**: `http://localhost:4000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:4000/api/docs`

### Run Services Individually
```bash
# Start Backend API only
pnpm dev:api

# Start Web Application only
pnpm dev:web

# Start Mobile Expo Terminal
pnpm dev:mobile
```

---

## 5. Seeded Demo Accounts (Password: `Password@123`)

| Role | Demo Email Address | Initial Portal |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@kizunahospital.com` | Hospital Executive Dashboard |
| **Hospital Admin** | `hospitaladmin@kizunahospital.com` | Organization Command |
| **Doctor (Surgeon)** | `doctor@kizunahospital.com` | OPD Queue & Clinical Workspace |
| **Doctor (Physician)**| `doctor.physician@kizunahospital.com` | OPD Consultation Queue |
| **Staff Nurse** | `nurse@kizunahospital.com` | Inpatient Care & Vitals Board |
| **Head Nurse** | `headnurse@kizunahospital.com` | Ward Superintendent View |
| **Receptionist** | `reception@kizunahospital.com` | Patient Registration & Tokens |
| **Lab Technician** | `lab@kizunahospital.com` | Analyzer Worklist & Reports |
| **Pharmacist** | `pharmacy@kizunahospital.com` | Prescription Queue & Dispensary |
| **Radiology Staff** | `radiology@kizunahospital.com` | Imaging Studies & Findings |
| **Billing Staff** | `billing@kizunahospital.com` | Invoices & Cashier POS |
| **Insurance Staff** | `insurance@kizunahospital.com` | TPA Claims Settlement |
| **Ward Manager** | `wardmanager@kizunahospital.com` | Bed Census Map & Housekeeping |
| **Ambulance Coordinator** | `ambulance@kizunahospital.com` | Emergency Dispatch Radar |
| **Ambulance Driver** | `driver@kizunahospital.com` | Mobile Driver Run Terminal |
| **Patient Portal** | `patient@kizunahospital.com` | Digital Health Card & My Records |

*Tip: The web login screen includes a 1-click role switcher button for every role!*
