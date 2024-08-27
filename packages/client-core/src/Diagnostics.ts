import { EvaluationDetails } from './EvaluationTypes';
import { EventLogger } from './EventLogger';
import { StatsigEventInternal } from './StatsigEvent';
import {
  NetworkConfigCommon,
  StatsigOptionsCommon,
} from './StatsigOptionsCommon';
import { StatsigUserInternal } from './StatsigUser';

export type KeyType = 'initialize' | 'overall';

export type StepType = 'process' | 'network_request';
export type ActionType = 'start' | 'end';
export interface Marker {
  key: KeyType;
  action: ActionType;
  timestamp: number;
  step?: StepType;
  statusCode?: number;
  success?: boolean;
  url?: string;
  idListCount?: number;
  sdkRegion?: string | null;
  markerID?: string;
  attempt?: number;
  isRetry?: boolean;
  configName?: string;
  message?: string | null;
  evaluationDetails?: EvaluationDetails;
  error?: Record<string, unknown>;
  isDelta?: boolean;
}

const MARKER_MAP: Map<string, Marker[]> = new Map<string, Marker[]>();
const ACT_START = 'start';
const ACT_END = 'end';
const DIAGNOSTICS_EVENT = 'statsig::diagnostics';

export const Diagnostics = {
  _getMarkers: (sdkKey: string): Marker[] | undefined => {
    return MARKER_MAP.get(sdkKey);
  },
  _markInitOverallStart: (sdkKey: string): void => {
    _addMarker(sdkKey, _createMarker({}, ACT_START, 'overall'));
  },
  _markInitOverallEnd: (
    sdkKey: string,
    success: boolean,
    evaluationDetails?: EvaluationDetails,
  ): void => {
    _addMarker(
      sdkKey,
      _createMarker(
        {
          success,
          error: success
            ? undefined
            : { name: 'InitializeError', message: 'Failed to initialize' },
          evaluationDetails,
        },
        ACT_END,
        'overall',
      ),
    );
  },
  _markInitNetworkReqStart: (
    sdkKey: string,
    data: InitializeDataType['networkRequest']['start'],
  ): void => {
    _addMarker(
      sdkKey,
      _createMarker(data, ACT_START, 'initialize', 'network_request'),
    );
  },
  _markInitNetworkReqEnd: (
    sdkKey: string,
    data: InitializeDataType['networkRequest']['end'],
  ): void => {
    _addMarker(
      sdkKey,
      _createMarker(data, ACT_END, 'initialize', 'network_request'),
    );
  },
  _markInitProcessStart: (sdkKey: string): void => {
    _addMarker(sdkKey, _createMarker({}, ACT_START, 'initialize', 'process'));
  },
  _markInitProcessEnd: (
    sdkKey: string,
    data: InitializeDataType['process']['end'],
  ): void => {
    _addMarker(sdkKey, _createMarker(data, ACT_END, 'initialize', 'process'));
  },
  _clearMarkers: (sdkKey: string): void => {
    MARKER_MAP.delete(sdkKey);
  },
  _formatError(e: unknown): Record<string, unknown> | undefined {
    if (!(e && typeof e === 'object')) {
      return;
    }
    return {
      code: _safeGetField(e, 'code'),
      name: _safeGetField(e, 'name'),
      message: _safeGetField(e, 'message'),
    };
  },
  _getDiagnosticsData(
    res: Response | null,
    attempt: number,
    body: string,
    e?: unknown,
  ): {
    success: boolean;
    isDelta?: boolean;
    sdkRegion?: string | null;
    statusCode?: number;
    attempt: number;
    error?: Record<string, unknown>;
  } {
    return {
      success: res?.ok === true,
      statusCode: res?.status,
      sdkRegion: res?.headers?.get('x-statsig-region'),
      isDelta: body.includes('"is_delta":true') === true ? true : undefined,
      attempt,
      error: Diagnostics._formatError(e),
    };
  },
  _enqueueDiagnosticsEvent(
    user: StatsigUserInternal | null,
    logger: EventLogger,
    sdk: string,
    options: StatsigOptionsCommon<NetworkConfigCommon> | null,
  ): void {
    const markers = Diagnostics._getMarkers(sdk);
    if (markers == null || markers.length <= 0) {
      return;
    }
    Diagnostics._clearMarkers(sdk);
    const event = _makeDiagnosticsEvent(user, {
      context: 'initialize',
      markers: markers.slice(),
      statsigOptions: options,
    });
    logger.enqueue(event);
  },
};

function _createMarker(
  data:
    | OverrallDataType['end']
    | InitializeDataType['process']['end']
    | InitializeDataType['networkRequest']['start']
    | InitializeDataType['networkRequest']['end']
    | Record<string, never>,
  action: ActionType,
  key: KeyType,
  step?: StepType,
): Marker {
  return {
    key: key,
    action: action,
    step: step,
    timestamp: Date.now(),
    ...data,
  };
}

function _makeDiagnosticsEvent(
  user: StatsigUserInternal | null,
  data: {
    context: string;
    markers: Marker[];
    statsigOptions?: StatsigOptionsCommon<NetworkConfigCommon> | null;
  },
): StatsigEventInternal {
  const latencyEvent = {
    eventName: DIAGNOSTICS_EVENT,
    user,
    value: null,
    metadata: data,
    time: Date.now(),
  };
  return latencyEvent;
}

function _addMarker(sdkKey: string, marker: Marker): void {
  const markers = MARKER_MAP.get(sdkKey) ?? [];
  markers.push(marker);
  MARKER_MAP.set(sdkKey, markers);
}

function _safeGetField(data: object, field: string): unknown | undefined {
  if (field in data) {
    return (data as Record<string, unknown>)[field];
  }
  return undefined;
}

interface OverrallDataType {
  end: {
    success: boolean;
    evaluationDetails?: EvaluationDetails;
    error?: Record<string, unknown>;
  };
}

interface InitializeDataType {
  process: {
    end: {
      success: boolean;
    };
  };
  networkRequest: {
    start: {
      attempt: number;
    };
    end: {
      success: boolean;
      attempt: number;
      isDelta?: boolean;
      sdkRegion?: string | null;
      statusCode?: number;
      error?: Record<string, unknown>;
    };
  };
}
