import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { Box } from '@mui/material';
import { ReactNode, StrictMode, lazy } from 'react';
import * as ReactDOM from 'react-dom/client';
import {
  RouteObject,
  RouterProvider, // createBrowserRouter,
  createBrowserRouter,
} from 'react-router-dom';

import LeftRail from './LeftRail';

type ComponentResolver = () => Promise<{ default: () => ReactNode }>;
type RouteMap = [string, string, ComponentResolver | RouteMap][];

// prettier-ignore
const routes: RouteMap = [
  ['/', 'Home', () => import('./HomePage')],
  [
    '/examples', '',
    [
      ['/precomputed-eval-performance', 'Precomputed Client Perf', () => import('./PrecomputedClientPerfExamplePage')],
      ['/on-device-eval-performance', 'On Device Client Perf', () => import('./OnDeviceClientPerfExamplePage')],
      ['/bundle-size', 'Bundle Size', () => import('./BundleSizeExamplePage')],
      ['/updating-user', 'UpdatingUser', () => import('./UpdatingUserExamplePage')],
      ['/delayed-init', 'Delayed Network Init', () => import('./DelayedNetworkInitExamplePage')],
      ['/client-event-stream', 'Client Event Stream', () => import('./ClientEventStreamExamplePage')],
      ['/transition-to-logged-in', 'Transition To Logged In', () => import('./TransitionToLoggedInExamplePage')],
      ['/samples', 'Samples', () => import('./SamplesPage')]
    ],
  ],
];

const routeResolver = (
  path: string,
  title: string,
  resolverOrMap: ComponentResolver | RouteMap,
): (RouteObject & { path: string; title: string })[] => {
  if (typeof resolverOrMap !== 'function') {
    return resolverOrMap.flatMap((entry) =>
      routeResolver(`${path}${entry[0]}`, entry[1], entry[2]),
    );
  }

  const Comp = lazy(resolverOrMap);
  return [
    {
      path,
      title,
      element: <Comp />,
    },
  ];
};

const resolvedRoutes = routes.flatMap((entry) =>
  routeResolver(entry[0], entry[1], entry[2]),
);
const router = createBrowserRouter(resolvedRoutes);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

function App() {
  return (
    <Box
      width="100vw"
      minHeight="100vh"
      position="relative"
      display="flex"
      justifyContent="flex-start"
    >
      <LeftRail routes={resolvedRoutes} />
      <Box
        flex={1}
        padding="16px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box>
          <RouterProvider router={router} />
        </Box>
      </Box>
    </Box>
  );
}

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
