/* eslint-disable no-console */
import { myStatsigClient } from './sample-precomp-instance';

// <snippet>
const context = myStatsigClient.getContext();
console.log('Statsig StableID:', context.stableID);
// </snippet>
