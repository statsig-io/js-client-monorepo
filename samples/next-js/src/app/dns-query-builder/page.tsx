import * as React from 'react';

import DnsQueryBuilder from './DnsQueryBuilder';

export default async function Index(): Promise<React.ReactElement> {
  return <DnsQueryBuilder />;
}
