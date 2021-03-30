import { DynamicModule, Module, Type } from '@nestjs/common';

import { AnalyticsService } from './analytics.service';
import { analyticsModuleBootstrapProvider } from './providers/analytics-module-bootstrap.provider';

export const ANALYTICS_METADATA = 'analytics:meta';

export interface IAnalyticsMetadata {
  propertyKey: string;
  descriptor: PropertyDescriptor;
}

export const PerformanceTrace = (): MethodDecorator => {
  return (
    target: Type,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    const metadata: IAnalyticsMetadata = {
      propertyKey: propertyKey,
      descriptor: descriptor,
    };

    Reflect.defineMetadata(ANALYTICS_METADATA, metadata, descriptor.value);
    return descriptor;
  };
};

@Module({})
export class AnalyticsModule {
  public static async forRootAsync(): Promise<DynamicModule> {
    return {
      module: AnalyticsModule,
      providers: [AnalyticsService, analyticsModuleBootstrapProvider],
    };
  }
}
