// <snippet>
import * as React from 'react';

import { StatsigProvider } from '@statsig/react-bindings';
import { StatsigAutoCapturePlugin } from '@statsig/web-analytics';

// </snippet>
import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// prettier-ignore
export default function Sample(): React.ReactElement {
// <snippet>
  return (
    <StatsigProvider
      sdkKey={YOUR_CLIENT_KEY}
      user={{ userID: 'a-user' }}
      loadingComponent={
        <div style={{ height: 100, width: 300, padding: 16 }}>Loading...</div>
      }
      options={{ plugins: [ new StatsigAutoCapturePlugin() ] }}>
      <div>Hello</div>
    </StatsigProvider>
  );
// </snippet>
}
