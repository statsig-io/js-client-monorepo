import { StatsigClientInterface } from './ClientInterfaces';

export type StatsigPlugin<T extends StatsigClientInterface> = {
  readonly __plugin:
    | 'session-replay'
    | 'auto-capture'
    | 'triggered-session-replay';

  bind: (client: T) => void;
};
