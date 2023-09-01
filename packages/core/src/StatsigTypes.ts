export type DynamicConfig = {
  readonly name: string;
  readonly ruleID: string;
  readonly value: Record<string, unknown>;
};

export type Experiment = DynamicConfig;

export type Layer = Omit<DynamicConfig, 'value'> & {
  readonly getValue: (parameterName: string) => unknown;
};
