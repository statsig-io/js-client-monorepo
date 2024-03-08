/* eslint-disable @typescript-eslint/no-unused-vars */
import { myStatsigClient } from './sample-precomp-instance';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
await myStatsigClient.shutdown();
// </snippet>
}
