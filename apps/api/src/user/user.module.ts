import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { UserService } from './user.service';

@Module({
  controllers: [MeController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
