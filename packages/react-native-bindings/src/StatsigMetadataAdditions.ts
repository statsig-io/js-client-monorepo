import { NativeModules, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import { StatsigMetadataProvider } from '@sigstat/core';

type I18nManager = { localIdentifer: string };
type SettingsManager = {
  settings?: { AppLocale?: string; AppleLanguages?: string[] };
};

let locale = '';

if (Platform.OS === 'android') {
  const i18nManager = NativeModules['I18nManager'] as I18nManager | undefined;

  locale = i18nManager?.localIdentifer ?? '';
}

if (Platform.OS === 'ios') {
  const settingsManager = NativeModules['SettingsManager'] as
    | SettingsManager
    | undefined;

  const settings = settingsManager?.settings;

  locale = settings?.AppLocale ?? settings?.AppleLanguages?.[0] ?? '';
}

StatsigMetadataProvider.add({
  appVersion: DeviceInfo.getVersion() ?? '',
  systemVersion: DeviceInfo.getSystemVersion() ?? '',
  systemName: DeviceInfo.getSystemName() ?? '',
  deviceModelName: DeviceInfo.getModel() ?? '',
  deviceModel: DeviceInfo.getDeviceId() ?? '',
  locale,
});
