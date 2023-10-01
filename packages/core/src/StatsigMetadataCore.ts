const SDK_VERSION = '0.0.4';

export type StatsigMetadata = {
  readonly appVersion: string;
  readonly deviceModel: string;
  readonly deviceModelName: string;
  readonly locale: string;
  readonly sdkType: string;
  readonly sdkVersion: string;
  readonly stableID: string;
  readonly systemName: string;
  readonly systemVersion: string;
};

const metadata = {
  appVersion: '',
  deviceModel: '',
  deviceModelName: '',
  locale: '',
  sdkType: '',
  sdkVersion: SDK_VERSION,
  stableID: '',
  systemName: '',
  systemVersion: '',
};

extractFromReactNativeDeviceInfo();
extractFromExpoDevice();
extractFromExpoConstants();

export const StatsigMetadataCore: StatsigMetadata = metadata;

function dangerouslyGetModule<T extends object>(name: string): T {
  const deviceInfoModule =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-var-requires
    require(name) as { default: T } | T;

  return 'default' in deviceInfoModule
    ? deviceInfoModule.default
    : deviceInfoModule;
}

function extractFromReactNativeDeviceInfo() {
  type ReactNativeDeviceInfo = {
    getVersion: () => string | null;
    getSystemVersion: () => string | null;
    getSystemName: () => string | null;
    getModel: () => string | null;
    getDeviceId: () => string | null;
  };

  try {
    const info = dangerouslyGetModule<ReactNativeDeviceInfo>(
      'react-native-device-info',
    );

    metadata.appVersion = info.getVersion() ?? '';
    metadata.systemVersion = info.getSystemVersion() ?? '';
    metadata.systemName = info.getSystemName() ?? '';
    metadata.deviceModelName = info.getModel() ?? '';
    metadata.deviceModel = info.getDeviceId() ?? '';
  } catch {
    // noop
  }
}

function extractFromExpoDevice() {
  type ExpoDevice = {
    osVersion: string | null;
    osName: string | null;
    modelName: string | null;
    modelId: string | null;
  };

  try {
    const device = dangerouslyGetModule<ExpoDevice>('expo-device');

    metadata.systemVersion = device.osVersion ?? '';
    metadata.systemName = device.osName ?? '';
    metadata.deviceModelName = device.modelName ?? '';
    metadata.deviceModel = device.modelId ?? '';
  } catch {
    // noop
  }
}

function extractFromExpoConstants() {
  type ExpoConstants = {
    nativeAppVersion: string | null;
    nativeBuildVersion: string | null;
  };

  try {
    const constants = dangerouslyGetModule<ExpoConstants>('expo-constants');

    metadata.appVersion =
      constants.nativeAppVersion ?? constants.nativeBuildVersion ?? '';
  } catch {
    // noop
  }
}
