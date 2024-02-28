import { NativeModules, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import { StatsigMetadataProvider } from '@statsig/client-core';

type I18nManager = { localIdentifer: string };
type SettingsManager = {
  settings?: { AppLocale?: string; AppleLanguages?: string[] };
};

let locale: string | undefined = undefined;

if (Platform.OS === 'android') {
  const i18nManager = NativeModules['I18nManager'] as I18nManager | undefined;

  locale = i18nManager?.localIdentifer ?? undefined;
}

if (Platform.OS === 'ios') {
  const settingsManager = NativeModules['SettingsManager'] as
    | SettingsManager
    | undefined;

  const settings = settingsManager?.settings;

  locale = settings?.AppLocale ?? settings?.AppleLanguages?.[0] ?? undefined;
}

StatsigMetadataProvider.add({
  appVersion: DeviceInfo.getVersion() ?? undefined,
  systemVersion: DeviceInfo.getSystemVersion() ?? undefined,
  systemName: DeviceInfo.getSystemName() ?? undefined,
  deviceModelName: DeviceInfo.getModel() ?? undefined,
  deviceModel: DeviceInfo.getDeviceId() ?? undefined,
  locale,
});
