import { Injectable } from '@nestjs/common';
import { helloSchema, type Hello } from '@app/contracts';

@Injectable()
export class AppService {
  getHello(): Hello {
    return helloSchema.parse({ message: 'Hello from API' });
  }
}
