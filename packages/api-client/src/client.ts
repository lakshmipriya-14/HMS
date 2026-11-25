import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  API_ENDPOINTS,
  ApiResponse,
  AuthUserDto,
  ChangePasswordRequestDto,
  CreateAmbulanceRequestDto,
  CreateAppointmentDto,
  CreateConsultationDto,
  CreateInvoiceDto,
  CreateLabOrderDto,
  CreateNursingTaskDto,
  CreatePrescriptionDto,
  CreateRadiologyOrderDto,
  DispensePrescriptionDto,
  EnterLabResultsDto,
  LoginRequestDto,
  LoginResponseDto,
  PublicAppointmentRequestInput,
  PublicAppointmentRequestReceipt,
  RecordVitalsDto,
  PasswordResetProof,
  AuthSessionSummaryDto,
  SuperAdminDashboardDto,
  RegisterPatientDto,
} from '@multispeciality-hms/contracts';

export interface ApiClientConfig {
  baseURL: string;
  cookieSession?: boolean;
  getAccessToken?: () => string | null;
  getRefreshToken?: () => string | null;
  setTokens?: (accessToken: string, refreshToken: string) => void;
  clearTokens?: () => void;
  onUnauthorized?: () => void;
}

export class AalayamApiClient {
  private instance: AxiosInstance;
  private config: ApiClientConfig;
  private refreshing?: Promise<LoginResponseDto>;
  private signingOut = false;

  private get sessionHeaders() {
    return this.config.cookieSession ? { 'X-HMS-Session': 'cookie' } : undefined;
  }

