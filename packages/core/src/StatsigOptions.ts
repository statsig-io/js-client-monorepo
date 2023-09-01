export type StatsigEnvironment = {
  tier?: string;
  [key: string]: string | undefined;
};

export type StatsigOptions = {
  api: string;
  localMode?: boolean;
  environment?: StatsigEnvironment;
};
