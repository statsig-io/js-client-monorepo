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
} as const;

export type AutoCaptureEventName =
  (typeof AutoCaptureEventName)[keyof typeof AutoCaptureEventName] & string;

export type AutoCaptureEvent = StatsigEvent & {
  eventName: AutoCaptureEventName;
};
