import {
  SDK_VERSION,
  SessionReplayPrivacySettings,
  StatsigEvent,
} from '@statsig/client-core';

import { RRWebConfig, ReplaySessionData } from './SessionReplayClient';

export type RRWebPayload = {
  session_start_ts: string;
  session_end_ts: string;
  clicks_captured_cumulative: string;
  rrweb_events: string;
  rrweb_payload_size: string;
  session_replay_sdk_version: string;
  sliced_id?: string;
  slice_index?: string;
  slice_count?: string;
  slice_byte_size?: string;
  is_leaving_page?: string;
  session_expired?: string;
  sdk_instance_id: string;
};

const REPLAY_SLICE_BYTES = 1024 * 1024; // 1 MB
export const REPLAY_ENQUEUE_TRIGGER_BYTES = 1024 * 10; // 10 KB
export const MAX_INDIVIDUAL_EVENT_BYTES = 1024 * 1024 * 10; // 10 MB
export const MAX_LOGS = 10000; // 10K logs

export function _makeLoggableRrwebEvent(
  slice: string,
  payload: string,
  sessionID: string,
  data: ReplaySessionData,
  sdkInstanceID: string,
): StatsigEvent & { metadata: RRWebPayload } {
  const metadata: RRWebPayload = {
    session_start_ts: String(data.startTime),
    session_end_ts: String(data.endTime),
    clicks_captured_cumulative: String(data.clickCount),

    rrweb_events: slice,
    rrweb_payload_size: String(payload.length),

    session_replay_sdk_version: SDK_VERSION,
    sdk_instance_id: sdkInstanceID,
  };

  return {
    eventName: 'statsig::session_recording',
    value: sessionID,
    metadata,
  };
}

export function _slicePayload(payload: string): string[] {
  const parts = [];

  for (let i = 0; i < payload.length; i += REPLAY_SLICE_BYTES) {
    parts.push(payload.slice(i, i + REPLAY_SLICE_BYTES));
  }

  return parts;
}

export function _appendSlicedMetadata(
  metadata: RRWebPayload,
  slicedID: string,
  sliceIndex: number,
  sliceCount: number,
  sliceByteSize: number,
): void {
  metadata.sliced_id = slicedID;
  metadata.slice_index = String(sliceIndex);
  metadata.slice_count = String(sliceCount);
  metadata.slice_byte_size = String(sliceByteSize);
}

export function getNewRRWebConfigWithPrivacySettings(
  originalOptions: RRWebConfig,
  privacySettings: SessionReplayPrivacySettings,
): RRWebConfig {
  const maskValue = (value: string): string => {
    return value.replace(/./g, '*');
  };

  const blockSelector = privacySettings.blocked_elements
    ? privacySettings.blocked_elements.join(', ')
    : undefined;
  const maskTextSelector =
    privacySettings.privacy_mode === 'max'
      ? '*'
      : privacySettings.masked_elements
        ? privacySettings.masked_elements.join(', ')
        : undefined;
  const maskInputFn = (value: string, element: HTMLElement): string => {
    if (privacySettings.masked_elements?.some((sel) => element.closest(sel))) {
      return maskValue(value);
    }

    if (
      privacySettings.unmasked_elements?.some((sel) => element.closest(sel))
    ) {
      return value;
    }

    return privacySettings.privacy_mode === 'max' ||
      privacySettings.privacy_mode === 'input'
      ? maskValue(value)
      : value;
  };

  return {
    ...originalOptions,
    maskTextFn: maskValue,
    maskInputFn,
    maskTextSelector,
    maskAllInputs: true, // always return true here so that maskInputFn is always called. maskInputFn will handle if we should mask the input or not.
    maskInputOptions: undefined,
    blockSelector,
  };
}
