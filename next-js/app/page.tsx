import { EvaluationResponse } from '@sigstat/precomputed-evaluations';

import ClientApp from './ClientApp';

async function getStatsigValues(): Promise<EvaluationResponse> {
  const res = await fetch('http://localhost:4200/api/get_statsig_values');

  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }

  return res.json() as unknown as EvaluationResponse;
}

export default async function Index(): Promise<JSX.Element> {
  const data = await getStatsigValues();
  return <ClientApp values={data} />;
}
