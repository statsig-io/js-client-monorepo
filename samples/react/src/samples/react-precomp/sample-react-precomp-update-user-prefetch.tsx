/* eslint-disable no-console */
// <snippet>
import { StatsigClient } from '@statsig/js-client';
import { StatsigProvider, useStatsigClient } from '@statsig/react-bindings';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default async function Sample(): Promise<void> {
  console.log(App);
}

// <snippet>

// Login Button

function LoginButton() {
  const { client } = useStatsigClient();

  const handleLogin = () => {
    const updatedUser = { userID: 'updated-user' };

    client.updateUserSync(updatedUser); // Immediate switch to cached values

    client.dataAdapter
      .prefetchData(updatedUser) // Refreshes cache for updated-user
      .catch((err) => console.log(err))
      .finally(() => {
        client.updateUserSync(updatedUser); // Switch to the prefetched cache values
      });
  };

  return <button onClick={() => handleLogin()}>Login</button>;
}

// App

const myStatsigClient = new StatsigClient(YOUR_CLIENT_KEY, {
  userID: 'initial-user',
});
myStatsigClient.initializeSync();

function App() {
  return (
    <StatsigProvider client={myStatsigClient}>
      <LoginButton />
    </StatsigProvider>
  );
}
// </snippet>
