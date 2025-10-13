export type GateEvaluationV2 = {
  v?: true;
  r?: string | null;
  i?: string;
  s?: string[];
};

export type ExperimentEvaluationV2 = {
  r: string;
  v: string;
  gn?: string | null;
  i?: string;
  s?: string[];
  ue?: true;
  ea?: true;
  p?: true;
};

export type DynamicConfigEvaluationV2 = ExperimentEvaluationV2;

export type LayerEvaluationV2 = {
  r: string;
  v: string;
  gn?: string | null;
  i?: string;
  s?: string[];
  us?: string[];
  ue?: true;
  ea?: true;
  ep?: string[];
  ae?: string;
  pr?: Record<string, string>;
};
