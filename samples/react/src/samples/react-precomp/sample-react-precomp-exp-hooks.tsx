// <snippet>
import { useExperiment, useStatsigClient } from '@statsig/react-bindings';

// •••

// </snippet>

export default async function Sample(): Promise<void> {
  App();
}

// prettier-ignore
function App() {
// <snippet>
// a get the getExperiment function, which wont trigger an exposure until it is called
const { getExperiment } = useStatsigClient();

// Get the Experiment value
const experiment = useExperiment('my_experiment');



return <div>
  <p>GroupName: { getExperiment('my_experiment').groupName } </p>
  <p>Reason: {experiment.details.reason}</p>
  <p>Value: { experiment.get("a_value", "fallback_value") }</p>
</div>;
// </snippet>
}
