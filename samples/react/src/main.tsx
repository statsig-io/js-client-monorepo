import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import React, { ReactNode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import LeftRail from './LeftRail';

const routes: [string, Promise<{ default: () => ReactNode }>][] = [
  ['/', import('./HomePage')],
  ['/examples/multiple-clients', import('./MultiClientExamplePage')],
  [
    '/examples/precomputed-eval-performance',
    import('./PrecomputedClientPerfExamplePage'),
  ],
  [
    '/examples/on-device-eval-performance',
    import('./OnDeviceClientPerfExamplePage'),
  ],
  ['/examples/bundle-size', import('./BundleSizeExamplePage')],
];

const router = createBrowserRouter(
  routes.map(([path, mod]) => {
    const Comp = React.lazy(() => mod);
    return {
      path,
      element: <Comp />,
    };
  }),
);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

function App() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        position: 'relative',
        width: '100vw',
        minHeight: '100vh',
      }}
    >
      <LeftRail />
      <div style={{ padding: '16px' }}>
        <RouterProvider router={router} />
      </div>
    </div>
  );
}

root.render(<App />);
