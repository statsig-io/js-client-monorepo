import { DownloadConfigSpecsResponse } from './DownloadConfigSpecsResponse';
import { ErrorBoundary } from './ErrorBoundary';
import {
  DynamicConfigEvaluationOptions,
  ExperimentEvaluationOptions,
  FeatureGateEvaluationOptions,
  LayerEvaluationOptions,
} from './EvaluationOptions';
import { InitializeResponseWithUpdates } from './InitializeResponse';
import { StatsigClientEventEmitterInterface } from './StatsigClientEventEmitter';
import { EvaluationsDataAdapter, SpecsDataAdapter } from './StatsigDataAdapter';
import { StatsigEvent } from './StatsigEvent';
import {
  AnyStatsigOptions,
  StatsigRuntimeMutableOptions,
} from './StatsigOptionsCommon';
import { DynamicConfig, Experiment, FeatureGate, Layer } from './StatsigTypes';
import { StatsigUser } from './StatsigUser';
import { Flatten } from './UtitlityTypes';

export interface StatsigClientCommonInterface
  extends StatsigClientEventEmitterInterface {
  initializeSync(): void;
  initializeAsync(): Promise<void>;
  shutdown(): Promise<void>;
  flush(): Promise<void>;
  updateRuntimeOptions(options: StatsigRuntimeMutableOptions): void;
}

export type CommonContext = {
  sdkKey: string;
  options: AnyStatsigOptions;
  errorBoundary: ErrorBoundary;
};

export type AsyncCommonContext = {
  sessionID: string;
  stableID: string;
};

export type OnDeviceEvaluationsContext = CommonContext & {
  values: DownloadConfigSpecsResponse | null;
};

export type OnDeviceEvaluationsAsyncContext = OnDeviceEvaluationsContext &
  AsyncCommonContext;

export interface OnDeviceEvaluationsInterface
  extends StatsigClientCommonInterface {
  readonly dataAdapter: SpecsDataAdapter;
  getAsyncContext(): Promise<OnDeviceEvaluationsAsyncContext>;
  getContext(): OnDeviceEvaluationsContext;
  checkGate(
    name: string,
    user: StatsigUser,
    options?: FeatureGateEvaluationOptions,
  ): boolean;
  getFeatureGate(
    name: string,
    user: StatsigUser,
    options?: FeatureGateEvaluationOptions,
  ): FeatureGate;
  getDynamicConfig(
    name: string,
    user: StatsigUser,
    options?: DynamicConfigEvaluationOptions,
  ): DynamicConfig;
  getExperiment(
    name: string,
    user: StatsigUser,
    options?: ExperimentEvaluationOptions,
  ): Experiment;
  getLayer(
    name: string,
    user: StatsigUser,
    options?: LayerEvaluationOptions,
  ): Layer;
  logEvent(event: StatsigEvent, user: StatsigUser): void;
  logEvent(
    eventName: string,
    user: StatsigUser,
    value?: string | number,
    metadata?: Record<string, string>,
  ): void;
}

export type PrecomputedEvaluationsContext = Flatten<
  CommonContext & {
    values: InitializeResponseWithUpdates | null;
    user: StatsigUser;
  }
>;

export type PrecomputedEvaluationsAsyncContext = Flatten<
  AsyncCommonContext & PrecomputedEvaluationsContext
>;

export interface PrecomputedEvaluationsInterface
  extends StatsigClientCommonInterface {
  readonly dataAdapter: EvaluationsDataAdapter;

  getAsyncContext(): Promise<PrecomputedEvaluationsAsyncContext>;
  getContext(): PrecomputedEvaluationsContext;
  updateUserSync(user: StatsigUser): void;
  updateUserAsync(user: StatsigUser): Promise<void>;
  checkGate(name: string, options?: FeatureGateEvaluationOptions): boolean;
  getFeatureGate(
    name: string,
    options?: FeatureGateEvaluationOptions,
  ): FeatureGate;
  getDynamicConfig(
    name: string,
    options?: DynamicConfigEvaluationOptions,
  ): DynamicConfig;
  getExperiment(
    name: string,
    options?: ExperimentEvaluationOptions,
  ): Experiment;
  getLayer(name: string, options?: LayerEvaluationOptions): Layer;
  logEvent(event: StatsigEvent): void;
  logEvent(
    eventName: string,
    value?: string | number,
    metadata?: Record<string, string>,
  ): void;
}

export type StatsigClientInterface =
  | OnDeviceEvaluationsInterface
  | PrecomputedEvaluationsInterface;
