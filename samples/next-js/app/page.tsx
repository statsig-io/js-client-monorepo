import { getStatsigValues } from '../utils/get-statsig-values';
import ClientApp from './ClientApp';

export default async function Index(): Promise<JSX.Element> {
  const values = await getStatsigValues();
  return <ClientApp values={values} />;
}
