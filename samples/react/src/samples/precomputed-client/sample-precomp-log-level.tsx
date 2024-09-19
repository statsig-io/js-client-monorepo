/* eslint-disable no-console */
// <snippet>
import { LogLevel, StatsigClient } from '@statsig/js-client';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

const yourUser = { userID: 'a-user' };

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
const myStatsigClient = new StatsigClient(
  YOUR_CLIENT_KEY, 
  yourUser,
  { logLevel: LogLevel.Debug } // <- Print all logs to console
);
// </snippet>

console.log(myStatsigClient);
}
