import * as React from 'react';

import { getSpecs } from '../../utils/statsig-server';
import OnDeviceEvalAdapterExample from './OnDeviceEvalAdapterExample';

export default async function Index(): Promise<React.ReactElement> {
  const specs = await getSpecs();
  return <OnDeviceEvalAdapterExample specs={specs} />;
}
