export interface ApiResponseMeta {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    timestamp?: string;
    requestId?: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    meta?: ApiResponseMeta;
    errorCode?: string;
    errors?: Record<string, string[]>;
}
export interface PaginatedResult<T> {
    items: T[];
    meta: ApiResponseMeta;
}
//# sourceMappingURL=api-response.d.ts.map