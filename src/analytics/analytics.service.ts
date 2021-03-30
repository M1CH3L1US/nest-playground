import { Injectable } from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';

@Injectable()
export class AnalyticsService {
  public startExecution(methodName: string) {
    const label = randomStringGenerator();
    console.log(`Calling ${methodName}`);
    console.time(label);
    return label;
  }

  public endExecution(methodName: string, label: string) {
    console.log(`${methodName} completed`);
    console.timeEnd(label);
  }
}
