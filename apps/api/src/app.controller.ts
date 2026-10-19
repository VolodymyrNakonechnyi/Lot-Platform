import { Controller, Get } from '@nestjs/common';
import { Public } from '@nestjs/authentication';
import { ApiTags } from '@nestjs/swagger';
import { type Hello } from '@app/contracts';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHello(): Hello {
    return this.appService.getHello();
  }
}
