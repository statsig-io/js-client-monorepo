export function getObjectFromLocalStorage<T>(key: string) {
  return JSON.parse(localStorage.getItem(key) ?? '{}') as T;
}

export function setObjectInLocalStorage(key: string, obj: unknown) {
  localStorage.setItem(key, JSON.stringify(obj));
}
