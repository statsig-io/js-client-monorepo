export function getObjectFromLocalStorage<T>(key: string): T | null {
  return JSON.parse(localStorage.getItem(key) ?? 'null') as T | null;
}

export function setObjectInLocalStorage(key: string, obj: unknown): void {
  localStorage.setItem(key, JSON.stringify(obj));
}
