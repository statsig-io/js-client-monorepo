import { myStatsigClient } from './sample-precomp-instance';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
// timeouts during initialization
await myStatsigClient.initializeAsync({ timeoutMs: 1000 });

// timeouts during user updates
await myStatsigClient.updateUserAsync(
  { userID: 'a-user' },
  { timeoutMs: 1000 },
);
// </snippet>
}
