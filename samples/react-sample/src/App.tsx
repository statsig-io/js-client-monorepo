import '@statsig-client/extensions';
import { StatsigProvider, useGate } from '@statsig-client/react';
import { StatsigRemoteEvalClient } from '@statsig-client/remote-eval';
import './App.css';

const client = new StatsigRemoteEvalClient(
  'client-wlH3WMkysINMhMU8VrNBkbjrEr2JQrqgxKwDPOUosJK',
  { userID: 'a-user' },
);

client.overrideGate('test_override', true);

const Content = () => {
  const { value: publicValue } = useGate('test_public');
  const { value: overrideValue } = useGate('test_override');

  return (
    <div className="Content">
      <div>test_public: {publicValue ? 'Pass' : 'Fail'}</div>
      <div>test_override: {overrideValue ? 'Pass' : 'Fail'}</div>
    </div>
  );
};

function App() {
  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}

export default App;
