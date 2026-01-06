import { DownloadConfigSpecsResponse } from './DownloadConfigSpecsResponse';
import { ErrorBoundary } from './ErrorBoundary';
import {
  DynamicConfigEvaluationOptions,
  ExperimentEvaluationOptions,
  FeatureGateEvaluationOptions,
  LayerEvaluationOptions,
  ParameterStoreEvaluationOptions,
} from './EvaluationOptions';
import {
  AnyInitializeResponse,
  ClientInitializeResponseOptions,
} from './InitializeResponse';
import { Log } from './Log';
import { _cloneObject } from './SafeJs';
import {
  StatsigSession,
  StatsigSession as StatsigSessionType,
} from './SessionID';
import { StableID } from './StableID';
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
  getClientInitializeResponse(
    user: StatsigUser,
    options?: ClientInitializeResponseOptions,
  ): AnyInitializeResponse | null;
}

export type PrecomputedEvaluationsContext = Flatten<
  CommonContext & {
    values: AnyInitializeResponse | null;
    user: StatsigUser;
  }
>;

export interface PrecomputedEvaluationsInterface
  extends StatsigClientCommonInterface {
  readonly dataAdapter: EvaluationsDataAdapter;

  getContext(): PrecomputedEvaluationsContext;
  getContextHandle(): PrecomputedEvaluationsContextHandle;
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

/**
 * A handle to the PrecomputedEvaluationsContext that computes fields lazily on access.
 * This avoids unnecessary computation (e.g., cloning the user) when only certain fields are needed.
 * The handle is created once and reused; individual getters fetch current values on each access.
 */
export class PrecomputedEvaluationsContextHandle {
  private _sdkKey: string;
  private _getOptions: () => AnyStatsigOptions;
  private _getErrorBoundary: () => ErrorBoundary;
  private _getValues: () => AnyInitializeResponse | null;
  private _getUser: () => StatsigUser;
  private _getSdkInstanceID: () => string;

  constructor(
    sdkKey: string,
    getOptions: () => AnyStatsigOptions,
    getErrorBoundary: () => ErrorBoundary,
    getValues: () => AnyInitializeResponse | null,
    getUser: () => StatsigUser,
    getSdkInstanceID: () => string,
  ) {
    this._sdkKey = sdkKey;
    this._getOptions = getOptions;
    this._getErrorBoundary = getErrorBoundary;
    this._getValues = getValues;
    this._getUser = getUser;
    this._getSdkInstanceID = getSdkInstanceID;
  }

  get sdkKey(): string {
    return this._sdkKey;
  }

  get options(): AnyStatsigOptions {
    return this._getOptions();
  }

  get errorBoundary(): ErrorBoundary {
    return this._getErrorBoundary();
  }

  get values(): AnyInitializeResponse | null {
    return this._getValues();
  }

  get user(): StatsigUser {
    let user: StatsigUser | null = _cloneObject('StatsigUser', this._getUser());
    if (user == null) {
      Log.error('Failed to clone user');
      user = {};
    }
    return user;
  }

  /**
   * Gets the current session.
   * @param {boolean} [bumpSession=true] - Whether to bump/update the session timing. Set to false to read without affecting session state.
   */
  getSession(bumpSession = true): StatsigSessionType {
    return StatsigSession.get(this._sdkKey, bumpSession);
  }

  get stableID(): string | null {
    return StableID.get(this._sdkKey);
  }

  get sdkInstanceID(): string {
    return this._getSdkInstanceID();
  }

  /**
   * Returns the full PrecomputedEvaluationsContext object.
   * Use this when you need all fields at once.
   * @param {boolean} [bumpSession=true] - Whether to bump the session when building the context.
   */
  toContext(bumpSession = true): PrecomputedEvaluationsContext {
    return {
      sdkKey: this.sdkKey,
      options: this.options,
      values: this.values,
      user: this.user,
      errorBoundary: this.errorBoundary,
      session: this.getSession(bumpSession),
      stableID: this.stableID,
      sdkInstanceID: this.sdkInstanceID,
    };
  }
}
