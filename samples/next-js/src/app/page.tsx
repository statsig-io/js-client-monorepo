import { getStatsigValues } from '../utils/get-statsig-values';
import ClientApp from './client-app';

export default async function Index(): Promise<JSX.Element> {
  const user = { userID: 'first-user' };
  const values = await getStatsigValues(user);
  return <ClientApp user={user} values={values} />;
}
