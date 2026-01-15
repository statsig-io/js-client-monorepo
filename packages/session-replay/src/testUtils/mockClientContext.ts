import type {
  AnyInitializeResponse,
  AnyStatsigOptions,
  PrecomputedEvaluationsContext,
  PrecomputedEvaluationsContextHandle,
  PrecomputedEvaluationsInterface,
  StatsigSession,
  StatsigUser,
} from '@statsig/client-core';

export type MockContextHandle = {
  sdkKey: string;
  options: AnyStatsigOptions;
  errorBoundary: { wrap: jest.Mock };
  values: Partial<AnyInitializeResponse> | null;
  user: StatsigUser;
  stableID: string | null;
  sdkInstanceID: string;
  getSession: jest.Mock;
  toContext: jest.Mock;
};

export type MockSession = {
  data: { sessionID: string; startTime?: number; lastUpdate?: number };
  sdkKey?: string;
};

export type MockContextValues = Partial<AnyInitializeResponse> | null;

export type MockContextHandleOverrides = Partial<MockContextHandle>;
export type MockContextOverrides = Partial<PrecomputedEvaluationsContext>;

const DEFAULT_SESSION: StatsigSession = {
  data: { sessionID: 'test-session-id', startTime: 0, lastUpdate: 0 },
  sdkKey: '',
  lastPersistedAt: 0,
  storageKey: '',
};

/**
 * Creates a mock context handle that mimics PrecomputedEvaluationsContextHandle.
 * Use this for tests that call client.getContextHandle().
 */
export function createMockContextHandle(
  values: MockContextValues = null,
): MockContextHandle {
  const handle: MockContextHandle = {
    sdkKey: '',
    options: {},
    errorBoundary: { wrap: jest.fn() },
    values,
    user: { userID: '' },
    stableID: '',
    sdkInstanceID: '',
    getSession: jest.fn().mockReturnValue(DEFAULT_SESSION),
    toContext: jest.fn(),
  };

  return handle;
}

export function mockClientContext(
  client: jest.MockedObject<PrecomputedEvaluationsInterface>,
  values: MockContextValues = null,
  opts?: {
    session?: MockSession;
    handleOverrides?: MockContextHandleOverrides;
    contextOverrides?: MockContextOverrides;
  },
): { handle: MockContextHandle; context: PrecomputedEvaluationsContext } {
  const baseHandle = createMockContextHandle(values);
  const handle: MockContextHandle = {
    ...baseHandle,
    ...(opts?.handleOverrides ?? {}),
  };

  // allow per-test session override
  if (opts?.session) {
    const baseSession = handle.getSession() as StatsigSession;
    const mergedSession: StatsigSession = {
      ...baseSession,
      ...opts.session,
      data: {
        ...baseSession.data,
        ...opts.session.data,
      },
    };
    handle.getSession = jest.fn().mockReturnValue(mergedSession);
  }

  const materializedContext: PrecomputedEvaluationsContext = {
    sdkKey: handle.sdkKey,
    options: handle.options,
    errorBoundary:
      handle.errorBoundary as unknown as PrecomputedEvaluationsContext['errorBoundary'],
    values: handle.values as PrecomputedEvaluationsContext['values'],
    user: handle.user,
    stableID: handle.stableID,
    sdkInstanceID: handle.sdkInstanceID,
    session: handle.getSession() as StatsigSession,
    ...(opts?.contextOverrides ?? {}),
  };

  client.getContext.mockReturnValue(materializedContext);
  client.getContextHandle.mockReturnValue(
    handle as unknown as PrecomputedEvaluationsContextHandle,
  );

  return { handle, context: materializedContext };
}
