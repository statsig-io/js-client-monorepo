import { GetServerSidePropsContext } from 'next';

import { useFeatureGate, useLayer } from '@statsig/react-bindings';

import {
  StatsigServerProps,
  getStatsigServerProps,
} from '../lib/statsig-backend-core';

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
): Promise<{
  props: {
    statsigProps: StatsigServerProps;
  };
}> => {
  return { props: { statsigProps: await getStatsigServerProps(context) } };
};

export default function Home(): React.ReactElement {
  const gate = useFeatureGate('a_gate');
  const layer = useLayer('a_layer');

  return (
    <>
      <div>
        <p>
          Gate: {gate.value ? 'Pass' : 'Fail'} ({gate.details.reason})
        </p>
        <p>
          Layer: {layer.get('a_string', 'fallback string')} (
          {gate.details.reason})
        </p>
      </div>
    </>
  );
}
