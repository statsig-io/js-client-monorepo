import {
  InitializeResponseV1WithUpdates,
  _DJB2Object,
  _typedJsonParse,
} from '@statsig/client-core';

type DeltasEvaluationResponse = InitializeResponseV1WithUpdates & {
  deleted_configs?: string[];
  deleted_gates?: string[];
  deleted_layers?: string[];
  is_delta: true;
  has_updates: true;
  checksumV2: string;
  deltas_full_response?: Record<string, unknown>;
};

export type DeltasFailureInfo = {
  hadBadDeltaChecksum: boolean;
  badChecksum?: string;
  badMergedConfigs?: Record<string, unknown>;
  badFullResponse?: Record<string, unknown>;
};

type DeltasResult = string | DeltasFailureInfo | null;

const MAX_DELTAS_SORT_DEPTH = 2;

export function _resolveDeltasResponse(
  cache: InitializeResponseV1WithUpdates,
  deltasString: string,
): DeltasResult {
  const deltas = _typedJsonParse<DeltasEvaluationResponse>(
    deltasString,
    'checksum',
    'DeltasEvaluationResponse',
  );

  if (!deltas) {
    return {
      hadBadDeltaChecksum: true,
    };
  }

  const merged = _mergeDeltasIntoCache(cache, deltas);
  const resolved = _handleDeletedEntries(merged);

  const actualChecksum = _DJB2Object(
    {
      feature_gates: resolved.feature_gates,
      dynamic_configs: resolved.dynamic_configs,
      layer_configs: resolved.layer_configs,
    },
    MAX_DELTAS_SORT_DEPTH,
  );

  const isMatch = actualChecksum === deltas.checksumV2;
  if (!isMatch) {
    return {
      hadBadDeltaChecksum: true,
      badChecksum: actualChecksum,
      badMergedConfigs: resolved,
      badFullResponse: deltas.deltas_full_response,
    };
  }

  return JSON.stringify(resolved);
}

function _mergeDeltasIntoCache(
  cache: InitializeResponseV1WithUpdates,
  deltas: DeltasEvaluationResponse,
): DeltasEvaluationResponse {
  return {
    ...cache,
    ...deltas,
    feature_gates: {
      ...cache.feature_gates,
      ...deltas.feature_gates,
    },
    layer_configs: {
      ...cache.layer_configs,
      ...deltas.layer_configs,
    },
    dynamic_configs: {
      ...cache.dynamic_configs,
      ...deltas.dynamic_configs,
    },
  };
}

function _handleDeletedEntries(
  deltas: DeltasEvaluationResponse,
): InitializeResponseV1WithUpdates {
  const result = deltas;

  _deleteEntriesInRecord(deltas.deleted_gates, result.feature_gates);
  delete result.deleted_gates;

  _deleteEntriesInRecord(deltas.deleted_configs, result.dynamic_configs);
  delete result.deleted_configs;

  _deleteEntriesInRecord(deltas.deleted_layers, result.layer_configs);
  delete result.deleted_layers;

  return result;
}

function _deleteEntriesInRecord(
  keys: string[] | undefined,
  values: Record<string, unknown>,
) {
  keys?.forEach((key) => {
    delete values[key];
  });
}
