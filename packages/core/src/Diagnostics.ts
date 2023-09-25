export function captureDiagnostics(task: () => unknown): unknown {
  return task();
}
