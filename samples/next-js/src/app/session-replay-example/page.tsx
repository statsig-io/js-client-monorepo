import { getStatsigValues } from '../../utils/statsig-server';
import SessionReplayExample from './SessionReplayExample';

export default async function Index(): Promise<JSX.Element> {
  const user = { userID: 'a-user' };
  const values = await getStatsigValues(user, { forceSessionReplay: true });

  return <SessionReplayExample {...{ user, values }} />;
}
