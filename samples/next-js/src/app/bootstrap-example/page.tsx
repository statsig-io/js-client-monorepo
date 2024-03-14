import { getStatsigValues } from '../../utils/statsig-server';
import BootstrapExample from './BootstrapExample';

export default async function Index(): Promise<JSX.Element> {
  const user = { userID: 'a-user' };
  const values = await getStatsigValues(user);
  return <BootstrapExample user={user} values={values} />;
}
