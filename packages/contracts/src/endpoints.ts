export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // Users & Staff
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    ROLES: '/users/roles',
    PERMISSIONS: '/users/permissions',
  },

  // Hospitals & Departments
  HOSPITALS: {
    BASE: '/hospitals',
    BY_ID: (id: string) => `/hospitals/${id}`,
    BRANCHES: (id: string) => `/hospitals/${id}/branches`,
  },
  DEPARTMENTS: {
    BASE: '/departments',
    BY_ID: (id: string) => `/departments/${id}`,
    DOCTORS: (id: string) => `/departments/${id}/doctors`,
    NURSES: (id: string) => `/departments/${id}/nurses`,
  },

  // Doctors
  DOCTORS: {
    BASE: '/doctors',
    BY_ID: (id: string) => `/doctors/${id}`,
    SCHEDULES: (id: string) => `/doctors/${id}/schedules`,
    APPOINTMENTS: (id: string) => `/doctors/${id}/appointments`,
    PATIENTS: (id: string) => `/doctors/${id}/patients`,
  },

  // Patients
  PATIENTS: {
    BASE: '/patients',
    BY_ID: (id: string) => `/patients/${id}`,
    BY_UHID: (uhid: string) => `/patients/uhid/${uhid}`,
    SEARCH: '/patients/search',
    CHECK_DUPLICATE: '/patients/check-duplicate',
    MEDICAL_HISTORY: (id: string) => `/patients/${id}/medical-history`,
    ALLERGIES: (id: string) => `/patients/${id}/allergies`,
    VITALS: (id: string) => `/patients/${id}/vitals`,
  },

  // Appointments & Queue
  APPOINTMENTS: {
    BASE: '/appointments',
    BY_ID: (id: string) => `/appointments/${id}`,
    TODAY: '/appointments/today',
    QUEUE: '/appointments/queue',
    CHECK_IN: (id: string) => `/appointments/${id}/check-in`,
    CANCEL: (id: string) => `/appointments/${id}/cancel`,
    RESCHEDULE: (id: string) => `/appointments/${id}/reschedule`,
    SLOTS: '/appointments/slots',
  },

  // Consultations & Clinical
  CONSULTATIONS: {
    BASE: '/consultations',
    BY_ID: (id: string) => `/consultations/${id}`,
    BY_APPOINTMENT: (appointmentId: string) => `/consultations/appointment/${appointmentId}`,
    PATIENT_HISTORY: (patientId: string) => `/consultations/patient/${patientId}`,
  },
  PRESCRIPTIONS: {
    BASE: '/prescriptions',
    BY_ID: (id: string) => `/prescriptions/${id}`,
    PATIENT: (patientId: string) => `/prescriptions/patient/${patientId}`,
    QUEUE: '/prescriptions/queue',
  },

  // Nursing
  NURSING: {
    ASSIGNMENTS: '/nursing/assignments',
    PATIENTS: '/nursing/patients',
    VITALS: '/nursing/vitals',
    TASKS: '/nursing/tasks',
    TASK_STATUS: (id: string) => `/nursing/tasks/${id}/status`,
    NOTES: '/nursing/notes',
    MEDICATION_ADMIN: '/nursing/medication-administration',
    SHIFT_HANDOVER: '/nursing/shift-handover',
    MEDICINE_REQUEST: '/nursing/medicine-request',
  },

  // Laboratory
  LABORATORY: {
    CATALOGUE: '/laboratory/tests',
    ORDERS: '/laboratory/orders',
    BY_ORDER_ID: (id: string) => `/laboratory/orders/${id}`,
    COLLECT_SAMPLE: (id: string) => `/laboratory/orders/${id}/collect-sample`,
    ENTER_RESULTS: (id: string) => `/laboratory/orders/${id}/results`,
    VALIDATE_REPORT: (id: string) => `/laboratory/orders/${id}/validate`,
    RELEASE_REPORT: (id: string) => `/laboratory/orders/${id}/release`,
    WORKLIST: '/laboratory/worklist',
  },

  // Pharmacy
  PHARMACY: {
    MEDICINES: '/pharmacy/medicines',
    INVENTORY: '/pharmacy/inventory',
    BATCHES: '/pharmacy/batches',
    DISPENSE_QUEUE: '/pharmacy/dispense-queue',
    DISPENSE: (id: string) => `/pharmacy/prescriptions/${id}/dispense`,
    RETURNS: '/pharmacy/returns',
    LOW_STOCK: '/pharmacy/low-stock',
    EXPIRY_ALERTS: '/pharmacy/expiry-alerts',
  },

  // Radiology
  RADIOLOGY: {
    CATALOGUE: '/radiology/tests',
    ORDERS: '/radiology/orders',
    WORKLIST: '/radiology/worklist',
    UPDATE_STATUS: (id: string) => `/radiology/orders/${id}/status`,
    UPLOAD_REPORT: (id: string) => `/radiology/orders/${id}/report`,
    RELEASE: (id: string) => `/radiology/orders/${id}/release`,
  },

  // Wards & Beds
  WARDS: {
    BASE: '/wards',
    BY_ID: (id: string) => `/wards/${id}`,
    BEDS: (wardId: string) => `/wards/${wardId}/beds`,
    OCCUPANCY: '/wards/occupancy',
    ADMISSIONS: '/wards/admissions',
    ADMIT_PATIENT: '/wards/admit',
    TRANSFER_PATIENT: '/wards/transfer',
    DISCHARGE_PATIENT: (admissionId: string) => `/wards/admissions/${admissionId}/discharge`,
  },

  // Billing & Insurance
  BILLING: {
    INVOICES: '/billing/invoices',
    BY_ID: (id: string) => `/billing/invoices/${id}`,
    COLLECT_PAYMENT: (invoiceId: string) => `/billing/invoices/${invoiceId}/payments`,
    GENERATE_FOR_ENCOUNTER: '/billing/invoices/generate',
    INSURANCE_CLAIMS: '/billing/insurance-claims',
    CLAIM_BY_ID: (id: string) => `/billing/insurance-claims/${id}`,
    REPORTS: '/billing/reports',
  },

  // Ambulance
  AMBULANCE: {
    VEHICLES: '/ambulance/vehicles',
    DRIVERS: '/ambulance/drivers',
    REQUESTS: '/ambulance/requests',
    DISPATCH: (requestId: string) => `/ambulance/requests/${requestId}/dispatch`,
    UPDATE_STATUS: (tripId: string) => `/ambulance/trips/${tripId}/status`,
    ACTIVE_TRIPS: '/ambulance/trips/active',
  },

  // Notifications & Audit
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/mark-all-read',
  },
  AUDIT: {
    LOGS: '/audit/logs',
  },
  REPORTS: {
    DASHBOARD_STATS: '/reports/dashboard-stats',
    DEPARTMENT_SUMMARY: '/reports/department-summary',
    BED_OCCUPANCY: '/reports/bed-occupancy',
    FINANCIAL_SUMMARY: '/reports/financial-summary',
  },
} as const;
