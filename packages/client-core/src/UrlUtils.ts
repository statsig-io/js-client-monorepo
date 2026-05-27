export function _isCrossOrigin(
  url: string,
  currentOrigin: string | undefined,
): boolean {
  if (!currentOrigin) {
    return true;
  }

  try {
    return new URL(url, currentOrigin).origin !== currentOrigin;
  } catch {
    return true;
  }
}
