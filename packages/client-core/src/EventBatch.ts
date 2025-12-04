import { StatsigEventInternal } from './StatsigEvent';

export class EventBatch {
  attempts = 0;
  readonly events: StatsigEventInternal[];
  readonly createdAt: number = Date.now();

  constructor(events: StatsigEventInternal[]) {
    this.events = events;
  }

  incrementAttempts(): void {
    this.attempts++;
  }
}
