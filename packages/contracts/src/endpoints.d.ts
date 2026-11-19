export declare const API_ENDPOINTS: {
    readonly AUTH: {
        readonly LOGIN: "/auth/login";
        readonly LOGOUT: "/auth/logout";
        readonly REFRESH: "/auth/refresh";
        readonly ME: "/auth/me";
        readonly CHANGE_PASSWORD: "/auth/change-password";
        readonly FORGOT_PASSWORD: "/auth/forgot-password";
        readonly RESET_PASSWORD: "/auth/reset-password";
    };
    readonly USERS: {
        readonly BASE: "/users";
        readonly BY_ID: (id: string) => string;
        readonly ROLES: "/users/roles";
        readonly PERMISSIONS: "/users/permissions";
    };
    readonly HOSPITALS: {
        readonly BASE: "/hospitals";
        readonly BY_ID: (id: string) => string;
        readonly BRANCHES: (id: string) => string;
    };
    readonly DEPARTMENTS: {
        readonly BASE: "/departments";
        readonly BY_ID: (id: string) => string;
        readonly DOCTORS: (id: string) => string;
        readonly NURSES: (id: string) => string;
    };
    readonly DOCTORS: {
        readonly BASE: "/doctors";
        readonly BY_ID: (id: string) => string;
        readonly SCHEDULES: (id: string) => string;
        readonly APPOINTMENTS: (id: string) => string;
        readonly PATIENTS: (id: string) => string;
    };
    readonly PATIENTS: {
        readonly BASE: "/patients";
        readonly BY_ID: (id: string) => string;
        readonly BY_UHID: (uhid: string) => string;
        readonly SEARCH: "/patients/search";
        readonly CHECK_DUPLICATE: "/patients/check-duplicate";
        readonly MEDICAL_HISTORY: (id: string) => string;
        readonly ALLERGIES: (id: string) => string;
        readonly VITALS: (id: string) => string;
    };
    readonly APPOINTMENTS: {
        readonly BASE: "/appointments";
        readonly BY_ID: (id: string) => string;
        readonly TODAY: "/appointments/today";
        readonly QUEUE: "/appointments/queue";
        readonly CHECK_IN: (id: string) => string;
        readonly CANCEL: (id: string) => string;
        readonly RESCHEDULE: (id: string) => string;
        readonly SLOTS: "/appointments/slots";
    };
    readonly CONSULTATIONS: {
        readonly BASE: "/consultations";
        readonly BY_ID: (id: string) => string;
        readonly BY_APPOINTMENT: (appointmentId: string) => string;
        readonly PATIENT_HISTORY: (patientId: string) => string;
    };
    readonly PRESCRIPTIONS: {
        readonly BASE: "/prescriptions";
        readonly BY_ID: (id: string) => string;
        readonly PATIENT: (patientId: string) => string;
        readonly QUEUE: "/prescriptions/queue";
    };
    readonly NURSING: {
        readonly ASSIGNMENTS: "/nursing/assignments";
        readonly PATIENTS: "/nursing/patients";
        readonly VITALS: "/nursing/vitals";
        readonly TASKS: "/nursing/tasks";
        readonly TASK_STATUS: (id: string) => string;
        readonly NOTES: "/nursing/notes";
        readonly MEDICATION_ADMIN: "/nursing/medication-administration";
        readonly SHIFT_HANDOVER: "/nursing/shift-handover";
        readonly MEDICINE_REQUEST: "/nursing/medicine-request";
    };
    readonly LABORATORY: {
        readonly CATALOGUE: "/laboratory/tests";
        readonly ORDERS: "/laboratory/orders";
        readonly BY_ORDER_ID: (id: string) => string;
        readonly COLLECT_SAMPLE: (id: string) => string;
        readonly ENTER_RESULTS: (id: string) => string;
        readonly VALIDATE_REPORT: (id: string) => string;
        readonly RELEASE_REPORT: (id: string) => string;
        readonly WORKLIST: "/laboratory/worklist";
    };
    readonly PHARMACY: {
        readonly MEDICINES: "/pharmacy/medicines";
        readonly INVENTORY: "/pharmacy/inventory";
        readonly BATCHES: "/pharmacy/batches";
        readonly DISPENSE_QUEUE: "/pharmacy/dispense-queue";
        readonly DISPENSE: (id: string) => string;
        readonly RETURNS: "/pharmacy/returns";
        readonly LOW_STOCK: "/pharmacy/low-stock";
        readonly EXPIRY_ALERTS: "/pharmacy/expiry-alerts";
    };
    readonly RADIOLOGY: {
        readonly CATALOGUE: "/radiology/tests";
        readonly ORDERS: "/radiology/orders";
        readonly WORKLIST: "/radiology/worklist";
        readonly UPDATE_STATUS: (id: string) => string;
        readonly UPLOAD_REPORT: (id: string) => string;
        readonly RELEASE: (id: string) => string;
    };
    readonly WARDS: {
        readonly BASE: "/wards";
        readonly BY_ID: (id: string) => string;
        readonly BEDS: (wardId: string) => string;
        readonly OCCUPANCY: "/wards/occupancy";
        readonly ADMISSIONS: "/wards/admissions";
        readonly ADMIT_PATIENT: "/wards/admit";
        readonly TRANSFER_PATIENT: "/wards/transfer";
        readonly DISCHARGE_PATIENT: (admissionId: string) => string;
    };
    readonly BILLING: {
        readonly INVOICES: "/billing/invoices";
        readonly BY_ID: (id: string) => string;
        readonly COLLECT_PAYMENT: (invoiceId: string) => string;
        readonly GENERATE_FOR_ENCOUNTER: "/billing/invoices/generate";
        readonly INSURANCE_CLAIMS: "/billing/insurance-claims";
        readonly CLAIM_BY_ID: (id: string) => string;
        readonly REPORTS: "/billing/reports";
    };
    readonly AMBULANCE: {
        readonly VEHICLES: "/ambulance/vehicles";
        readonly DRIVERS: "/ambulance/drivers";
        readonly REQUESTS: "/ambulance/requests";
        readonly DISPATCH: (requestId: string) => string;
        readonly UPDATE_STATUS: (tripId: string) => string;
        readonly ACTIVE_TRIPS: "/ambulance/trips/active";
    };
    readonly NOTIFICATIONS: {
        readonly BASE: "/notifications";
        readonly MARK_READ: (id: string) => string;
        readonly MARK_ALL_READ: "/notifications/mark-all-read";
    };
    readonly AUDIT: {
        readonly LOGS: "/audit/logs";
    };
    readonly REPORTS: {
        readonly DASHBOARD_STATS: "/reports/dashboard-stats";
        readonly DEPARTMENT_SUMMARY: "/reports/department-summary";
        readonly BED_OCCUPANCY: "/reports/bed-occupancy";
        readonly FINANCIAL_SUMMARY: "/reports/financial-summary";
    };
};
//# sourceMappingURL=endpoints.d.ts.map