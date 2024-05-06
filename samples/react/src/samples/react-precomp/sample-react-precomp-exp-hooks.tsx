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
// Get the Experiment value
const experiment = useExperiment('my_experiment');

// or, get the getExperiment function
const { getExperiment } = useStatsigClient();

return <div>
  <p>Reason: {experiment.details.reason}</p>
  <p>Value: { experiment.get("a_value", "fallback_value") }</p>

  <p>GroupName: { getExperiment('my_experiment').groupName } </p>
</div>;
// </snippet>
}
