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
