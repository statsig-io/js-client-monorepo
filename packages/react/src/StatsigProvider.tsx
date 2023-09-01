import { StatsigClient } from '@monorepo/core';

type Props = {
  client: StatsigClient;
};

function Foo() {
  return <div></div>;
}

export function StatsigProvider(props: Props): JSX.Element {
  return (
    <>
      <Foo />
      {JSON.stringify(props.client)}
    </>
  );
}
