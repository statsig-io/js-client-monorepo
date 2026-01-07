import {
  AnyEvaluation,
  AnyInitializeResponse,
  BootstrapMetadata,
  DataAdapterResult,
  DataSource,
  DetailedStoreResult,
  DynamicConfigEvaluation,
  EvaluationDetails,
  GateEvaluation,
  InitializeResponse,
  InitializeResponseV2,
  LayerEvaluation,
  ParamStoreConfig,
  SDKFlags,
  SecondaryExposure,
  StableID,
  StatsigUser,
  StatsigWarnings,
  _getFullUserHash,
  _typedJsonParse,
} from '@statsig/client-core';

import { InitializeContainer } from './InitializeContainer';
import type { StatsigOptions } from './StatsigOptions';
import { V1InitializeContainer } from './V1InitializeContainer';
import { V2InitializeContainer } from './V2InitializeContainer';

export default class EvaluationStore {
  private _valuesForExternalUse: AnyInitializeResponse | null = null;
  private _values: InitializeContainer | null = null;
  private _source: DataSource = 'Uninitialized';
  private _lcut = 0;
  private _receivedAt = 0;
  private _bootstrapMetadata: BootstrapMetadata | null = null;
  private _warnings: Set<StatsigWarnings> = new Set();

  constructor(
    private _sdkKey: string,
    private _options: StatsigOptions | null,
  ) {}

  reset(): void {
    this._values = null;
    this._valuesForExternalUse = null;
    this._source = 'Loading';
    this._lcut = 0;
    this._receivedAt = 0;
    this._bootstrapMetadata = null;
    this._warnings.clear();
  }

  finalize(): void {
    if (this._values) {
      return;
    }

    this._source = 'NoValues';
  }

  getValues(): AnyInitializeResponse | null {
    // we do not give out the actual _values object to avoid mutating it
    return this._valuesForExternalUse;
  }

  setValues(result: DataAdapterResult | null, user: StatsigUser): boolean {
    if (!result) {
      return false;
    }

    const values = _typedJsonParse<InitializeResponse | InitializeResponseV2>(
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

    const updatedLcut = values.time ?? 0;

    if (updatedLcut < this._lcut) {
      return true;
    }

    this._valuesForExternalUse = _typedJsonParse<AnyInitializeResponse>(
      result.data,
      'has_updates',
      'EvaluationResponse',
    );
    this._lcut = values.time;
    this._receivedAt = result.receivedAt;
    if (values.response_format === 'init-v2') {
      this._values = new V2InitializeContainer(values);
    } else {
      this._values = new V1InitializeContainer(values);
    }
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
    const res = this._values ? this._values.getGate(name) : null;
    return this._getDetailedStoreResult(res);
  }

  getConfig(name: string): DetailedStoreResult<DynamicConfigEvaluation> {
    const res = this._values ? this._values.getConfig(name) : null;
    return this._getDetailedStoreResult(res);
  }

  getConfigList(): string[] {
    if (!this._values) {
      return [];
    }
    return this._values.getConfigList();
  }

  getLayer(name: string): DetailedStoreResult<LayerEvaluation> {
    const res = this._values ? this._values.getLayer(name) : null;
    return this._getDetailedStoreResult(res);
  }

  getParamStore(name: string): DetailedStoreResult<ParamStoreConfig> {
    const res = this._values ? this._values.getParamStore(name) : null;
    return this._getDetailedStoreResult(res);
  }

  getSource(): DataSource {
    return this._source;
  }

  getExposureMapping(): Record<string, SecondaryExposure> | undefined {
    return this._values?.getExposureMapping();
  }

  private _extractBootstrapMetadata(
    source: DataSource,
    values: AnyInitializeResponse,
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
    result: T | null,
  ): DetailedStoreResult<T> {
    return {
      result,
      details: this._getDetails(result == null),
    };
  }

  private _setWarningState(
    user: StatsigUser,
    values: InitializeResponse | InitializeResponseV2,
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
      let bootstrapUser = values['user'] as StatsigUser;
      let userForComparison = {
        ...user,
        analyticsOnlyMetadata: undefined,
        privateAttributes: undefined,
      };

      if (this._options?.disableStableID) {
        userForComparison = {
          ...userForComparison,
          customIDs: {
            ...userForComparison.customIDs,
            stableID: undefined,
          },
        };
        bootstrapUser = {
          ...bootstrapUser,
          customIDs: {
            ...bootstrapUser.customIDs,
            stableID: undefined,
          },
        };
      }
      if (
        _getFullUserHash(userForComparison) !== _getFullUserHash(bootstrapUser)
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
