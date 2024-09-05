/* eslint-disable no-console */
import { useState } from 'react';

import {
  StatsigProvider,
  useClientAsyncInit,
  useStatsigClient,
  useStatsigUser,
} from '@statsig/react-bindings';

import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';
import { authService } from './sample-react-auth-service';

export { YOUR_CLIENT_KEY };

// prettier-ignore
export default async function Sample(): Promise<void> {
console.log(App)
}

// prettier-ignore
// <snippet>
function LoginForm(): JSX.Element {
  const { user } = useStatsigUser();
  const {client} = useStatsigClient();

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
        await client.dataAdapter.prefetchData(authorizedUser);

        // </snippet>
        const actual = authorizedUser;
        authorizedUser = { userID: 'dummy' };
        // <snippet>
        // or, bootstrap with data from your own backend
        client.dataAdapter.setData(bootstrapData);

        // </snippet>
        authorizedUser = actual;
        // <snippet>
        // then update synchronously
        client.updateUserSync(authorizedUser);
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
  const { client, isLoading } = useClientAsyncInit(
    YOUR_CLIENT_KEY,
    authService.getUser(),
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <StatsigProvider client={client}>
      <LoginForm />
    </StatsigProvider>
  );
}
// </snippet>

export { LoginForm };
