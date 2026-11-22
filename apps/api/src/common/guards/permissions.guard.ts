import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, PERMISSIONS_KEY, SCOPED_KEY } from '../decorators/roles.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const handlers = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, handlers)) return true;
    if (!this.reflector.getAllAndOverride<boolean>(SCOPED_KEY, handlers)) {
      throw new ForbiddenException('This endpoint is not enabled for scoped access.');
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user?.hospitalId) throw new ForbiddenException('Authenticated hospital scope is required.');
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const userPermissions: string[] = user.permissions || [];
    const hasAll = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasAll) {
      throw new ForbiddenException(`Access denied: Missing required permission [${requiredPermissions.join(', ')}]`);
    }

    return true;
  }
}
