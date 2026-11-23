# Kizuna HMS — REST API Contracts & Endpoints Specification

All backend endpoints are prefixed with `/api/v1`.
Live interactive Swagger documentation is hosted at: `http://localhost:4000/api/docs`.

---

## 1. Standard Response Envelope

### Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "message": "Patient registered successfully. UHID issued.",
  "data": {
    "id": "c1f7a0b3-9e41-4c6e-8e8e-d9124483812a",
    "uhid": "KZN-2026-0001",
    "firstName": "Muthuvel",
    "lastName": "Karuppiah"
  },
  "meta": {
    "timestamp": "2026-11-19T10:00:00.000Z"
  }
}
```

### Error Response (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`)
```json
{
  "success": false,
  "message": "Access denied: Missing required permission [LAB_RESULTS:RELEASE]",
  "errorCode": "FORBIDDEN",
  "meta": {
    "timestamp": "2026-11-19T10:00:00.000Z"
  }
}
```

---

## 2. Core API Endpoints

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Guard / Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Log in with email & password | Public |
| `POST` | `/auth/refresh` | Issue new access token using refresh token | Public |
| `GET` | `/auth/me` | Fetch active user profile & RBAC permissions | Bearer JWT |
| `POST` | `/auth/change-password` | Update account password | Bearer JWT |
| `POST` | `/auth/logout` | Invalidate active refresh token | Bearer JWT |

### 👥 User & Department Administration (`/api/v1/users`, `/api/v1/departments`)
| Method | Endpoint | Description | Guard / Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | List staff with role and department filter | `SUPER_ADMIN`, `HOSPITAL_ADMIN` |
| `GET` | `/users/:id` | Fetch user details and employee code | `SUPER_ADMIN`, `HOSPITAL_ADMIN` |
| `GET` | `/departments` | List clinical hospital departments | Bearer JWT |
| `GET` | `/hospitals` | Hospital and branches configuration | Bearer JWT |

### 🏥 Patient Registration & Reception (`/api/v1/patients`, `/api/v1/appointments`)
| Method | Endpoint | Description | Guard / Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/patients` | Register new patient & issue UHID | `RECEPTIONIST`, `ADMIN` |
| `GET` | `/patients/search` | Search by UHID, phone number or name | Bearer JWT |
| `GET` | `/patients/check-duplicate`| Check existing phone or email | `RECEPTIONIST`, `ADMIN` |
| `GET` | `/patients/:id` | Full medical record & past encounters | Bearer JWT |
| `POST` | `/appointments` | Schedule OPD slot & generate token | Bearer JWT |
| `GET` | `/appointments/queue` | Today's outpatient token queue | Bearer JWT |
| `POST` | `/appointments/:id/check-in`| Check in patient on arrival | `RECEPTIONIST` |

### 🩺 Doctor Clinical Module (`/api/v1/consultations`, `/api/v1/prescriptions`)
| Method | Endpoint | Description | Guard / Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/consultations` | Save clinical note, diagnosis, and treatment plan | `DOCTOR` |
| `GET` | `/consultations/patient/:id`| Patient clinical history | `DOCTOR`, `PATIENT` |
| `POST` | `/prescriptions` | Create digital multi-item prescription | `DOCTOR` |
| `GET` | `/prescriptions/queue` | Dispensary queue waiting for fulfillment | `PHARMACIST`, `DOCTOR` |

### 💉 Nursing Inpatient Care (`/api/v1/nursing`)
| Method | Endpoint | Description | Guard / Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/nursing/patients` | Admitted ward patients with latest vitals | `NURSE`, `HEAD_NURSE` |
| `POST` | `/nursing/vitals` | Chart vital signs & flag abnormal readings | `NURSE`, `HEAD_NURSE` |
| `GET` | `/nursing/tasks` | Inpatient care checklist | `NURSE`, `HEAD_NURSE` |
| `POST` | `/nursing/medication-administration`| Inpatient MAR verification | `NURSE` |

### 🔬 Laboratory & Pathology (`/api/v1/laboratory`)
| Method | Endpoint | Description | Guard / Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/laboratory/tests` | Test catalogue with reference ranges | Bearer JWT |
| `POST` | `/laboratory/orders` | Doctor lab investigation order | `DOCTOR` |
| `GET` | `/laboratory/worklist` | Pending sample analysis worklist | `LAB_TECHNICIAN` |
| `POST` | `/laboratory/orders/:id/collect-sample`| Log sample collection & barcode | `LAB_TECHNICIAN` |
| `POST` | `/laboratory/orders/:id/results`| Enter measured parameter values | `LAB_TECHNICIAN` |
| `POST` | `/laboratory/orders/:id/release`| Officially release validated report | `LAB_TECHNICIAN` |

### 💊 Pharmacy & Inventory (`/api/v1/pharmacy`)
| Method | Endpoint | Description | Guard / Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/pharmacy/medicines` | Formulary search and stock on hand | Bearer JWT |
| `GET` | `/pharmacy/dispense-queue`| Pending prescription orders | `PHARMACIST` |
| `POST` | `/pharmacy/prescriptions/:id/dispense`| Deduct batch stock & dispense | `PHARMACIST` |
| `GET` | `/pharmacy/low-stock` | Low stock reorder alerts | `PHARMACIST`, `ADMIN` |

### 🩻 Radiology & Imaging (`/api/v1/radiology`)
| Method | Endpoint | Description | Guard / Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/radiology/tests` | Scan catalogue (X-Ray, CT, MRI, USG) | Bearer JWT |
| `POST` | `/radiology/orders` | Order diagnostic imaging study | `DOCTOR` |
| `GET` | `/radiology/worklist` | Imaging procedure worklist | `RADIOLOGY_STAFF` |
| `POST` | `/radiology/orders/:id/report` | Upload findings & release report | `RADIOLOGY_STAFF` |

### 🛏️ Wards & Bed Admissions (`/api/v1/wards`)
| Method | Endpoint | Description | Guard / Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/wards` | All wards with bed census & occupancy % | Bearer JWT |
| `GET` | `/wards/:wardId/beds` | Real-time bed status map | Bearer JWT |
| `POST` | `/wards/admit` | Admit patient and allocate bed | `WARD_MANAGER`, `RECEPTIONIST` |
| `POST` | `/wards/admissions/:id/discharge`| Discharge patient and release bed | `WARD_MANAGER`, `DOCTOR` |

### 💳 Billing & Insurance (`/api/v1/billing`)
| Method | Endpoint | Description | Guard / Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/billing/invoices` | List invoices with patient filter | `BILLING_STAFF`, `ADMIN` |
| `POST` | `/billing/invoices` | Generate consolidated hospital invoice | `BILLING_STAFF` |
| `POST` | `/billing/invoices/:id/payments`| Record Cash, UPI, or Card payment | `BILLING_STAFF` |
| `GET` | `/billing/insurance-claims`| List TPA insurance claims | `INSURANCE_STAFF`, `BILLING_STAFF` |

### 🚑 Emergency & Ambulance (`/api/v1/ambulance`)
| Method | Endpoint | Description | Guard / Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/ambulance/vehicles` | Real-time ambulance fleet availability | Bearer JWT |
| `GET` | `/ambulance/active` | Active 108 emergency missions | Bearer JWT |
| `POST` | `/ambulance/requests` | Dispatch nearest ambulance vehicle | `AMBULANCE_COORDINATOR` |
| `PATCH` | `/ambulance/trips/:id/status`| Update trip lifecycle from driver app | `AMBULANCE_DRIVER` |
