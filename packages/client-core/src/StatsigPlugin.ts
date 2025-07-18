import { StatsigClientInterface } from './ClientInterfaces';

export type StatsigPlugin<T extends StatsigClientInterface> = {
  readonly __plugin:
    | 'session-replay'
    | 'auto-capture'
    | 'triggered-session-replay'
    | 'cli-session-replay-node'
    // eslint-disable-next-line @typescript-eslint/ban-types
    | (string & {});

  bind: (client: T) => void;
};
