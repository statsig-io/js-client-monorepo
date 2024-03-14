import { useState } from 'react';

import { StatsigClient } from '@statsig/js-client';
import { StatsigProvider, useStatsigUser } from '@statsig/react-bindings';

import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';
import { authService } from './sample-react-auth-service';

// prettier-ignore
export default async function Sample(): Promise<void> {
App();
}

const myStatsigClient = new StatsigClient(
  YOUR_CLIENT_KEY,
  authService.getUser(),
);

const dataAdapter = myStatsigClient.dataAdapter;
myStatsigClient.initializeSync();

// prettier-ignore
// <snippet>
function LoginForm(): JSX.Element {
  const { user } = useStatsigUser();
  const [authData, setAuthData] = useState({
    email: user.email ?? '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    setIsLoading(true); // show some loading state

    authService
      .login(authData)
      .then(async ({ authorizedUser, bootstrapData }) => {
        // prefetch data from Statsig
        await dataAdapter.prefetchData(authorizedUser);

        // </snippet>
        const actual = authorizedUser;
        authorizedUser = { userID: 'dummy' };
        // <snippet>
        // or, bootstrap with data from your own backend
        dataAdapter.setData(bootstrapData, authorizedUser);

        // </snippet>
        authorizedUser = actual;
        // <snippet>
        // then update synchronously
        myStatsigClient.updateUserSync(authorizedUser);
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* login form */}
      {/* </snippet> */}
      <label>
        Email:
        <input
          placeholder="sample@email.com"
          disabled={isLoading}
          type="text"
          value={authData.email}
          onChange={(e) =>
            setAuthData((old) => ({ ...old, email: e.target.value }))
          }
        />
      </label>

      <button disabled={isLoading} type="submit">
        Login
      </button>
      {/* <snippet> */}
    </form>
  );
}

function App() {
  return (
    <StatsigProvider client={myStatsigClient}>
      <LoginForm />
    </StatsigProvider>
  );
}
// </snippet>

const loginSampleClient = myStatsigClient;
export { LoginForm, loginSampleClient };
