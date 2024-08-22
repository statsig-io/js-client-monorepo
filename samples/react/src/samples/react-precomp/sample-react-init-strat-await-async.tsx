/* eslint-disable no-console */

/* eslint-disable @typescript-eslint/no-inferrable-types */
// <snippet>
import {
  StatsigProvider,
  useClientAsyncInit,
  useFeatureGate,
} from '@statsig/react-bindings';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
console.log(App);
}

// <snippet>
function Content() {
  const gate = useFeatureGate('a_gate');

  return <div>Reason: {gate.details.reason}</div>; // Reason: Network or NetworkNotModified
}

function App() {
  const { client, isLoading } = useClientAsyncInit(YOUR_CLIENT_KEY, {
    userID: 'a-user',
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
// </snippet>
