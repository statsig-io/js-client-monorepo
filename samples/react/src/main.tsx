import React, { Suspense } from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

const HomePage = React.lazy(() => import('./HomePage'));
const MultiClientDemoPage = React.lazy(() => import('./MultiClientDemoPage'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/examples/multiple-clients',
    element: <MultiClientDemoPage />,
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(<RouterProvider router={router} />);
