import { myStatsigClient } from './sample-precomp-instance';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
const user = { userID: 'a-user' };

// update immediately from cache values
myStatsigClient.updateUserSync(user);

// or, update and wait for the latest values
await myStatsigClient.updateUserAsync(user);
// </snippet>
}
