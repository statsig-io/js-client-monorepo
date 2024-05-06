// <snippet>
import { useDynamicConfig, useStatsigClient } from '@statsig/react-bindings';

// •••

// </snippet>
export default async function Sample(): Promise<void> {
  App();
}

// prettier-ignore
function App() {
// <snippet>
// Get the DynamicConfig value
const config = useDynamicConfig('my_dynamic_config');

// or, get the getDynamicConfig function
const { getDynamicConfig } = useStatsigClient();

return <div>
  <p>Reason: {config.details.reason}</p>
  <p>Value: { config.get("a_value", "fallback_value") }</p>

  <p>Another Value: { getDynamicConfig('my_dynamic_config').get("a_bool", false) } </p>
</div>;
// </snippet>
}
