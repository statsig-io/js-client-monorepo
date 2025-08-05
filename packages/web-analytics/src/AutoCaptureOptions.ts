import { LogLevel } from '@statsig/client-core';

import { AutoCaptureEvent } from './AutoCaptureEvent';

export type AutoCaptureOptions = {
  eventFilterFunc?: (event: AutoCaptureEvent) => boolean;
  consoleLogAutoCaptureSettings?: ConsoleLogAutoCaptureSettings;
};

export type ConsoleLogAutoCaptureSettings = {
  enabled: boolean;
  logLevel?: LogLevel;
  serviceName?: string;
  serviceVersion?: string;
  sampleRate?: number;
  resourceMetadata?: Record<string, string | number | boolean>;
};
