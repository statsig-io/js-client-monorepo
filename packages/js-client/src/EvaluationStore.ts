import {
  AnyEvaluation,
  BootstrapMetadata,
  DataAdapterResult,
  DataSource,
  DetailedStoreResult,
  DynamicConfigEvaluation,
  EvaluationDetails,
  GateEvaluation,
  InitializeResponse,
  InitializeResponseWithUpdates,
  LayerEvaluation,
  ParamStoreConfig,
  SDKFlags,
  SecondaryExposure,
  StableID,
  StatsigUser,
  StatsigWarnings,
  _DJB2,
  _getFullUserHash,
  _typedJsonParse,
} from '@statsig/client-core';

export default class EvaluationStore {
  private _rawValues: string | null = null;
  private _values: InitializeResponseWithUpdates | null = null;
  private _source: DataSource = 'Uninitialized';
  private _lcut = 0;
  private _receivedAt = 0;
  private _bootstrapMetadata: BootstrapMetadata | null = null;
  private _warnings: Set<StatsigWarnings> = new Set();

  constructor(private _sdkKey: string) {}

  reset(): void {
    this._values = null;
    this._rawValues = null;
    this._source = 'Loading';
    this._lcut = 0;
    this._receivedAt = 0;
    this._bootstrapMetadata = null;
  }

  finalize(): void {
    if (this._values) {
      return;
    }

    this._source = 'NoValues';
  }

  getValues(): InitializeResponseWithUpdates | null {
    return this._rawValues
      ? _typedJsonParse<InitializeResponseWithUpdates>(
          this._rawValues,
          'has_updates',
          'EvaluationStoreValues',
        )
      : null;
  }

  setValues(result: DataAdapterResult | null, user: StatsigUser): boolean {
    if (!result) {
      return false;
    }

    const values = _typedJsonParse<InitializeResponse>(
      result.data,
      'has_updates',
      'EvaluationResponse',
    );

    if (values == null) {
      return false;
    }

    this._source = result.source;

    if (values?.has_updates !== true) {
      return true;
    }

    this._rawValues = result.data;
    this._lcut = values.time;
    this._receivedAt = result.receivedAt;
    this._values = values;
    this._bootstrapMetadata = this._extractBootstrapMetadata(
      result.source,
      values,
    );

    if (result.source && values.user) {
      this._setWarningState(user, values);
    }

    SDKFlags.setFlags(this._sdkKey, values.sdk_flags ?? {});

    return true;
  }

  getWarnings(): StatsigWarnings[] | undefined {
    if (this._warnings.size === 0) {
      return undefined;
    }
    return Array.from(this._warnings);
  }

  getGate(name: string): DetailedStoreResult<GateEvaluation> {
    return this._getDetailedStoreResult(this._values?.feature_gates, name);
  }

  getConfig(name: string): DetailedStoreResult<DynamicConfigEvaluation> {
    return this._getDetailedStoreResult(this._values?.dynamic_configs, name);
  }

  getLayer(name: string): DetailedStoreResult<LayerEvaluation> {
    return this._getDetailedStoreResult(this._values?.layer_configs, name);
  }

  getParamStore(name: string): DetailedStoreResult<ParamStoreConfig> {
    return this._getDetailedStoreResult(this._values?.param_stores, name);
  }

  getSource(): DataSource {
    return this._source;
  }

  getExposureMapping(): Record<string, SecondaryExposure> | undefined {
    return this._values?.exposures;
  }

  private _extractBootstrapMetadata(
    source: DataSource,
    values: InitializeResponseWithUpdates,
  ): BootstrapMetadata | null {
    if (source !== 'Bootstrap') {
      return null;
    }

    const bootstrapMetadata: BootstrapMetadata = {};
    if (values.user) {
      bootstrapMetadata.user = values.user;
    }
    if (values.sdkInfo) {
      bootstrapMetadata.generatorSDKInfo = values.sdkInfo;
    }
    bootstrapMetadata.lcut = values.time;

    return bootstrapMetadata;
  }

  private _getDetailedStoreResult<T extends AnyEvaluation | ParamStoreConfig>(
    lookup: Record<string, T> | undefined,
    name: string,
  ): DetailedStoreResult<T> {
    let result: T | null = null;
    if (lookup) {
      result = lookup[name] ? lookup[name] : lookup[_DJB2(name)];
    }

    return {
      result,
      details: this._getDetails(result == null),
    };
  }

  private _setWarningState(
    user: StatsigUser,
    values: InitializeResponse,
  ): void {
    const stableID = StableID.get(this._sdkKey);
    if (
      user.customIDs?.stableID !== stableID && // don't throw if they're both undefined
      (user.customIDs?.stableID || stableID)
    ) {
      this._warnings.add('StableIDMismatch');
      return;
    }
    if ('user' in values) {
      const bootstrapUser = values['user'] as StatsigUser;
      const userWithoutAnalyticsOnlyMetadata = {
        ...user,
        analyticsOnlyMetadata: undefined,
      };
      if (
        _getFullUserHash(userWithoutAnalyticsOnlyMetadata) !==
        _getFullUserHash(bootstrapUser)
      ) {
        this._warnings.add('PartialUserMatch');
      }
    }
  }

  getCurrentSourceDetails(): EvaluationDetails {
    if (this._source === 'Uninitialized' || this._source === 'NoValues') {
      return { reason: this._source };
    }

    const sourceDetails: EvaluationDetails = {
      reason: this._source,
      lcut: this._lcut,
      receivedAt: this._receivedAt,
    };

    if (this._warnings.size > 0) {
      sourceDetails.warnings = Array.from(this._warnings);
    }

    return sourceDetails;
  }

  private _getDetails(isUnrecognized: boolean): EvaluationDetails {
    const sourceDetails = this.getCurrentSourceDetails();

    let reason = sourceDetails.reason;
    const warnings = sourceDetails.warnings ?? [];
    if (this._source === 'Bootstrap' && warnings.length > 0) {
      reason = reason + warnings[0];
    }

    if (reason !== 'Uninitialized' && reason !== 'NoValues') {
      const subreason = isUnrecognized ? 'Unrecognized' : 'Recognized';
      reason = `${reason}:${subreason}`;
    }

    const bootstrapMetadata =
      this._source === 'Bootstrap'
        ? this._bootstrapMetadata ?? undefined
        : undefined;

    if (bootstrapMetadata) {
      sourceDetails.bootstrapMetadata = bootstrapMetadata;
    }

    return {
      ...sourceDetails,
      reason,
    };
  }
}
