export interface AsciicastHeader {
  version: 2;
  width: number;
  height: number;
  timestamp?: number;
  duration?: number;
  idle_time_limit?: number;
  command?: string;
  title?: string;
  env?: Record<string, string | undefined>;
  theme?: {
    fg?: string;
    bg?: string;
    palette?: string;
  };
}

/**
 * Event codes:
 *  - o: Output
 *  - i: Input
 *  - m: Marker
 *  - r: Resize
 *  - x: Exit (Only defined by asciicast v3, but v2 supports custom events)
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type AsciicastEventCode = 'o' | 'i' | 'm' | 'r' | 'x' | (string & {});

export const AsciicastEventCode = {
  Output: 'o' as const,
  Input: 'i' as const,
  Marker: 'm' as const,
  Resize: 'r' as const,
  /**
   * Exit code
   * Note: Only defined by asciicast v3, but v2 supports custom events
   */
  Exit: 'x' as const,
};

export type AsciicastEventData = unknown;

export type AsciicastEvent = [number, AsciicastEventCode, AsciicastEventData];

export type AsciicastArray = [AsciicastHeader, ...AsciicastEvent[]];
