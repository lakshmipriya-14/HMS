import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@multispeciality-hms/contracts';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((res) => {
        // If already formatted as ApiResponse, return directly
        if (res && typeof res === 'object' && 'success' in res) {
          return res;
        }

        let message = 'Operation completed successfully';
        let data = res;
        let meta = {
          timestamp: new Date().toISOString(),
        };

        if (res && typeof res === 'object' && 'data' in res && 'message' in res) {
          message = res.message;
          data = res.data;
          if (res.meta) {
            meta = { ...meta, ...res.meta };
          }
        }

        return {
          success: true,
          message,
          data,
          meta,
        };
      })
    );
  }
}
