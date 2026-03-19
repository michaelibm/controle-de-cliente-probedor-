import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Acesso negado');

    const roleHierarchy: Record<UserRole, number> = {
      ADMIN: 6,
      MANAGER: 5,
      FINANCIAL: 4,
      ATTENDANT: 3,
      SUPPORT: 2,
      READONLY: 1,
      INSTALLER: 2,
    };

    const userLevel = roleHierarchy[user.role as UserRole] || 0;
    const minRequired = Math.min(...requiredRoles.map(r => roleHierarchy[r] || 0));

    if (userLevel < minRequired) throw new ForbiddenException('Permissão insuficiente');
    return true;
  }
}
