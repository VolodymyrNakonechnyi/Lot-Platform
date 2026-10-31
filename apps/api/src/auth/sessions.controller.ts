import {
  CurrentSession,
  CurrentUser,
  Public,
  type SessionRecord,
  SessionService,
  SignInService,
} from '@nestjs/authentication';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';

@Controller('auth')
export class SessionsController {
  constructor(
    private readonly signInService: SignInService,
    private readonly sessionService: SessionService,
  ) {}

  @Get('sessions')
  async list(
    @CurrentUser('id') userId: string,
    @CurrentSession() current: SessionRecord,
  ) {
    const sessions = await this.sessionService.list(userId);

    return sessions.map(({ id, createdAt, lastActiveAt, metadata }) => ({
      id,
      createdAt,
      lastActiveAt,
      userAgent: metadata?.userAgent ?? null,
      current: id === current.id,
    }));
  }

  @Delete('sessions/:id')
  @HttpCode(204)
  async revoke(@CurrentUser() userId: string, @Param('id') id: string) {
    if (!(await this.sessionService.revoke(id, { userId }))) {
      throw new NotFoundException();
    }
  }

  @Public()
  @Post('sign-out')
  @HttpCode(204)
  async signOut() {
    if (!(await this.signInService.signOut())) {
      throw new UnauthorizedException();
    }
  }

  @Post('sign-out-everywhere')
  @HttpCode(204)
  async signOutEverywhere(@CurrentUser('id') userId: string) {
    await this.signInService.signOutEverywhere(userId);
  }
}
