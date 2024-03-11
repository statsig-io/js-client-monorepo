import { ReactNode } from 'react';

import {
  StatsigProvider,
  useGate,
  useStatsigUser,
} from '@statsig/react-bindings';

import { authService } from './samples/react-precomp/sample-react-auth-service';
import {
  LoginForm,
  loginSampleClient,
} from './samples/react-precomp/sample-react-login';

// eslint-disable-next-line no-console
loginSampleClient.on('*', (data) => console.log(data));

let renderCount = 0;

function Content() {
  renderCount++;

  const { user } = useStatsigUser();
  const gate = useGate('third_gate'); // gate passes with non-empty email

  const handleLogout = () => {
    authService.logout();
    loginSampleClient.updateUserSync(authService.getUser());
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
  return (
    <StatsigProvider client={loginSampleClient}>
      <Content />
    </StatsigProvider>
  );
}
