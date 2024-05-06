// <snippet>
import { StatsigClient } from '@statsig/js-client';
import { StatsigProvider, useStatsigUser } from '@statsig/react-bindings';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
App();
}

// <snippet>
const myStatsigClient = new StatsigClient(YOUR_CLIENT_KEY, {
  userID: 'a-user',
});

function UpdateUserButton() {
  const { updateUserSync } = useStatsigUser();

  return <button onClick={() => updateUserSync({ userID: 'b-user' })}></button>;
}

function App() {
  return (
    <StatsigProvider client={myStatsigClient}>
      <UpdateUserButton />
    </StatsigProvider>
  );
}
// </snippet>
