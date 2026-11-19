# Aalayam Multispeciality Hospital Management System — Architecture

## 1. System Philosophy & Monorepo Design

Aalayam Multispeciality Hospital Management System (HMS) is designed as a unified, enterprise-grade, collaborative monorepo powered by `pnpm` workspaces. It consolidates hospital administration, outpatient care (OPD), inpatient care (IPD), diagnostics, pharmacy, billing, and emergency transport under a single cohesive system.

```
+----------------------------------------------------------------------------------------------------+
|                                    AALAYAM HMS ENTERPRISE MONOREPO                                 |
+----------------------------------------------------------------------------------------------------+
|  APPLICATIONS (apps/)                                                                              |
|  +---------------------------+   +----------------------------+   +-----------------------------+  |
|  |        apps/web           |   |        apps/mobile         |   |          apps/api           |  |
|  |  React + Vite + Tailwind  |   |  React Native Expo Router  |   |    NestJS REST API Engine   |  |
|  |  (10 Role-Based Dashboards|   |  (Nurse, Patient, Amb Tabs)|   |    JWT + RBAC + Audit Logs  |  |
|  +-------------+-------------+   +-------------+--------------+   +--------------+--------------+  |
|                |                               |                                 |                 |
|  SHARED PACKAGES (packages/)                   |                                 |                 |
|  +---------------------------------------------+---------------------------------+--------------+  |
|  |  @multispeciality-hms/contracts    : Shared enums, DTOs, API endpoints, response envelopes   |  |
|  |  @multispeciality-hms/shared-types : Domain entity interfaces & database record models        |  |
|  |  @multispeciality-hms/validation   : Zod schemas for forms, mutations & request payloads     |  |
|  |  @multispeciality-hms/api-client   : Axios client with JWT refresh, interceptors & typings    |  |
|  |  @multispeciality-hms/config       : Clinical theme tokens, branding & hospital metadata      |  |
|  +-------------------------------------------------------------------------------+--------------+  |
|                                                                                  |                 |
|  DATA & PERSISTENCE (prisma/)                                                    |                 |
|  +-------------------------------------------------------------------------------+--------------+  |
|  |  PostgreSQL 16 + Prisma ORM: 52 Relational Models, Soft-Deletes, Audit Trails & Seed Data    |  |
|  +----------------------------------------------------------------------------------------------+  |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Shared Technology Stack

| Layer | Technologies Selected |
| :--- | :--- |
| **Web Application** | React 18, Vite, TypeScript, React Router v7, Tailwind CSS, TanStack Query, Axios, Lucide Icons |
| **Mobile Application** | React Native, Expo SDK 52, TypeScript, Expo Router v4, React Native Safe Area, Lucide Native |
| **Backend API Engine** | Node.js v22+, NestJS v10, TypeScript, REST API v1, Passport JWT, bcryptjs, class-validator, Swagger |
| **Database & ORM** | PostgreSQL, Prisma ORM v6, Automated Migrations, Comprehensive Seed Script |
| **Monorepo Tooling** | pnpm workspaces, TypeScript project references |
| **Target Deployment** | Web: Vercel; API: Render / Railway; DB: Supabase / Neon / AWS RDS; Mobile: Expo EAS APK/AAB |

---

## 3. Security, Authentication & Access Control

1. **Centralized Authentication**:
   - Single endpoint `/api/v1/auth/login` for all roles.
   - Dual-token model:
     - **Access Token**: Short-lived (15 minutes), signed with `JWT_SECRET`.
     - **Refresh Token**: Long-lived (7 days), stored in database table `RefreshToken` with rotation and revocation on logout or password change.
   - Transparent 401 interceptor in `@multispeciality-hms/api-client` queues pending requests during token refresh.

2. **Role-Based Access Control (RBAC)**:
   - 16 distinct role groups configured in `prisma/schema.prisma` and `@multispeciality-hms/contracts`:
     `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `DEPARTMENT_ADMIN`, `DOCTOR`, `NURSE`, `HEAD_NURSE`, `RECEPTIONIST`, `LAB_TECHNICIAN`, `PHARMACIST`, `RADIOLOGY_STAFF`, `BILLING_STAFF`, `INSURANCE_STAFF`, `WARD_MANAGER`, `PATIENT`, `AMBULANCE_COORDINATOR`, `AMBULANCE_DRIVER`.
   - Backend guards (`JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`) verify permissions before handler execution.
   - Multi-scope constraints: Hospital scope, Branch scope, Department scope, and Assigned-patient restrictions.

3. **Immutable Audit Trail**:
   - Every login, clinical consultation, prescription creation, lab report release, billing payment, and emergency dispatch is logged in the `AuditLog` table with timestamp, user role, action, resource, IP address, and details JSON.
