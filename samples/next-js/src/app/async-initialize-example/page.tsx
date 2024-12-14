import * as React from 'react';

import AsyncInitializeExample from './AsyncInitializeExample';

export default async function Index(): Promise<React.ReactElement> {
  return <AsyncInitializeExample />;
}
