import { nativeApplicationVersion } from 'expo-application';
import { modelId, modelName, osName, osVersion } from 'expo-device';
import { NativeModules, Platform } from 'react-native';

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

export function GetStatsigMetadataAdditions(): Record<
  string,
  string | undefined
> {
  return {
    appVersion: nativeApplicationVersion ?? undefined,
    systemVersion: osVersion ?? undefined,
    systemName: osName ?? undefined,
    deviceModelName: modelName ?? undefined,
    deviceModel: modelId != null ? String(modelId) : undefined,
    locale,
  };
}
