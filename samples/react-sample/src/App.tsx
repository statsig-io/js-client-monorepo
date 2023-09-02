import { StatsigClient } from '@statsig/core';
import { StatsigProvider, useGate } from '@statsig/react';
import './App.css';

const client = new StatsigClient(
  'client-wlH3WMkysINMhMU8VrNBkbjrEr2JQrqgxKwDPOUosJK',
);

function Content() {
  const { value } = useGate('test_public');

  return <>test_public: {value ? 'Pass' : 'Fail'}</>;
}

function App() {
  return (
    <StatsigProvider client={client}>
      <Content />
    </StatsigProvider>
  );
}

export default App;
