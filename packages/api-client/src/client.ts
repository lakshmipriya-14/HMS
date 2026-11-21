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
  RecordVitalsDto,
  RegisterPatientDto,
  SwitchRoleRequestDto,
} from '@multispeciality-hms/contracts';

export interface ApiClientConfig {
  baseURL: string;
  getAccessToken?: () => string | null;
  getRefreshToken?: () => string | null;
  setTokens?: (accessToken: string, refreshToken: string) => void;
  clearTokens?: () => void;
  onUnauthorized?: () => void;
}

export class KizunaApiClient {
  private instance: AxiosInstance;
  private config: ApiClientConfig;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.instance = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
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

        if (error.response?.status === 401 && !originalRequest._retry && this.config.getRefreshToken) {
          const refreshToken = this.config.getRefreshToken();
          if (!refreshToken) {
            this.config.clearTokens?.();
            this.config.onUnauthorized?.();
            return Promise.reject(this.normalizeError(error));
          }

          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(this.instance(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshRes = await axios.post<ApiResponse<LoginResponseDto>>(
              `${this.config.baseURL}${API_ENDPOINTS.AUTH.REFRESH}`,
              { refreshToken }
            );

            if (refreshRes.data.success && refreshRes.data.data) {
              const { accessToken, refreshToken: newRefreshToken } = refreshRes.data.data;
              this.config.setTokens?.(accessToken, newRefreshToken);

              this.refreshSubscribers.forEach((callback) => callback(accessToken));
              this.refreshSubscribers = [];

              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              }
              return this.instance(originalRequest);
            }
          } catch (refreshErr) {
            this.config.clearTokens?.();
            this.config.onUnauthorized?.();
            return Promise.reject(this.normalizeError(refreshErr as AxiosError<ApiResponse>));
          } finally {
            this.isRefreshing = false;
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
  public auth = {
    login: async (dto: LoginRequestDto) => {
      const res = await this.instance.post<ApiResponse<LoginResponseDto>>(API_ENDPOINTS.AUTH.LOGIN, dto);
      return res.data;
    },
    logout: async () => {
      const res = await this.instance.post<ApiResponse<void>>(API_ENDPOINTS.AUTH.LOGOUT);
      return res.data;
    },
    getMe: async () => {
      const res = await this.instance.get<ApiResponse<AuthUserDto>>(API_ENDPOINTS.AUTH.ME);
      return res.data;
    },
    changePassword: async (dto: ChangePasswordRequestDto) => {
      const res = await this.instance.post<ApiResponse<void>>(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, dto);
      return res.data;
    },
    switchRole: async (dto: SwitchRoleRequestDto) => {
      const res = await this.instance.post<ApiResponse<LoginResponseDto>>(API_ENDPOINTS.AUTH.SWITCH_ROLE, dto);
      return res.data;
    },
  };

  public admin = {
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

  public notifications = {
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

export function createKizunaApiClient(config: ApiClientConfig): KizunaApiClient {
  return new KizunaApiClient(config);
}

export const AalayamApiClient = KizunaApiClient;
export const createAalayamApiClient = createKizunaApiClient;

