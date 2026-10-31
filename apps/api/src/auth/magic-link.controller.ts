import {
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { MagicLinkService, Public } from '@nestjs/authentication';
import { emailSchema, type EmailDto } from '@app/contracts';

@Public()
@Controller('auth/magic-link')
export class MagicLinkController {
  constructor(private readonly magicLinkService: MagicLinkService) {}

  @Post()
  @HttpCode(202)
  async request(
    @Body({ schema: emailSchema }) body: EmailDto,
    @Body('redirectTo') redirectTo?: string,
  ) {
    await this.magicLinkService.create(body.email, { redirectTo });
  }

  // Called by the page the link opens, which POSTs the token from its URL.
  @Post('consume')
  @HttpCode(200)
  async consume(@Body('token') token: string) {
    // A link opened in another browser throws MagicLinkError, which the module
    // answers: a 401 telling the customer to open it where they asked for it.
    const result = await this.magicLinkService.consume(token);
    if (!result) {
      throw new UnauthorizedException('Invalid or expired link');
    }
    return {
      redirectTo: result.redirectTo ?? '/',
      mfaRequired: result.session.mfa === 'pending',
    };
  }
}
