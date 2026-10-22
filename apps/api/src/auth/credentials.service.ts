import { ConflictException, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { PasswordHasher } from '@nestjs/authentication';
import { generateUsername } from 'src/common/username';

@Injectable()
export class CredentialsService {
  constructor(
    private readonly userService: UserService,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async register(email: string, name: string, password: string) {
    if (await this.userService.findByEmail(email)) {
      throw new ConflictException('Email already registered');
    }

    const username = generateUsername(name);

    return await this.userService.create({
      email,
      name,
      username,
      password: await this.passwordHasher.hash(password),
    });
  }

  async verify(email: string, password: string) {
    const found = await this.userService.findByEmail(email);

    const valid = await this.passwordHasher.verify(password, found?.password);
    if (!valid || !found?.password) {
      return null;
    }

    if (this.passwordHasher.needsRehash(found.password)) {
      await this.userService.updatePassword(
        found.id,
        await this.passwordHasher.hash(password),
      );
    }

    return found;
  }
}
