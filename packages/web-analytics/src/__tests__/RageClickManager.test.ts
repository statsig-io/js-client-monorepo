import RageClickManager from '../RageClickManager';

describe('RageClickManager Tests', () => {
  let rageClickManager: RageClickManager;

  beforeEach(() => {
    rageClickManager = new RageClickManager();
  });

  it('detects rage click when 3 clicks occur in same area within timeout', () => {
    const timestamp = Date.now();
    const x = 100;
    const y = 200;

    // First click
    expect(rageClickManager.isRageClick(x, y, timestamp)).toBe(false);

    // Second click
    expect(rageClickManager.isRageClick(x, y, timestamp + 100)).toBe(false);

    // Third click - should trigger rage click
    expect(rageClickManager.isRageClick(x, y, timestamp + 200)).toBe(true);
  });

  it('does not detect rage click when clicks are too far apart spatially', () => {
    const timestamp = Date.now();
    const x1 = 100;
    const y1 = 200;
    const x2 = 200; // Too far from first click
    const y2 = 300;

    // First click
    expect(rageClickManager.isRageClick(x1, y1, timestamp)).toBe(false);

    // Second click - too far
    expect(rageClickManager.isRageClick(x2, y2, timestamp + 100)).toBe(false);

    // Third click - too far
    expect(rageClickManager.isRageClick(x2, y2, timestamp + 200)).toBe(false);
  });

  it('does not detect rage click when clicks are too far apart in time', () => {
    const timestamp = Date.now();
    const x = 100;
    const y = 200;

    // First click
    expect(rageClickManager.isRageClick(x, y, timestamp)).toBe(false);

    // Second click
    expect(rageClickManager.isRageClick(x, y, timestamp + 100)).toBe(false);

    // Third click - too late
    expect(rageClickManager.isRageClick(x, y, timestamp + 1100)).toBe(false);
  });

  it('resets click count when clicks are too far apart', () => {
    const timestamp = Date.now();
    const x1 = 100;
    const y1 = 200;
    const x2 = 200; // Too far from first click
    const y2 = 300;

    // First click
    expect(rageClickManager.isRageClick(x1, y1, timestamp)).toBe(false);

    // Second click - too far, should reset
    expect(rageClickManager.isRageClick(x2, y2, timestamp + 100)).toBe(false);

    // Third click at new location - should not be rage click
    expect(rageClickManager.isRageClick(x2, y2, timestamp + 200)).toBe(false);
  });

  it('handles clicks at exact threshold distance', () => {
    const timestamp = Date.now();
    const x1 = 100;
    const y1 = 200;
    const x2 = 130; // Exactly at threshold (30px)
    const y2 = 200;

    // First click
    expect(rageClickManager.isRageClick(x1, y1, timestamp)).toBe(false);

    // Second click - at threshold
    expect(rageClickManager.isRageClick(x2, y2, timestamp + 100)).toBe(false);

    // Third click - at threshold
    expect(rageClickManager.isRageClick(x2, y2, timestamp + 200)).toBe(true);
  });

  it('handles clicks at exact timeout threshold', () => {
    const timestamp = Date.now();
    const x = 100;
    const y = 200;

    // First click
    expect(rageClickManager.isRageClick(x, y, timestamp)).toBe(false);

    // Second click
    expect(rageClickManager.isRageClick(x, y, timestamp + 500)).toBe(false);

    // Third click - exactly at timeout threshold
    expect(rageClickManager.isRageClick(x, y, timestamp + 999)).toBe(true);
  });
});
