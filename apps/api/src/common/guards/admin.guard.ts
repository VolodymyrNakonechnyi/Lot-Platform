import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PublicUser, ROLE } from '@app/contracts';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const { user } = context
      .switchToHttp()
      .getRequest<{ user: PublicUser | null }>();

    if (user?.role !== ROLE.ADMIN) {
      throw new ForbiddenException('Admin only allowed');
    }

    return true;
  }
}
