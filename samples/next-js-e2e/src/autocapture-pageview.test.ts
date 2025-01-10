import { Page, expect, test } from '@playwright/test';

import { StatsigEvent } from '@statsig/client-core';

async function waitForNextLogEventRequest(page: Page) {
  const regex = /v1\/rgstr/;
  await page.waitForRequest(regex);
}

test.describe('AutoCapture - PageViews', () => {
  let events = [] as StatsigEvent[];

  const eventContaining = (
    eventName: string,
    metadata: Record<string, unknown>,
  ) => {
    return expect.objectContaining({
      eventName,
      metadata: expect.objectContaining(metadata),
    });
  };

  test.beforeEach(async ({ page }) => {
    page.on('request', (request) => {
      if (request.url().includes('/v1/rgstr')) {
        events.push(...request.postDataJSON().events);
      }
    });

    events = [];
  });

  test('logging page view events when navigating via a link', async ({
    page,
  }) => {
    await page.goto('/session-replay-example');
    await waitForNextLogEventRequest(page);

    expect(events).toContainEqual(
      eventContaining('auto_capture::page_view', {
        page_url: expect.stringContaining('/session-replay-example'),
      }),
    );

    events = [];

    await page.click('#sub-page-link');
    await waitForNextLogEventRequest(page);

    expect(events).toContainEqual(
      eventContaining('auto_capture::page_view_end', {
        page_url: expect.stringContaining('/session-replay-example'),
      }),
    );

    expect(events).toContainEqual(
      eventContaining('auto_capture::page_view', {
        page_url: expect.stringContaining('/session-replay-example/sub-page'),
      }),
    );
  });

  test('logging page view events when navigating back', async ({ page }) => {
    await page.goto('/session-replay-example');
    await waitForNextLogEventRequest(page);

    await page.click('#sub-page-link');
    await waitForNextLogEventRequest(page);

    events = [];

    await page.goBack();
    expect(await page.locator('a').getAttribute('href')).toContain(
      '/session-replay-example/sub-page',
    );
    await waitForNextLogEventRequest(page);

    expect(events).toContainEqual(
      eventContaining('auto_capture::page_view_end', {
        page_url: expect.stringContaining('/session-replay-example/sub-page'),
      }),
    );

    expect(events).toContainEqual(
      eventContaining('auto_capture::page_view', {
        page_url: expect.stringContaining('/session-replay-example'),
      }),
    );
  });

  test('logging page view events when navigating away', async ({ page }) => {
    await page.goto('/session-replay-example');
    await waitForNextLogEventRequest(page);

    events = [];

    await page.click('#leave-button');
    await waitForNextLogEventRequest(page);

    expect(events).toContainEqual(
      eventContaining('auto_capture::page_view_end', {
        page_url: expect.stringContaining('/session-replay-example'),
      }),
    );
  });
});
