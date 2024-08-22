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
App();
}

// <snippet>
function Content() {
  const gate = useFeatureGate('a_gate');

  return <div>a_gate: {gate.value ? 'Passing' : 'Failing'}</div>;
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
