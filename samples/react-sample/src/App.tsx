import '@statsig/extensions';
import { StatsigProvider, useGate } from '@statsig/react';
import { StatsigRemoteEvalClient } from '@statsig/remote-eval';
import './App.css';
import useExperiment from '@statsig/react/build/useExperiment';
import useLayer from '@statsig/react/build/useLayer';

const client = new StatsigRemoteEvalClient(
  'client-wlH3WMkysINMhMU8VrNBkbjrEr2JQrqgxKwDPOUosJK',
);

client.overrideGate('test_public', true);
client.overrideExperiment('an_experiment', {
  experiment_val: 'foo',
});
client.overrideLayer('a_layer', { layer_val: 'bar' });

const Content = () => {
  const { value } = useGate('test_public');
  const { experiment } = useExperiment('an_experiment');
  const { layer } = useLayer('a_layer');

  return (
    <div>
      <div>test_public: {value ? 'Pass' : 'Fail'}</div>
      <div>an_experiment: {JSON.stringify(experiment)}</div>
      <div>a_layer: {JSON.stringify(layer)}</div>
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
