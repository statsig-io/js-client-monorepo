export class StatsigUnsupportedEvaluationError extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, StatsigUnsupportedEvaluationError.prototype);
  }
}
