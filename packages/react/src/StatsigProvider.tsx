import { StatsigClient } from '@statsig/core';
import React, { useEffect, useState } from 'react';
import StatsigContext from './StatsigContext';

type Props = {
  client: StatsigClient;
  children: React.ReactNode | React.ReactNode[];
};

export default function StatsigProvider({
  client,
  children,
}: Props): JSX.Element {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    client
      .initialize({})
      .then(() => {
        setVersion(version + 1);
      })
      .catch(() => {});
  }, [client]);

  return (
    <StatsigContext.Provider value={{ client, version }}>
      {children}
    </StatsigContext.Provider>
  );
}
