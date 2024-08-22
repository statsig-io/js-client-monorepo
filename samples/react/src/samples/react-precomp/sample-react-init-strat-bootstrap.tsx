/* eslint-disable no-console */

/* eslint-disable @typescript-eslint/no-inferrable-types */
// <snippet>
import {
  StatsigProvider,
  useClientBootstrapInit,
  useFeatureGate,
} from '@statsig/react-bindings';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
console.log(App);
}

// <snippet>
const myBootstrapValues: string = '...'; // Retrieved from a Statsig Server SDK

function Content() {
  const gate = useFeatureGate('a_gate');

  return <div>Reason: {gate.details.reason}</div>; // Reason: Bootstrap
}

function App() {
  const { client } = useClientBootstrapInit(
    YOUR_CLIENT_KEY,
    {
      userID: 'a-user',
    },
    myBootstrapValues,
  );

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
// </snippet>
