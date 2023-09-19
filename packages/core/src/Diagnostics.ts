export function captureDiagnostics(task: () => unknown) {
  return task();
}
