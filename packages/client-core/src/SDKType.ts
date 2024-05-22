type ClientType = 'javascript-client' | 'js-on-device-eval-client';
type BindingType = 'expo' | 'rn' | 'react' | 'angular';

const SDK_CLIENT: Record<string, ClientType> = {};

let suffix: string | null;

export const SDKType = {
  _get: (sdkKey: string): string => {
    return (SDK_CLIENT[sdkKey] ?? 'js-mono') + (suffix ?? '');
  },
  _setClientType(sdkKey: string, client: ClientType): void {
    SDK_CLIENT[sdkKey] = client;
  },
  _setBindingType(binding: BindingType): void {
    if (!suffix || suffix === '-react') {
      suffix = '-' + binding;
    }
  },
};
