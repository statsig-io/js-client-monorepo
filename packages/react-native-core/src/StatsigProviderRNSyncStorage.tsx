import { StatsigProvider, StatsigProviderProps } from '@statsig/react-bindings';

export function StatsigProviderRNSyncStorage(
  props: StatsigProviderProps,
): JSX.Element | null {
  return <StatsigProvider {...props} />;
}
