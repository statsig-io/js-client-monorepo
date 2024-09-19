// <snippet>
import { useStatsigClient } from '@statsig/react-bindings';

function MyComponent() {
  const { client } = useStatsigClient();
  const context = client.getContext();

  return <div>{context.stableID}</div>;
}
// </snippet>

// eslint-disable-next-line no-console
console.log(MyComponent);
