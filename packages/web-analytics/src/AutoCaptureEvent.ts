import { StatsigEvent } from '@statsig/client-core';

export const AutoCaptureEventName = {
  PAGE_VIEW: 'auto_capture::page_view',
  PAGE_VIEW_END: 'auto_capture::page_view_end',
  ERROR: 'auto_capture::error',
  SESSION_START: 'auto_capture::session_start',
  PERFORMANCE: 'auto_capture::performance',
  FORM_SUBMIT: 'auto_capture::form_submit',
  CLICK: 'auto_capture::click',
  RAGE_CLICK: 'auto_capture::rage_click',
  WEB_VITALS: 'auto_capture::web_vitals',
  DEAD_CLICK: 'auto_capture::dead_click',
  COPY: 'auto_capture::copy',
  // log line is a special event name used to populate logs metrics explorer
  CONSOLE_LOG: 'statsig::log_line',
} as const;

export type AutoCaptureEventName =
  (typeof AutoCaptureEventName)[keyof typeof AutoCaptureEventName] & string;

export type AutoCaptureEvent = StatsigEvent & {
  eventName: AutoCaptureEventName;
};

const USER_ACTION_EVENTS = new Set<AutoCaptureEventName>([
  AutoCaptureEventName.PAGE_VIEW,
  AutoCaptureEventName.PAGE_VIEW_END,
  AutoCaptureEventName.SESSION_START,
  AutoCaptureEventName.FORM_SUBMIT,
  AutoCaptureEventName.CLICK,
  AutoCaptureEventName.RAGE_CLICK,
  AutoCaptureEventName.COPY,
]);

export const isUserActionAutoCaptureEvent = (
  eventName: AutoCaptureEventName,
): boolean => {
  return USER_ACTION_EVENTS.has(eventName);
};
