import { myStatsigClient } from './sample-precomp-instance';

// prettier-ignore
export default async function Sample(): Promise<void> {
// <snippet>
if (myStatsigClient.checkGate("new_homepage_design")) {
  // Gate is on, show new home page
} else {
  // Gate is off, show old home page
}
// </snippet>
}
