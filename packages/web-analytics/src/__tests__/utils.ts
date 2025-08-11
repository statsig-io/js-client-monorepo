export function getLastEvent(
  requests: Record<string, any>[],
  eventName: string,
): Record<string, any> {
  for (let ii = requests.length - 1; ii >= 0; ii--) {
    const req = requests[ii];
    if (req['events']) {
      for (let jj = req['events'].length - 1; jj >= 0; jj--) {
        const evt = req['events'][jj];
        if (evt.eventName === eventName) {
          return evt as Record<string, any>;
        }
      }
    }
  }
  return {};
}

export function getLastPageViewEvent(
  requests: Record<string, any>[],
): Record<string, any> {
  return getLastEvent(requests, 'auto_capture::page_view');
}

export function getLastPageViewEndEvent(
  requests: Record<string, any>[],
): Record<string, any> {
  return getLastEvent(requests, 'auto_capture::page_view_end');
}

export function getLastSessionStartEvent(
  requests: Record<string, any>[],
): Record<string, any> {
  return getLastEvent(requests, 'auto_capture::session_start');
}

export function getLastPerformanceEvent(
  requests: Record<string, any>[],
): Record<string, any> {
  return getLastEvent(requests, 'auto_capture::performance');
}
