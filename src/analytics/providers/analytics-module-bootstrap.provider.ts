import { FactoryProvider } from '@nestjs/common';
import { MetadataScanner, ModuleRef, NestContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';

import { ANALYTICS_METADATA, IAnalyticsMetadata } from '../analytics.module';
import { AnalyticsService } from '../analytics.service';

export const analyticsModuleBootstrapProvider: FactoryProvider = {
  provide: 'AnalyticsModuleBootstrap',
  useFactory: async (analyticsService, moduleRef) => {
    const coreModule = new AnalyticsCoreModule(moduleRef, analyticsService);
    await coreModule.bootstrap();
  },
  inject: [AnalyticsService, ModuleRef],
};

class AnalyticsCoreModule {
  private readonly metadataScanner = new MetadataScanner();

  constructor(
    private readonly analyticsModuleRef: ModuleRef & {
      container: NestContainer;
    },
    private readonly analyticsService: AnalyticsService,
  ) {}

  public async bootstrap() {
    const { container } = this.analyticsModuleRef;
    const modules = container.getModules();

    for (const [token, moduleRef] of modules) {
      const { controllers } = moduleRef;
      for (const [name, wrapper] of controllers) {
        const metadata = this.reflectControllerMethodMetadata(wrapper);
        await this.applyServiceReference(moduleRef, wrapper, metadata);
      }
    }
  }

  private reflectControllerMethodMetadata(
    wrapperRef: InstanceWrapper,
  ): IAnalyticsMetadata[] {
    const { metatype } = wrapperRef;

    const metadata = this.metadataScanner.scanFromPrototype(
      null,
      metatype.prototype,
      (methodName: string) => {
        let prototype = metatype.prototype;
        do {
          const descriptor = Reflect.getOwnPropertyDescriptor(
            prototype,
            methodName,
          );

          if (!descriptor) {
            continue;
          }

          return Reflect.getMetadata(ANALYTICS_METADATA, descriptor.value);
        } while (
          (prototype = Reflect.getPrototypeOf(prototype)) &&
          prototype !== Object.prototype &&
          prototype
        );
      },
    );

    return metadata;
  }

  private async applyServiceReference(
    moduleRef: Module,
    wrapper: InstanceWrapper,
    methodMetadata: IAnalyticsMetadata[],
  ) {
    const { metatype } = wrapper;
    const controller = moduleRef.controllers.get(metatype.name);
    const { instance } = controller;

    for (const metadata of methodMetadata) {
      const { descriptor, propertyKey } = metadata;
      const methodRef = descriptor.value;

      const updatedMethodRef = async <T extends [] = any>(...args: T) => {
        const { name } = methodRef;
        const timerLabel = this.analyticsService.startExecution(name);
        const result = await methodRef.apply(controller.instance, args);
        this.analyticsService.endExecution(name, timerLabel);
        return result;
      };

      const controllerPrototype = Object.getPrototypeOf(instance);

      Object.defineProperty(controllerPrototype, propertyKey, {
        value: updatedMethodRef,
      });

      this.copyMetadataToTarget(methodRef, updatedMethodRef);
    }
  }

  private copyMetadataToTarget(
    sourceTarget: Function,
    updatedTarget: Function,
  ) {
    const metadatakeys = Reflect.getMetadataKeys(sourceTarget);

    for (const key of metadatakeys) {
      const metadata = Reflect.getMetadata(key, sourceTarget);
      Reflect.defineMetadata(key, metadata, updatedTarget);
    }
  }
}
