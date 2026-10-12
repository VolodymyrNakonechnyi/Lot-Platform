import { ConflictException, Injectable } from '@nestjs/common';
import { hashPassword } from 'src/common/password';
import { UserService } from 'src/user/user.service';
import { CreateUserDto } from './dto/user.dto';
import { generateUsername } from 'src/common/username';

@Injectable()
export class AuthService {
  constructor(private users: UserService) {}

  async register(user: CreateUserDto):Promise<PublicUser> {
    const existingUser = await this.users.findByEmail(user.email);

    if (existingUser && !existingUser.confirmedEmail) {
      throw new ConflictException("dublicate user's email");
    }

    const password = await hashPassword(user.password);
    const username = generateUsername(user.name);
  }
}
