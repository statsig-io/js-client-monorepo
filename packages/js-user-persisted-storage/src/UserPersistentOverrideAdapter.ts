import {
  Experiment,
  ExperimentEvaluation,
  ExperimentEvaluationOptions,
  OverrideAdapter,
  SecondaryExposure,
  StatsigUser,
  _makeExperiment,
} from '@statsig/client-core';

import {
  StickyValues,
  UserPersistedValues,
  UserPersistentStorage,
} from './UserPersistedStorage';

export class UserPersistentOverrideAdapter implements OverrideAdapter {
  constructor(public readonly storage: UserPersistentStorage) {}

  loadUserPersistedValues(
    user: StatsigUser,
    idType: string,
  ): UserPersistedValues {
    const key = this._getStorageKey(user, idType);
    return this.storage.load(key) ?? {};
  }

  async loadUserPersistedValuesAsync(
    user: StatsigUser,
    idType: string,
  ): Promise<UserPersistedValues> {
    const key = this._getStorageKey(user, idType);
    return (await this.storage.loadAsync(key)) ?? {};
  }

  getExperimentOverride(
    current: Experiment,
    user: StatsigUser,
    options?: ExperimentEvaluationOptions,
  ): Experiment | null {
    const evaluation = current.__evaluation;
    if (evaluation == null) {
      return null;
    }

    const values = options?.userPersistedValues as UserPersistedValues | null;

    if (
      evaluation.is_experiment_active !== true ||
      values == null ||
      typeof values !== 'object'
    ) {
      this._handleDelete(user, current.name, evaluation.id_type);
      return null;
    }

    const sticky = values[current.name];
    if (sticky != null) {
      return this._makeStickyExperiment(evaluation, sticky);
    }

    if (evaluation.is_user_in_experiment) {
      this._handleSave(user, current, evaluation);
    }

    return null;
  }

  private _makeStickyExperiment(
    evaluation: ExperimentEvaluation,
    sticky: StickyValues,
  ): Experiment {
    const { id_type, name } = evaluation;
    const {
      json_value: value,
      secondary_exposures,
      group_name,
      rule_id,
      time,
    } = sticky;

    const details = {
      reason: 'Persisted',
      lcut: time,
    };

    return _makeExperiment(name, details, {
      // from sticky
      value,
      secondary_exposures,
      group_name: group_name ?? undefined,
      group: group_name ?? '',
      rule_id,

      // everything else
      id_type,
      name,
      is_device_based: evaluation.is_device_based,
    });
  }

  private _handleDelete(user: StatsigUser, name: string, idType: string) {
    const key = this._getStorageKey(user, idType);

    const current = this.storage.load(key);
    if (current == null) {
      return;
    }

    delete current[name];
    this.storage.delete(key, name);
  }

  private _handleSave(
    user: StatsigUser,
    experiment: Experiment,
    evaluation: ExperimentEvaluation,
  ) {
    const key = this._getStorageKey(user, evaluation.id_type);

    const values: StickyValues = {
      value: true,
      rule_id: evaluation.rule_id,
      json_value: evaluation.value,
      secondary_exposures:
        evaluation.secondary_exposures as SecondaryExposure[],
      group_name: evaluation.group,
      time: experiment.details.lcut ?? 0,
    };

    this.storage.save(key, experiment.name, JSON.stringify(values));
  }

  private _getStorageKey(user: StatsigUser, idType: string): string {
    return `${String(_getUnitIDFromUser(user, idType))}:${idType}`;
  }
}

function _getUnitIDFromUser(
  user: StatsigUser,
  idType: string,
): string | undefined {
  if (typeof idType === 'string' && idType.toLowerCase() !== 'userid') {
    return user.customIDs?.[idType] ?? user?.customIDs?.[idType.toLowerCase()];
  }
  return user.userID;
}
