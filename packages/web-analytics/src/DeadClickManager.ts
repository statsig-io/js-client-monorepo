import { _getDocumentSafe, _getWindowSafe } from '@statsig/client-core';

import { AutoCaptureEventName } from './AutoCaptureEvent';
import { interactiveElements, throttle } from './utils/commonUtils';
import { _gatherEventData } from './utils/eventUtils';

export const DeadClickConfig = {
  CLICK_CHECK_TIMEOUT: 1000,
  SCROLL_DELAY_MS: 100,
  SELECTION_CHANGE_DELAY_MS: 100,
  MUTATION_DELAY_MS: 2500,
  ABSOLUTE_DEAD_CLICK_TIMEOUT: 2750,
};

export interface PossibleDeadClick {
  timestamp: number;
  eventTarget: HTMLElement;
  scrollDelayMs?: number;
  selectionChangeDelayMs?: number;
  mutationDelayMs?: number;
  absoluteDelayMs?: number;
}

// A dead click is a click that fires an event but produces no meaningful change within a set timeframe.

export default class DeadClickManager {
  private _lastMutationTime = 0;
  private _lastSelectionChangeTime = 0;
  private _clickCheckTimer: number | undefined;
  private _observer: MutationObserver | undefined;
  private _clicks: Array<PossibleDeadClick> = [];
  private _deadClickConfig = DeadClickConfig;

  constructor(
    private _enqueueFn: (
      eventName: AutoCaptureEventName,
      value: string,
      metadata: Record<string, unknown>,
    ) => void,
  ) {}

  public startTracking(): void {
    const win = _getWindowSafe();
    if (!win) {
      return;
    }
    // `capture: true` - Needed to listen to scroll events on all scrollable elements, not just the window.
    // docs: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#usecapture
    //
    // `passive: true` - Indicates the scroll handler won’t call preventDefault(),
    // allowing the browser to optimize scrolling performance by not blocking it.
    // docs: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#passive
    win.addEventListener('click', (event) => this._handleClick(event), {
      capture: true,
    });
    win.addEventListener('scroll', () => this._handleScroll(), {
      capture: true,
      passive: true,
    });
    win.addEventListener('selectionchange', () =>
      this._handleSelectionChange(),
    );
    this._setupMutationObserver();
  }

  private _handleClick(event: Event): void {
    const eventTarget = event.target as HTMLElement;
    if (!eventTarget) {
      return;
    }

    const click = {
      timestamp: Date.now(),
      eventTarget,
    };

    if (!interactiveElements.includes(eventTarget?.tagName?.toLowerCase())) {
      this._clicks.push(click);
    }

    if (this._clicks.length && !this._clickCheckTimer) {
      this._clickCheckTimer = _getWindowSafe()?.setTimeout(() => {
        this._checkForDeadClick();
      }, this._deadClickConfig.CLICK_CHECK_TIMEOUT);
    }
  }

  private _handleScroll: () => void = throttle(() => {
    const scrollTime = Date.now();
    this._clicks.forEach((click) => {
      if (!click.scrollDelayMs) {
        click.scrollDelayMs = scrollTime - click.timestamp;
      }
    });
  }, 50);

  private _handleSelectionChange(): void {
    this._lastSelectionChangeTime = Date.now();
  }

  private _setupMutationObserver(): void {
    const doc = _getDocumentSafe();
    if (!doc) {
      return;
    }

    this._observer = new MutationObserver(() => {
      this._lastMutationTime = Date.now();
    });

    this._observer.observe(doc.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  }

  private _checkForDeadClick(): void {
    if (!this._clicks.length) {
      return;
    }

    clearTimeout(this._clickCheckTimer);
    this._clickCheckTimer = undefined;

    const clicksToCheck = this._clicks;
    this._clicks = [];

    for (const click of clicksToCheck) {
      this._updateClickDelayMs(click);

      const hadScroll =
        click.scrollDelayMs != null &&
        click.scrollDelayMs < this._deadClickConfig.SCROLL_DELAY_MS;
      const hadSelectionChange =
        click.selectionChangeDelayMs != null &&
        click.selectionChangeDelayMs <
          this._deadClickConfig.SELECTION_CHANGE_DELAY_MS;
      const hadMutation =
        click.mutationDelayMs != null &&
        click.mutationDelayMs < this._deadClickConfig.MUTATION_DELAY_MS;

      if (hadScroll || hadSelectionChange || hadMutation) {
        continue;
      }

      const scrollTimeout =
        click.scrollDelayMs != null &&
        click.scrollDelayMs > this._deadClickConfig.SCROLL_DELAY_MS;
      const selectionChangeTimeout =
        click.selectionChangeDelayMs != null &&
        click.selectionChangeDelayMs >
          this._deadClickConfig.SELECTION_CHANGE_DELAY_MS;
      const mutationTimeout =
        click.mutationDelayMs != null &&
        click.mutationDelayMs > this._deadClickConfig.MUTATION_DELAY_MS;
      const absoluteTimeout =
        click.absoluteDelayMs != null &&
        click.absoluteDelayMs >
          this._deadClickConfig.ABSOLUTE_DEAD_CLICK_TIMEOUT;

      if (
        scrollTimeout ||
        selectionChangeTimeout ||
        mutationTimeout ||
        absoluteTimeout
      ) {
        this._logDeadClick(click, {
          scrollTimeout,
          selectionChangeTimeout,
          mutationTimeout,
          absoluteTimeout,
        });
      } else if (
        click.absoluteDelayMs != null &&
        click.absoluteDelayMs <
          this._deadClickConfig.ABSOLUTE_DEAD_CLICK_TIMEOUT
      ) {
        this._clicks.push(click);
      }
    }

    if (this._clicks.length && !this._clickCheckTimer) {
      this._clickCheckTimer = _getWindowSafe()?.setTimeout(() => {
        this._checkForDeadClick();
      }, this._deadClickConfig.CLICK_CHECK_TIMEOUT);
    }
  }

  private _logDeadClick(
    click: PossibleDeadClick,
    extraMetadata: Record<string, unknown>,
  ): void {
    const { value, metadata } = _gatherEventData(click.eventTarget);
    if (!value) {
      return;
    }

    this._enqueueFn(AutoCaptureEventName.DEAD_CLICK, value, {
      ...metadata,
      ...extraMetadata,
      scrollDelayMs: click.scrollDelayMs,
      selectionChangeDelayMs: click.selectionChangeDelayMs,
      mutationDelayMs: click.mutationDelayMs,
      absoluteDelayMs: click.absoluteDelayMs,
    });
  }

  private _updateClickDelayMs(click: PossibleDeadClick): void {
    if (
      !click.mutationDelayMs &&
      this._lastMutationTime > 0 &&
      click.timestamp <= this._lastMutationTime
    ) {
      click.mutationDelayMs = Date.now() - this._lastMutationTime;
    }

    if (
      !click.selectionChangeDelayMs &&
      this._lastSelectionChangeTime > 0 &&
      click.timestamp <= this._lastSelectionChangeTime
    ) {
      click.selectionChangeDelayMs = Date.now() - this._lastSelectionChangeTime;
    }

    click.absoluteDelayMs = Date.now() - click.timestamp;
  }
}
