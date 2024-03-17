export function _getOverridableUrl(
  overrideUrl: string | undefined,
  overrideApi: string | undefined,
  defaultEndpoint: string,
  defaultApi: string,
): string {
  if (overrideUrl) {
    return overrideUrl;
  } else if (overrideApi) {
    return `${overrideApi}${defaultEndpoint}`;
  } else {
    return `${defaultApi}${defaultEndpoint}`;
  }
}
