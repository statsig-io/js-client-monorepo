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
// get the getLayer function
const { getLayer } = useStatsigClient();
// or, just get the Layer value
const layer = useLayer('my_layer');

return <div>
  <p>GroupName: { getLayer('my_layer').groupName } </p>
  <p>Reason: {layer.details.reason}</p>
  {/* layer exposures are not logged until you get a value */}
  <p>Value: { layer.get("a_value", "fallback_value") }</p> 
</div>;
// </snippet>
}
