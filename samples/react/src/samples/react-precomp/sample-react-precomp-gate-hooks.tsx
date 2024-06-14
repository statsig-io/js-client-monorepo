// <snippet>
import {
  useFeatureGate,
  useGateValue,
  useStatsigClient,
} from '@statsig/react-bindings';

// •••

// </snippet>

export default async function Sample(): Promise<void> {
  App();
}

// prettier-ignore
function App() {
// <snippet>
// a checkGate function, which wont trigger an exposure until it is called
const { checkGate } = useStatsigClient();

// Get the boolean value for a gate
const gateValue = useGateValue('my_gate');

// or, get the gate with attached metadata
const gate = useFeatureGate('my_gate')



return <div>
  {checkGate('my_gate') && <p>Passing</p>}

  {gateValue && <p>Passing</p>}

  {gate.value && <p>Passing {gate.details.reason}</p>}
</div>;
// </snippet>
}
