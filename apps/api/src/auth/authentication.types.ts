import type { PublicUser } from '@app/contracts';

declare module '@nestjs/authentication' {
  interface AuthenticationTypes {
    user: PublicUser;
    sessionExtra: { user: PublicUser };
  }
}
