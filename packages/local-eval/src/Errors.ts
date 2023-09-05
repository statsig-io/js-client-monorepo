export class StatsigUnsupportedEvaluationError extends Error {
  constructor(condition?: string) {
    super(`Unsupported condition or operator: ${condition}`);
    Object.setPrototypeOf(this, StatsigUnsupportedEvaluationError.prototype);
  }
}
