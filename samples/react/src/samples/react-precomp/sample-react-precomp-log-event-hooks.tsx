// <snippet>
import { useStatsigClient } from '@statsig/react-bindings';

// •••

// </snippet>

export default async function Sample(): Promise<void> {
  App();
}

// prettier-ignore
function App() {
// <snippet>
const { logEvent } = useStatsigClient();

return <button onClick={() => logEvent("my_event")}>Click Me</button>;
// </snippet>
}
