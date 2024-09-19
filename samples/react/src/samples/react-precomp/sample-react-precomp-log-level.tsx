// <snippet>
import { LogLevel, StatsigProvider } from '@statsig/react-bindings';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

const yourUser = { userID: 'a-user' };

// prettier-ignore
export default async function Sample(): Promise<void> {
App();
}

// <snippet>
function App() {
  return (
    <StatsigProvider
      sdkKey={YOUR_CLIENT_KEY}
      user={yourUser}
      options={{
        logLevel: LogLevel.Debug, // <- Print all logs to console
      }}
    >
      <div>...</div>
    </StatsigProvider>
  );
}
// </snippet>
