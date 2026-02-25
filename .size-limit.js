module.exports = [
  {
    name: 'statsig-js-client',
    limit: '19.5 kB', // hard limit! please do not adjust
    path: 'dist/packages/combo/build/js-client/statsig-js-client.min.js',
    import: '{ StatsigClient }',
    running: false,
  },
  {
    name: 'statsig-js-client + web-analytics',
    limit: '30 kB',
    path: 'dist/packages/combo/build/js-client/statsig-js-client+web-analytics.min.js',
    import: '{ StatsigClient }',
    running: false,
  },
  {
    name: 'statsig-js-client + session-replay',
    limit: '59 kB',
    path: 'dist/packages/combo/build/js-client/statsig-js-client+session-replay.min.js',
    import: '{ StatsigClient }',
    ignore: ['rrwebRecord'],
    running: false,
  },
  {
    name: 'statsig-js-client + session-replay + web-analytics',
    limit: '68 kB',
    path: 'dist/packages/combo/build/js-client/statsig-js-client+session-replay+web-analytics.min.js',
    import: '{ StatsigClient }',
    ignore: ['rrwebRecord'],
    running: false,
  },
  // On Device Eval
  {
    name: 'statsig-js-on-device-eval-client.min.js',
    limit: '22.5 kB',
    path: 'dist/packages/combo/build/js-on-device-eval-client/statsig-js-on-device-eval-client.min.js',
    import: '{ StatsigClient }',
    ignore: ['rrwebRecord'],
    running: false,
  },
];
