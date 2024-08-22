/* eslint-disable no-console */
import { ReactNode, useEffect } from 'react';

import { AnyStatsigClientEvent } from '@statsig/client-core';
import {
  StatsigProvider,
  useClientAsyncInit,
  useFeatureGate,
  useStatsigClient,
  useStatsigUser,
} from '@statsig/react-bindings';

import { authService } from './samples/react-precomp/sample-react-auth-service';
import {
  LoginForm,
  YOUR_CLIENT_KEY,
} from './samples/react-precomp/sample-react-login';

let renderCount = 0;

function Content() {
  const { client } = useStatsigClient();
  renderCount++;

  const { user } = useStatsigUser();
  const gate = useFeatureGate('third_gate'); // gate passes with non-empty email

  const handleLogout = () => {
    authService.logout();
    client.updateUserSync(authService.getUser());
  };

  return (
    <div>
      <p>Render Count: {renderCount}</p>
      <p>UserID: {!user.userID ? 'N/A' : user.userID}</p>
      <p>
        Gate: {gate.value ? 'Passing' : 'Failing'} ({gate.details.reason})
      </p>

      <LoginForm />

      <button disabled={user.userID === ''} onClick={() => handleLogout()}>
        Logout
      </button>
    </div>
  );
}

export default function TransitionToLoggedInExample(): ReactNode {
  const { client, isLoading } = useClientAsyncInit(
    YOUR_CLIENT_KEY,
    authService.getUser(),
  );

  useEffect(() => {
    const onAnyClientEvent = (event: AnyStatsigClientEvent) =>
      console.log(event);
    client.on('*', onAnyClientEvent);
    return () => client.off('*', onAnyClientEvent);
  }, [client]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}
