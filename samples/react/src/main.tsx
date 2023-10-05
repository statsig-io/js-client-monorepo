import React, { ReactNode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

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
root.render(<RouterProvider router={router} />);
