import { Module } from '@nestjs/common';

import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [AnalyticsModule.forRootAsync()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
