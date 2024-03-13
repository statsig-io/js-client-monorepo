import { DJB2Object, typedJsonParse } from '@statsig/client-core';

import { EvaluationResponseWithUpdates } from './EvaluationData';

type DeltasEvaluationResponse = EvaluationResponseWithUpdates & {
  deleted_configs?: string[];
  deleted_gates?: string[];
  deleted_layers?: string[];
  is_delta: true;
  has_updates: true;
  checksum: string;
  deltas_full_response?: Record<string, unknown>;
};

export type DeltasFailureInfo = {
  hadBadDeltaChecksum: boolean;
  badChecksum?: string;
  badMergedConfigs?: Record<string, unknown>;
  badFullResponse?: Record<string, unknown>;
};

type DeltasResult = string | DeltasFailureInfo | null;

export function resolveDeltasResponse(
  cache: EvaluationResponseWithUpdates,
  deltasString: string,
): DeltasResult {
  const deltas = typedJsonParse<DeltasEvaluationResponse>(
    deltasString,
    'checksum',
    'Failed to parse DeltasEvaluationResponse',
  );

  if (!deltas) {
    return {
      hadBadDeltaChecksum: true,
    };
  }

  const merged = _mergeDeltasIntoCache(cache, deltas);
  const resolved = _handleDeletedEntries(merged);

  const actualChecksum = DJB2Object({
    feature_gates: resolved.feature_gates,
    dynamic_configs: resolved.dynamic_configs,
    layer_configs: resolved.layer_configs,
  });

  const isMatch = actualChecksum === deltas.checksum;
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
  cache: EvaluationResponseWithUpdates,
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
): EvaluationResponseWithUpdates {
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
