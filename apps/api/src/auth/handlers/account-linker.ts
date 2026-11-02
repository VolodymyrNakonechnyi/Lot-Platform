import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  AuthenticationRegistry,
  OidcAccountResolver,
  type OAuthTokens,
  type OidcProfile,
  type OidcResolveContext,
} from '@nestjs/authentication';
import { UserService } from 'src/user/user.service';
import { generateUsername } from 'src/common/username';
import { User } from 'src/db/schema';

@Injectable()
export class AccountLinker extends OidcAccountResolver {
  constructor(
    private readonly usersService: UserService,
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerHandler('oidc', this);
  }

  async resolveUser(
    profile: OidcProfile,
    _tokens: OAuthTokens,
    { linkTo }: OidcResolveContext,
  ): Promise<User | null> {
    const linked = await this.usersService.findByIdentity(
      profile.provider,
      profile.subject,
    );

    // "Connect Google" from the account page: link to the signed-in customer.
    if (linkTo) {
      if (linked && linked.id !== linkTo.id) {
        throw new ConflictException(
          'This Google account belongs to another customer',
        );
      }
      return this.usersService.linkIdentity(
        linkTo.id,
        profile.provider,
        profile.subject,
      );
    }

    // A returning Google account: sign in the user it is linked to.
    if (linked) {
      return linked;
    }

    // First visit. Trust only an address Google verified, or anyone could
    // claim any account.
    if (!profile.email || !profile.emailVerified) {
      return null; // 403
    }
    const existing = await this.usersService.findByEmail(profile.email);
    if (!existing) {
      const user = await this.usersService.create({
        email: profile.email,
        avatarUrl: profile.picture,
        name: profile.name ? profile.name : null,
        username: profile.name ? generateUsername(profile.name) : null,
        confirmedEmail: true,
      });
      return this.usersService.linkIdentity(
        user.id,
        profile.provider,
        profile.subject,
      );
    }
    // Link by email only if the account's owner proved the address to us too.
    // Otherwise whoever signed up with it, with a password of their choosing,
    // would share the account with the customer.
    if (!existing.confirmedEmail) {
      throw new ForbiddenException(
        'Sign in with your password, then connect Google from your account',
      );
    }
    return this.usersService.linkIdentity(
      existing.id,
      profile.provider,
      profile.subject,
    );
  }
}
