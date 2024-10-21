import { RenderResult, act, render, waitFor } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';
import React from 'react';
import { Link, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { anyObjectContaining } from 'statsig-test-helpers';

import { Log, LogLevel, StatsigClient } from '@statsig/js-client';
import { runStatsigAutoCapture } from '@statsig/web-analytics';

function SimplePage({ name }: { name: string }) {
  return (
    <div>
      <h1 data-testid={`page-name-${name}`}>{name}</h1>
      <ul>
        <li>
          <Link data-testid="home-link" to="/">
            Home
          </Link>
        </li>
        <li>
          <Link data-testid="about-link" to="/about">
            About
          </Link>
        </li>
      </ul>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <SimplePage name="home" />,
  },
  {
    path: 'about',
    element: <SimplePage name="about" />,
  },
]);

describe('AutoCapture Page Views in React SPA', () => {
  let client: StatsigClient;
  let loggerSpy: jest.SpyInstance;
  let result: RenderResult;

  afterAll(() => {
    Log.level = LogLevel.None;
  });

  beforeEach(async () => {
    fetchMock.enableMocks();

    client = new StatsigClient(
      'client-key',
      { userID: 'a-user' },
      { logLevel: 4 },
    );

    loggerSpy = jest.spyOn(client['_logger'], 'enqueue');

    runStatsigAutoCapture(client);
    client.initializeSync();

    result = render(<RouterProvider router={router} />);
  });

  it('logs the initial page view', () => {
    expect(loggerSpy).toHaveBeenCalledWith(
      anyObjectContaining({
        eventName: 'auto_capture::page_view',
        metadata: anyObjectContaining({
          pathname: '/',
        }),
      }),
    );
  });

  it('logs the page view when navigating to /about', async () => {
    loggerSpy.mockClear();

    act(() => {
      result.getByTestId('about-link').click();
    });

    await waitFor(() => result.getByTestId('page-name-about'));

    expect(loggerSpy).toHaveBeenCalledWith(
      anyObjectContaining({
        eventName: 'auto_capture::page_view',
        metadata: anyObjectContaining({
          pathname: '/about',
        }),
      }),
    );
  });
});
