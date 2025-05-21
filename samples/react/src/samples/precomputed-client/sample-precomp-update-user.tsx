import { myStatsigClient } from './sample-precomp-instance';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
const user = { userID: 'a-user' };

// update and wait for the latest values
await myStatsigClient.updateUserAsync(user);
// </snippet>
}
