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
// Get the boolean value for a gate
const gateValue = useGateValue('my_gate');

// or, get the gate with attached metadata
const gate = useFeatureGate('my_gate')

// or, get the checkGate function
const { checkGate } = useStatsigClient();

return <div>
  {gateValue && <p>Passing</p>}

  {gate.value && <p>Passing {gate.details.reason}</p>}

  {checkGate('my_gate') && <p>Passing</p>}
</div>;
// </snippet>
}
