import React from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

const HomePage = React.lazy(() => import('./HomePage'));
const MultiClientExamplePage = React.lazy(
  () => import('./MultiClientExamplePage'),
);
const PrecomputedClientPerfExamplePage = React.lazy(
  () => import('./PrecomputedClientPerfExamplePage'),
);
const OnDeviceClientPerfExamplePage = React.lazy(
  () => import('./OnDeviceClientPerfExamplePage'),
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/examples/multiple-clients',
    element: <MultiClientExamplePage />,
  },
  {
    path: '/examples/precomputed-eval-performance',
    element: <PrecomputedClientPerfExamplePage />,
  },
  {
    path: '/examples/on-device-eval-performance',
    element: <OnDeviceClientPerfExamplePage />,
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(<RouterProvider router={router} />);
