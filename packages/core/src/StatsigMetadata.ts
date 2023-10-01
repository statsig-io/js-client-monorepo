const SDK_VERSION = '0.0.5';

export type StatsigMetadata = {
  readonly [key: string]: string;
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

let metadata: StatsigMetadata = {
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

export const StatsigMetadata = {
  get: (): StatsigMetadata => metadata,
  add: (additions: { [key: string]: string }): void => {
    metadata = { ...metadata, ...additions };
  },
};

// function extractFromReactNativeDeviceInfo() {
//   type ReactNativeDeviceInfo = {
//     getVersion: () => string | null;
//     getSystemVersion: () => string | null;
//     getSystemName: () => string | null;
//     getModel: () => string | null;
//     getDeviceId: () => string | null;
//   };

//   dangerouslyGetModule<ReactNativeDeviceInfo>()
//     .then((info) => {
//       metadata.appVersion = info?.getVersion() ?? '';
//       metadata.systemVersion = info?.getSystemVersion() ?? '';
//       metadata.systemName = info?.getSystemName() ?? '';
//       metadata.deviceModelName = info?.getModel() ?? '';
//       metadata.deviceModel = info?.getDeviceId() ?? '';
//     })
//     .catch(() => {
//       // noop
//     });
// }

// function extractFromExpoDevice() {
//   type ExpoDevice = {
//     osVersion: string | null;
//     osName: string | null;
//     modelName: string | null;
//     modelId: string | null;
//   };

//   try {
//     const device = dangerouslyGetModule<ExpoDevice>('expo-device');

//     metadata.systemVersion = device.osVersion ?? '';
//     metadata.systemName = device.osName ?? '';
//     metadata.deviceModelName = device.modelName ?? '';
//     metadata.deviceModel = device.modelId ?? '';
//   } catch {
//     // noop
//   }
// }

// function extractFromExpoConstants() {
//   type ExpoConstants = {
//     nativeAppVersion: string | null;
//     nativeBuildVersion: string | null;
//   };

//   try {
//     const constants = dangerouslyGetModule<ExpoConstants>('expo-constants');

//     metadata.appVersion =
//       constants.nativeAppVersion ?? constants.nativeBuildVersion ?? '';
//   } catch {
//     // noop
//   }
// }
