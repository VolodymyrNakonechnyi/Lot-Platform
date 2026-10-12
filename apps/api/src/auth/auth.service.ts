import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { hashPassword, verifyPassword } from 'src/common/password';
import { UserService } from 'src/user/user.service';
import { CreateUserDto, LoginUserDto } from './dto/user.dto';
import { generateUsername } from 'src/common/username';
import type { PublicUser } from '@app/contracts';

@Injectable()
export class AuthService {
  constructor(private users: UserService) {}

  async register(user: CreateUserDto): Promise<PublicUser> {
    const existingUser = await this.users.findByEmail(user.email);

    if (existingUser && !existingUser.confirmedEmail) {
      throw new ConflictException("dublicate user's email");
    }

    const password = await hashPassword(user.password);
    const username = generateUsername(user.name);

    const { password: _hash, ...created } = await this.users.create({
      ...user,
      password,
      username,
    });

    return created;
  }

  async login(user: LoginUserDto): Promise<PublicUser> {
    const { email, password } = user;

    const existingUser = await this.users.findByEmail(email);

    if (!existingUser) {
      throw new NotFoundException("user've never existed");
    }

    const verifiedPassword = await verifyPassword(
      existingUser.password,
      password,
    );

    if (!verifiedPassword) {
      throw new UnauthorizedException('not correct password or email');
    }

    const { password: _hash, ...publicUser } = existingUser;

    return publicUser;
  }
}
