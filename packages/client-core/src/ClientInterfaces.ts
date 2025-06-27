import { DownloadConfigSpecsResponse } from './DownloadConfigSpecsResponse';
import { ErrorBoundary } from './ErrorBoundary';
import {
  DynamicConfigEvaluationOptions,
  ExperimentEvaluationOptions,
  FeatureGateEvaluationOptions,
  LayerEvaluationOptions,
  ParameterStoreEvaluationOptions,
} from './EvaluationOptions';
import { InitializeResponseWithUpdates } from './InitializeResponse';
import { StatsigSession } from './SessionID';
import { StatsigClientEventEmitterInterface } from './StatsigClientEventEmitter';
import { EvaluationsDataAdapter, SpecsDataAdapter } from './StatsigDataAdapter';
import { StatsigEvent } from './StatsigEvent';
import {
  AnyStatsigOptions,
  StatsigRuntimeMutableOptions,
} from './StatsigOptionsCommon';
import {
  DynamicConfig,
  Experiment,
  FeatureGate,
  Layer,
  ParameterStore,
} from './StatsigTypes';
import { StatsigUpdateDetails } from './StatsigUpdateDetails';
import { StatsigUser } from './StatsigUser';
import { Flatten } from './TypingUtils';

export interface StatsigClientCommonInterface
  extends StatsigClientEventEmitterInterface {
  initializeSync(): StatsigUpdateDetails;
  initializeAsync(): Promise<StatsigUpdateDetails>;
  shutdown(): Promise<void>;
  flush(): Promise<void>;
  updateRuntimeOptions(options: StatsigRuntimeMutableOptions): void;
}

export type CommonContext = {
  sdkKey: string;
  options: AnyStatsigOptions;
  errorBoundary: ErrorBoundary;
  session: StatsigSession;
  stableID: string | null;
  sdkInstanceID: string;
};

export type OnDeviceEvaluationsContext = CommonContext & {
  values: DownloadConfigSpecsResponse | null;
};

export interface OnDeviceEvaluationsInterface
  extends StatsigClientCommonInterface {
  readonly dataAdapter: SpecsDataAdapter;

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

export interface PrecomputedEvaluationsInterface
  extends StatsigClientCommonInterface {
  readonly dataAdapter: EvaluationsDataAdapter;

  getContext(): PrecomputedEvaluationsContext;
  updateUserSync(user: StatsigUser): StatsigUpdateDetails;
  updateUserAsync(user: StatsigUser): Promise<StatsigUpdateDetails>;
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
  getParameterStore(
    name: string,
    options?: ParameterStoreEvaluationOptions,
  ): ParameterStore;
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
