// <snippet>
import { useLayer, useStatsigClient } from '@statsig/react-bindings';

// •••

// </snippet>
export default async function Sample(): Promise<void> {
  App();
}

// prettier-ignore
function App() {
// <snippet>
// Get the Layer value
const layer = useLayer('my_layer');

// or, get the getLayer function
const { getLayer } = useStatsigClient();

return <div>
  <p>Reason: {layer.details.reason}</p>
  <p>Value: { layer.get("a_value", "fallback_value") }</p>

  <p>GroupName: { getLayer('my_layer').groupName } </p>
</div>;
// </snippet>
}