  private refreshSession(): Promise<LoginResponseDto> {
    if (this.refreshing) return this.refreshing;
    if (this.signingOut) return Promise.reject(new Error('Sign-out in progress.'));
    const refreshToken = this.config.getRefreshToken?.();
    if (!refreshToken && !this.config.cookieSession) return Promise.reject(new Error('No session to restore.'));
    const request = this.instance.post<ApiResponse<LoginResponseDto>>(API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken: this.config.cookieSession ? undefined : refreshToken }, { headers: this.sessionHeaders })
      .then(({ data: response }) => {
        if (!response.data) throw new Error('No session returned.');
        this.config.setTokens?.(response.data.accessToken, response.data.refreshToken);
        return response.data;
      });
    this.refreshing = request.finally(() => { this.refreshing = undefined; });
    return this.refreshing;
  }

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.instance = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
      withCredentials: !!config.cookieSession,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request Interceptor: Attach JWT
    this.instance.interceptors.request.use(
      (reqConfig: InternalAxiosRequestConfig) => {
        const token = this.config.getAccessToken ? this.config.getAccessToken() : null;
        if (token && reqConfig.headers) {
          reqConfig.headers.Authorization = `Bearer ${token}`;
        }
        return reqConfig;
      },
      (error) => Promise.reject(error)
    );

    // Response Interceptor: Handle Refresh & Formatted Errors
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiResponse>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        const route = originalRequest?.url;
        const authPublic = route?.startsWith('/auth/')
          && route !== API_ENDPOINTS.AUTH.ME && route !== API_ENDPOINTS.AUTH.SESSIONS && route !== API_ENDPOINTS.AUTH.CHANGE_PASSWORD;
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !authPublic && !this.signingOut) {
          originalRequest._retry = true;
          try {
            await this.refreshSession();
            return this.instance(originalRequest);
          } catch (refreshError) {
            this.config.clearTokens?.();
            this.config.onUnauthorized?.();
            throw refreshError;
          }
        }
        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private normalizeError(error: AxiosError<ApiResponse>): Error {
    if (error.response?.data?.message) {
      const err = new Error(error.response.data.message);
      (err as any).errorCode = error.response.data.errorCode;
      (err as any).status = error.response.status;
      (err as any).errors = error.response.data.errors;
      return err;
    }
    return new Error(error.message || 'An unexpected hospital network error occurred');
  }

  // --- MEMBER 1 & COMMON: Auth & Administration ---
  public appointmentRequests = {
    submit: async (input: PublicAppointmentRequestInput) => {
      try {
        // Public intake must not send a staff session or attempt token refresh.
        const res = await axios.post<ApiResponse<PublicAppointmentRequestReceipt>>(
          `${this.config.baseURL.replace(/\/$/, '')}${API_ENDPOINTS.PUBLIC_APPOINTMENT_REQUESTS}`,
          input,
          { timeout: 15000, withCredentials: false },
        );
        return res.data;
      } catch (error) {
        if (axios.isAxiosError<ApiResponse>(error)) throw this.normalizeError(error);
        throw error;
      }
    },
  };

  public auth = {
    login: async (dto: LoginRequestDto) => {
      const res = await this.instance.post<ApiResponse<LoginResponseDto>>(API_ENDPOINTS.AUTH.LOGIN, dto, { headers: this.sessionHeaders });
      if (res.data.data) this.config.setTokens?.(res.data.data.accessToken, res.data.data.refreshToken);
      return res.data;
    },
    restore: () => this.refreshSession(),
    logout: async () => {
      this.signingOut = true;
      try {
        await this.refreshing?.catch(() => undefined);
        const refreshToken = this.config.cookieSession ? undefined : this.config.getRefreshToken?.();
        const res = await this.instance.post<ApiResponse<void>>(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken }, { headers: this.sessionHeaders });
        return res.data;
      } finally {
        this.config.clearTokens?.();
        this.signingOut = false;
      }
    },
    getMe: async () => (await this.instance.get<ApiResponse<AuthUserDto>>(API_ENDPOINTS.AUTH.ME)).data,
    getSessions: async () => (await this.instance.get<ApiResponse<AuthSessionSummaryDto[]>>(API_ENDPOINTS.AUTH.SESSIONS)).data,
    changePassword: async (dto: ChangePasswordRequestDto) => {
      const res = await this.instance.post<ApiResponse<void>>(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, dto);
      this.config.clearTokens?.();
      return res.data;
    },
    requestPasswordReset: async (email: string) =>
      (await this.instance.post<ApiResponse<{ mode: 'development' | 'delivery' }>>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email })).data,
    verifyResetOtp: async (email: string, otp: string) =>
      (await this.instance.post<ApiResponse<PasswordResetProof>>(API_ENDPOINTS.AUTH.VERIFY_RESET_OTP, { email, otp })).data,
    resetPassword: async (proof: PasswordResetProof, newPassword: string) =>
      (await this.instance.post<ApiResponse<void>>(API_ENDPOINTS.AUTH.RESET_PASSWORD, { ...proof, newPassword })).data,
    redeemAccountAccess: async (code: string, newPassword: string) => {
      const cleanCode = typeof code === 'string' ? code.replace(/\s+/g, '') : code;
      return (await this.instance.post<ApiResponse<void>>(API_ENDPOINTS.AUTH.REDEEM_ACCOUNT_ACCESS, { code: cleanCode, newPassword })).data;
    },
  };

  public admin = {
    getSuperAdminDashboard: async () =>
      (await this.instance.get<ApiResponse<SuperAdminDashboardDto>>('/reports/super-admin-dashboard')).data,
    getUsers: async (params?: any) => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.USERS.BASE, { params });
      return res.data;
    },
    createUser: async (dto: any) => {
      const res = await this.instance.post<ApiResponse<any>>(API_ENDPOINTS.USERS.BASE, dto);
      return res.data;
    },
    getHospitals: async () => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.HOSPITALS.BASE);
      return res.data;
    },
    getDepartments: async () => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.DEPARTMENTS.BASE);
      return res.data;
    },
    getAuditLogs: async (params?: any) => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.AUDIT.LOGS, { params });
      return res.data;
    },
    getDashboardStats: async () => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.REPORTS.DASHBOARD_STATS);
      return res.data;
    },
  };

  // --- MEMBER 4: Reception & Patient Registration ---
  public reception = {
    registerPatient: async (dto: RegisterPatientDto) => {
      const res = await this.instance.post<ApiResponse<any>>(API_ENDPOINTS.PATIENTS.BASE, dto);
      return res.data;
    },
    searchPatients: async (query: string) => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.PATIENTS.SEARCH, { params: { query } });
      return res.data;
    },
    checkDuplicate: async (phone: string, email?: string) => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.PATIENTS.CHECK_DUPLICATE, {
        params: { phone, email },
      });
      return res.data;
    },
    bookAppointment: async (dto: CreateAppointmentDto) => {
      const res = await this.instance.post<ApiResponse<any>>(API_ENDPOINTS.APPOINTMENTS.BASE, dto);
      return res.data;
    },
    checkInAppointment: async (appointmentId: string) => {
      const res = await this.instance.post<ApiResponse<any>>(API_ENDPOINTS.APPOINTMENTS.CHECK_IN(appointmentId));
      return res.data;
    },
    getTodayQueue: async () => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.APPOINTMENTS.QUEUE);
      return res.data;
    },
  };

  // --- Appointments Management ---
  public appointments = {
    list: async (params?: { date?: string; departmentId?: string; status?: string; doctorId?: string }) => {
      const res = await this.instance.get<ApiResponse<any[]>>('/appointments', { params });
      return res.data;
    },
    reschedule: async (id: string, dto: { appointmentDate: string; appointmentTime: string }) => {
      const res = await this.instance.patch<ApiResponse<any>>(`/appointments/${id}/reschedule`, dto);
      return res.data;
    },
    cancel: async (id: string, reason?: string) => {
      const res = await this.instance.patch<ApiResponse<any>>(`/appointments/${id}/cancel`, { reason });
      return res.data;
    },
  };

  // --- Patients Management ---
  public patients = {
    search: async (q?: string) => {
      const res = await this.instance.get<ApiResponse<any[]>>('/patients', { params: { search: q } });
      return res.data;
    },
  };

  // --- MEMBER 2: Doctor Clinical Module ---
  public doctor = {
    getAppointments: async (doctorId?: string) => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.APPOINTMENTS.TODAY, {
        params: { doctorId },
      });
      return res.data;
    },
    getPatientHistory: async (patientId: string) => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.PATIENTS.MEDICAL_HISTORY(patientId));
      return res.data;
    },
    createConsultation: async (dto: CreateConsultationDto) => {
      const res = await this.instance.post<ApiResponse<any>>(API_ENDPOINTS.CONSULTATIONS.BASE, dto);
      return res.data;
    },
    createPrescription: async (dto: CreatePrescriptionDto) => {
      const res = await this.instance.post<ApiResponse<any>>(API_ENDPOINTS.PRESCRIPTIONS.BASE, dto);
      return res.data;
    },
    orderLabTest: async (dto: CreateLabOrderDto) => {
      const res = await this.instance.post<ApiResponse<any>>(API_ENDPOINTS.LABORATORY.ORDERS, dto);
      return res.data;
    },
    orderRadiology: async (dto: CreateRadiologyOrderDto) => {
      const res = await this.instance.post<ApiResponse<any>>(API_ENDPOINTS.RADIOLOGY.ORDERS, dto);
      return res.data;
    },
  };

  // --- MEMBER 3: Nursing Module ---
  public nursing = {
    getAssignedPatients: async () => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.NURSING.PATIENTS);
      return res.data;
    },
    recordVitals: async (dto: RecordVitalsDto) => {
      const res = await this.instance.post<ApiResponse<any>>(API_ENDPOINTS.NURSING.VITALS, dto);
      return res.data;
    },
    getTasks: async () => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.NURSING.TASKS);
      return res.data;
    },
    createTask: async (dto: CreateNursingTaskDto) => {
      const res = await this.instance.post<ApiResponse<any>>(API_ENDPOINTS.NURSING.TASKS, dto);
      return res.data;
    },
    completeTask: async (taskId: string) => {
      const res = await this.instance.patch<ApiResponse<any>>(API_ENDPOINTS.NURSING.TASK_STATUS(taskId), {
        isCompleted: true,
      });
      return res.data;
    },
    administerMedication: async (dto: any) => {
      const res = await this.instance.post<ApiResponse<any>>(API_ENDPOINTS.NURSING.MEDICATION_ADMIN, dto);
      return res.data;
    },
  };

  // --- MEMBER 5: Laboratory Module ---
  public laboratory = {
    getCatalogue: async () => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.LABORATORY.CATALOGUE);
      return res.data;
    },
    getWorklist: async () => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.LABORATORY.WORKLIST);
      return res.data;
    },
    collectSample: async (orderId: string, barcode: string) => {
      const res = await this.instance.post<ApiResponse<any>>(API_ENDPOINTS.LABORATORY.COLLECT_SAMPLE(orderId), {
        barcode,
      });
      return res.data;
    },
    enterResults: async (dto: EnterLabResultsDto) => {
      const res = await this.instance.post<ApiResponse<any>>(
        API_ENDPOINTS.LABORATORY.ENTER_RESULTS(dto.orderId),
        dto
      );
      return res.data;
    },
    releaseReport: async (orderId: string) => {
      const res = await this.instance.post<ApiResponse<any>>(API_ENDPOINTS.LABORATORY.RELEASE_REPORT(orderId));
      return res.data;
    },
  };

  // --- MEMBER 6: Pharmacy Module ---
  public pharmacy = {
    getMedicines: async (search?: string) => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.PHARMACY.MEDICINES, {
        params: { search },
      });
      return res.data;
    },
    getPrescriptionQueue: async () => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.PHARMACY.DISPENSE_QUEUE);
      return res.data;
    },
    dispensePrescription: async (dto: DispensePrescriptionDto) => {
      const res = await this.instance.post<ApiResponse<any>>(
        API_ENDPOINTS.PHARMACY.DISPENSE(dto.prescriptionId),
        dto
      );
      return res.data;
    },
    getLowStock: async () => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.PHARMACY.LOW_STOCK);
      return res.data;
    },
    getLowStockAlerts: async () => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.PHARMACY.LOW_STOCK);
      return res.data;
    },
    getExpiryAlerts: async () => {
      const res = await this.instance.get<ApiResponse<any>>('/pharmacy/alerts/expiring');
      return res.data;
    },
    getDispenseQueue: async () => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.PHARMACY.DISPENSE_QUEUE);
      return res.data;
    },
    adjustStock: async (dto: { medicineId: string; quantityDelta: number; reason: string }) => {
      const res = await this.instance.post<ApiResponse<any>>('/pharmacy/inventory/adjust', dto);
      return res.data;
    },
  };

  // --- MEMBER 7: Radiology Module ---
  public radiology = {
    getCatalogue: async () => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.RADIOLOGY.CATALOGUE);
      return res.data;
    },
    getWorklist: async () => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.RADIOLOGY.WORKLIST);
      return res.data;
    },
    uploadReport: async (orderId: string, data: any) => {
      const res = await this.instance.post<ApiResponse<any>>(API_ENDPOINTS.RADIOLOGY.UPLOAD_REPORT(orderId), data);
      return res.data;
    },
    releaseReport: async (orderId: string) => {
      const res = await this.instance.post<ApiResponse<any>>(API_ENDPOINTS.RADIOLOGY.RELEASE(orderId));
      return res.data;
    },
  };

  // --- MEMBER 8: Billing, Insurance & Wards ---
  public billing = {
    getInvoices: async (patientId?: string) => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.BILLING.INVOICES, {
        params: { patientId },
      });
      return res.data;
    },
    createInvoice: async (dto: CreateInvoiceDto) => {
      const res = await this.instance.post<ApiResponse<any>>(API_ENDPOINTS.BILLING.INVOICES, dto);
      return res.data;
    },
    collectPayment: async (invoiceId: string, payment: any) => {
      const res = await this.instance.post<ApiResponse<any>>(
        API_ENDPOINTS.BILLING.COLLECT_PAYMENT(invoiceId),
        payment
      );
      return res.data;
    },
    getInsuranceClaims: async () => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.BILLING.INSURANCE_CLAIMS);
      return res.data;
    },
  };

  public wards = {
    getWards: async () => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.WARDS.BASE);
      return res.data;
    },
    getBeds: async (wardId: string) => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.WARDS.BEDS(wardId));
      return res.data;
    },
    admitPatient: async (dto: any) => {
      const res = await this.instance.post<ApiResponse<any>>(API_ENDPOINTS.WARDS.ADMIT_PATIENT, dto);
      return res.data;
    },
    dischargePatient: async (admissionId: string, summary: any) => {
      const res = await this.instance.post<ApiResponse<any>>(
        API_ENDPOINTS.WARDS.DISCHARGE_PATIENT(admissionId),
        summary
      );
      return res.data;
    },
  };

  // --- MEMBER 9: Patient Portal & Ambulance Module ---
  public patientPortal = {
    getMyProfile: async () => {
      const res = await this.instance.get<ApiResponse<any>>('/patients/me');
      return res.data;
    },
    getMyAppointments: async () => {
      const res = await this.instance.get<ApiResponse<any>>('/appointments/my');
      return res.data;
    },
    getMyMedicalRecords: async () => {
      const res = await this.instance.get<ApiResponse<any>>('/patients/my/records');
      return res.data;
    },
  };

  public ambulance = {
    getVehicles: async () => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.AMBULANCE.VEHICLES);
      return res.data;
    },
    createEmergencyRequest: async (dto: CreateAmbulanceRequestDto) => {
      const res = await this.instance.post<ApiResponse<any>>(API_ENDPOINTS.AMBULANCE.REQUESTS, dto);
      return res.data;
    },
    getActiveTrips: async () => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.AMBULANCE.ACTIVE_TRIPS);
      return res.data;
    },
    updateTripStatus: async (tripId: string, status: any) => {
      const res = await this.instance.patch<ApiResponse<any>>(API_ENDPOINTS.AMBULANCE.UPDATE_STATUS(tripId), status);
      return res.data;
    },
  };

  public superAdmin = {
    request: async <T>(path: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET', data?: object, params?: object) => {
      const response = await this.instance.request<ApiResponse<T>>({ url: '/super-admin/' + path, method, data, params });
      return response.data;
    },
    audit: async (params: object) => {
      const response = await this.instance.get<ApiResponse<Record<string, unknown>[]>>('/audit/logs', { params });
      return response.data;
    },
  };

  // --- Hospital Admin Workspace Module ---
  public hospitalAdmin = {
    getDashboard: async (params?: { branchId?: string; startDate?: string; endDate?: string }) => {
      const res = await this.instance.get<ApiResponse<any>>('/reports/hospital-admin-dashboard', { params });
      return res.data;
    },
    getDepartments: async (branchId?: string) => {
      const res = await this.instance.get<ApiResponse<any>>('/departments', { params: { branchId } });
      return res.data;
    },
    createDepartment: async (data: any) => {
      const res = await this.instance.post<ApiResponse<any>>('/departments', data);
      return res.data;
    },
    updateDepartment: async (id: string, data: any) => {
      const res = await this.instance.patch<ApiResponse<any>>(`/departments/${id}`, data);
      return res.data;
    },
    toggleDepartmentStatus: async (id: string) => {
      const res = await this.instance.patch<ApiResponse<any>>(`/departments/${id}/status`);
      return res.data;
    },
    assignHod: async (id: string, doctorId: string | null) => {
      const res = await this.instance.post<ApiResponse<any>>(`/departments/${id}/hod`, { doctorId });
      return res.data;
    },
    assignDepartmentAdmin: async (id: string, userId: string) => {
      const res = await this.instance.post<ApiResponse<any>>(`/departments/${id}/admin`, { userId });
      return res.data;
    },
    getDepartmentStats: async (id: string) => {
      const res = await this.instance.get<ApiResponse<any>>(`/departments/${id}/stats`);
      return res.data;
    },
    getDoctors: async (params?: { departmentId?: string; designation?: string; branchId?: string }) => {
      const res = await this.instance.get<ApiResponse<any>>('/doctors', { params });
      return res.data;
    },
    createDoctor: async (data: any) => {
      const res = await this.instance.post<ApiResponse<any>>('/doctors', data);
      return res.data;
    },
    updateDoctor: async (id: string, data: any) => {
      const res = await this.instance.patch<ApiResponse<any>>(`/doctors/${id}`, data);
      return res.data;
    },
    updateDoctorSchedule: async (id: string, data: any) => {
      const res = await this.instance.patch<ApiResponse<any>>(`/doctors/${id}/schedule`, data);
      return res.data;
    },
    getStaff: async (params?: { role?: string; search?: string; branchId?: string }) => {
      const res = await this.instance.get<ApiResponse<any>>('/users', { params });
      return res.data;
    },
    createStaff: async (data: any) => {
      const res = await this.instance.post<ApiResponse<any>>('/users', data);
      return res.data;
    },
    updateStaff: async (id: string, data: any) => {
      const res = await this.instance.patch<ApiResponse<any>>(`/users/${id}`, data);
      return res.data;
    },
    toggleStaffStatus: async (id: string) => {
      const res = await this.instance.patch<ApiResponse<any>>(`/users/${id}/status`);
      return res.data;
    },
    resetStaffPassword: async (id: string, password?: string) => {
      const res = await this.instance.post<ApiResponse<any>>(`/users/${id}/reset-password`, { password });
      return res.data;
    },
    getWards: async (branchId?: string) => {
      const res = await this.instance.get<ApiResponse<any>>('/wards', { params: { branchId } });
      return res.data;
    },
    createWard: async (data: any) => {
      const res = await this.instance.post<ApiResponse<any>>('/wards', data);
      return res.data;
    },
    updateWard: async (id: string, data: any) => {
      const res = await this.instance.patch<ApiResponse<any>>(`/wards/${id}`, data);
      return res.data;
    },
    createBed: async (wardId: string, data: any) => {
      const res = await this.instance.post<ApiResponse<any>>(`/wards/${wardId}/beds`, data);
      return res.data;
    },
    updateBedStatus: async (bedId: string, status: string) => {
      const res = await this.instance.patch<ApiResponse<any>>(`/wards/beds/${bedId}/status`, { status });
      return res.data;
    },
    getAdmissions: async (params?: { patientId?: string; status?: string; branchId?: string }) => {
      const res = await this.instance.get<ApiResponse<any>>('/wards/admissions', { params });
      return res.data;
    },
    getBedCensus: async (branchId?: string) => {
      const res = await this.instance.get<ApiResponse<any>>('/wards/census', { params: { branchId } });
      return res.data;
    },
    getApprovals: async (branchId?: string) => {
      const res = await this.instance.get<ApiResponse<any>>('/approvals/pending', { params: { branchId } });
      return res.data;
    },
    processApproval: async (type: 'appointment-request' | 'doctor-leave' | 'bed-turnover', id: string, action: 'APPROVE' | 'REJECT', notes?: string) => {
      const res = await this.instance.post<ApiResponse<any>>(`/approvals/${type}/${id}/action`, { action, notes });
      return res.data;
    },
    getApprovalHistory: async (branchId?: string) => {
      const res = await this.instance.get<ApiResponse<any>>('/approvals/history', { params: { branchId } });
      return res.data;
    },
    getReports: async (params: { type: string; branchId?: string; departmentId?: string; fromDate?: string; toDate?: string }) => {
      const res = await this.instance.get<ApiResponse<any>>('/reports/export', { params });
      return res.data;
    },
    getAuditLogs: async (params?: any) => {
      const res = await this.instance.get<ApiResponse<any>>('/audit/logs', { params });
      return res.data;
    },
    archiveDepartment: async (id: string) => {
      const res = await this.instance.delete<ApiResponse<any>>(`/departments/${id}`);
      return res.data;
    },
    toggleDoctorStatus: async (id: string, status?: string) => {
      const res = await this.instance.patch<ApiResponse<any>>(`/doctors/${id}/status`, { status });
      return res.data;
    },
    bulkUpdateStaffStatus: async (userIds: string[], isActive: boolean) => {
      const res = await this.instance.post<ApiResponse<any>>('/users/bulk-status', { userIds, isActive });
      return res.data;
    },
    updateBed: async (bedId: string, data: any) => {
      const res = await this.instance.patch<ApiResponse<any>>(`/wards/beds/${bedId}`, data);
      return res.data;
    },
    deleteBed: async (bedId: string) => {
      const res = await this.instance.delete<ApiResponse<any>>(`/wards/beds/${bedId}`);
      return res.data;
    },
    bulkUpdateBedStatus: async (bedIds: string[], status: string) => {
      const res = await this.instance.post<ApiResponse<any>>('/wards/beds/bulk-status', { bedIds, status });
      return res.data;
    },
    updateHospitalSettings: async (id: string, data: any) => {
      const res = await this.instance.patch<ApiResponse<any>>(`/hospitals/${id}`, data);
      return res.data;
    },
    broadcastAnnouncement: async (data: { title: string; message: string; targetRole?: string; branchId?: string }) => {
      const res = await this.instance.post<ApiResponse<any>>('/notifications/broadcast', data);
      return res.data;
    },
    createVehicle: async (data: any) => {
      const res = await this.instance.post<ApiResponse<any>>('/ambulance/vehicles', data);
      return res.data;
    },
    updateVehicle: async (id: string, data: any) => {
      const res = await this.instance.patch<ApiResponse<any>>(`/ambulance/vehicles/${id}`, data);
      return res.data;
    },
    updateVehicleStatus: async (id: string, isAvailable: boolean) => {
      const res = await this.instance.patch<ApiResponse<any>>(`/ambulance/vehicles/${id}/status`, { isAvailable });
      return res.data;
    },
    createMedicine: async (data: any) => {
      const res = await this.instance.post<ApiResponse<any>>('/pharmacy/medicines', data);
      return res.data;
    },
    updateMedicine: async (id: string, data: any) => {
      const res = await this.instance.patch<ApiResponse<any>>(`/pharmacy/medicines/${id}`, data);
      return res.data;
    },
    toggleMedicineStatus: async (id: string) => {
      const res = await this.instance.patch<ApiResponse<any>>(`/pharmacy/medicines/${id}/status`);
      return res.data;
    },
    addMedicineBatch: async (medicineId: string, data: any) => {
      const res = await this.instance.post<ApiResponse<any>>(`/pharmacy/medicines/${medicineId}/batches`, data);
      return res.data;
    },
    getInventoryMovements: async (branchId?: string) => {
      const res = await this.instance.get<ApiResponse<any>>('/pharmacy/inventory/movements', { params: { branchId } });
      return res.data;
    },
  };

  public notifications = {
    markAllAsRead: async () => {
      const response = await this.instance.patch<ApiResponse>('/notifications/mark-all-read');
      return response.data;
    },
    getNotifications: async () => {
      const res = await this.instance.get<ApiResponse<any>>(API_ENDPOINTS.NOTIFICATIONS.BASE);
      return res.data;
    },
    markAsRead: async (id: string) => {
      const res = await this.instance.patch<ApiResponse<any>>(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
      return res.data;
    },
  };
}

export function createAalayamApiClient(config: ApiClientConfig): AalayamApiClient {
  return new AalayamApiClient(config);
}

export const createKizunaApiClient = createAalayamApiClient;
export const KizunaApiClient = AalayamApiClient;
export const createUyirinaiApiClient = createAalayamApiClient;
export const UyirinaiApiClient = AalayamApiClient;
