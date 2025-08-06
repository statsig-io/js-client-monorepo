import { AutoCaptureEvent } from './AutoCaptureEvent';
import { ConsoleLogLevel } from './ConsoleLogManager';

export type AutoCaptureOptions = {
  eventFilterFunc?: (event: AutoCaptureEvent) => boolean;
  consoleLogAutoCaptureSettings?: ConsoleLogAutoCaptureSettings;
};

export type ConsoleLogAutoCaptureSettings = {
  enabled: boolean;
  logLevel?: ConsoleLogLevel;
  service?: string;
  version?: string;
  sampleRate?: number;
  resourceMetadata?: Record<string, string | number | boolean>;
};
