import { Controller, Get } from '@nestjs/common';

import { PerformanceTrace } from './analytics/analytics.module';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @PerformanceTrace()
  getHello(): string {
    return this.appService.getHello();
  }
}
