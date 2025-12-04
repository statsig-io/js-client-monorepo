const MIN_FLUSH_INTERVAL_MS = 1000;
const MAX_FLUSH_INTERVAL_MS = 60_000;

export class FlushInterval {
  private _currentIntervalMs: number = MIN_FLUSH_INTERVAL_MS;
  private _lastFlushAttemptTime: number = Date.now();

  getCurrentIntervalMs(): number {
    return this._currentIntervalMs;
  }

  markFlushAttempt(): void {
    this._lastFlushAttemptTime = Date.now();
  }

  getTimeSinceLastAttempt(): number {
    return Date.now() - this._lastFlushAttemptTime;
  }

  hasReachedMaxInterval(): boolean {
    return this.getTimeSinceLastAttempt() >= MAX_FLUSH_INTERVAL_MS;
  }

  getTimeTillMaxInterval(): number {
    return MAX_FLUSH_INTERVAL_MS - this.getTimeSinceLastAttempt();
  }

  hasCompletelyRecoveredFromBackoff(): boolean {
    return this._currentIntervalMs <= MIN_FLUSH_INTERVAL_MS;
  }

  adjustForSuccess(): void {
    const current = this._currentIntervalMs;
    if (current === MIN_FLUSH_INTERVAL_MS) {
      return;
    }

    this._currentIntervalMs = Math.max(
      MIN_FLUSH_INTERVAL_MS,
      Math.floor(current / 2),
    );
  }

  adjustForFailure(): void {
    const current = this._currentIntervalMs;
    this._currentIntervalMs = Math.min(MAX_FLUSH_INTERVAL_MS, current * 2);
  }

  getTimeUntilNextFlush(): number {
    return this.getCurrentIntervalMs() - this.getTimeSinceLastAttempt();
  }
}
