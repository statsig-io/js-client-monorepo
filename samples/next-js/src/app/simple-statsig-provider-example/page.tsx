import * as React from 'react';

import ClientComponent from './ClientComponent';

export default async function Index(): Promise<React.ReactElement> {
  return <ClientComponent />;
}
