import { _getDocumentSafe, _getWindowSafe } from '@statsig/client-core';

const PAGE_INACTIVE_TIMEOUT = 600000; // 10 minutes

export class EngagementManager {
  private _lastScrollY = 0;
  private _maxScrollY = 0;
  private _lastScrollPercentage = 0;
  private _maxScrollPercentage = 0;
  private _lastPageViewTime = Date.now();
  private _inactiveTimer: number | null = null;
  private _onInactivityCallback: (() => void) | null = null;
  private _meaningfulEngagementOccurred = false;

  constructor() {
    this._initializeScrollTracking();
  }

  private _initializeScrollTracking(): void {
    const win = _getWindowSafe();
    if (!win) return;

    win.addEventListener('scroll', () => this._handleScroll());
    win.addEventListener('scrollend', () => this._handleScroll());
    win.addEventListener('resize', () => this._handleScroll());
  }

  private _handleScroll(): void {
    const win = _getWindowSafe();
    const doc = _getDocumentSafe();
    if (!win || !doc) return;

    const scrollHeight = doc.body.scrollHeight;
    const scrollY = win.scrollY || doc.documentElement.scrollTop || 0;
    const innerHeight = win.innerHeight;

    this._lastScrollY = scrollY;
    this._maxScrollY = Math.max(this._maxScrollY, scrollY);

    const currentScrollPercentage = Math.min(
      100,
      Math.round(((scrollY + innerHeight) / scrollHeight) * 100),
    );
    this._lastScrollPercentage = currentScrollPercentage;
    this._maxScrollPercentage = Math.max(
      this._maxScrollPercentage,
      currentScrollPercentage,
    );

    this.bumpInactiveTimer();
  }

  public getScrollMetrics(): {
    lastScrollY: number;
    maxScrollY: number;
    lastScrollPercentage: number;
    maxScrollPercentage: number;
    scrollDepth: number;
  } {
    return {
      lastScrollY: this._lastScrollY,
      maxScrollY: this._maxScrollY,
      lastScrollPercentage: this._lastScrollPercentage,
      maxScrollPercentage: this._maxScrollPercentage,
      scrollDepth: this._maxScrollPercentage, // deprecated
    };
  }

  public getPageViewLength(): number {
    return Date.now() - this._lastPageViewTime;
  }

  public setLastPageViewTime(time: number): void {
    this._lastPageViewTime = time;
  }

  public startInactivityTracking(callback: () => void): void {
    this._onInactivityCallback = callback;
  }

  public bumpInactiveTimer(): void {
    const win = _getWindowSafe();
    if (!win) {
      return;
    }

    if (this._inactiveTimer) {
      clearTimeout(this._inactiveTimer);
    }

    this._inactiveTimer = win.setTimeout(() => {
      if (this._onInactivityCallback) {
        this._onInactivityCallback();
      }
    }, PAGE_INACTIVE_TIMEOUT);
  }

  public setMeaningfulEngagementOccurred(occurred: boolean): void {
    this._meaningfulEngagementOccurred = occurred;
  }

  public getPageViewEndMetadata(): Record<string, unknown> {
    const pageviewEndMetadata = {
      ...this.getScrollMetrics(),
      pageViewLength: this.getPageViewLength(),
      meaningfulEngagementOccurred: this._meaningfulEngagementOccurred,
    };
    this.setMeaningfulEngagementOccurred(false);
    return pageviewEndMetadata;
  }
}
