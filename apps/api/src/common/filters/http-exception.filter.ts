import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected internal hospital server error occurred';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errors: Record<string, string[]> | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as any;
        message = resp.message || exception.message;
        errorCode = resp.error || HttpStatus[status];
        if (Array.isArray(resp.message)) {
          message = resp.message[0];
          errors = { validation: resp.message };
        }
      }
    } else {
      this.logger.error(`Unhandled Exception at ${request.method} ${request.url}`, (exception as Error)?.stack);
      // Ensure database driver or prisma internal details are never exposed to clients
      message = 'An internal system error occurred. Please contact hospital IT administration.';
    }

    response.status(status).json({
      success: false,
      message,
      errorCode,
      errors,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (request.headers['x-request-id'] as string) || undefined,
      },
    });
  }
}
