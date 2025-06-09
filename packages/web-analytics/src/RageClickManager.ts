const RAGE_CLICK_THRESHOLD_PX = 30;
const RAGE_CLICK_TIMEOUT_MS = 1000;
const RAGE_CLICK_CLICK_COUNT = 3;

type Click = { x: number; y: number; timestamp: number };

export default class RageClickManager {
  private _clicks: Click[] = [];

  isRageClick(x: number, y: number, timestamp: number): boolean {
    // Remove clicks outside the timeout window
    this._clicks = this._clicks.filter(
      (click) => timestamp - click.timestamp < RAGE_CLICK_TIMEOUT_MS,
    );

    const isCloseEnough = (click: Click) => {
      const dx = x - click.x;
      const dy = y - click.y;
      return Math.abs(dx) + Math.abs(dy) <= RAGE_CLICK_THRESHOLD_PX;
    };

    // If previous clicks exist, check spatial threshold
    if (
      this._clicks.length > 0 &&
      !isCloseEnough(this._clicks[this._clicks.length - 1])
    ) {
      this._clicks = [];
    }

    this._clicks.push({ x, y, timestamp });

    return this._clicks.length >= RAGE_CLICK_CLICK_COUNT;
  }
}
