import * as React from 'react';

export default function Index(): React.ReactElement {
  return (
    <div>
      <h1>Samples</h1>
      <ul>
        <li>
          <button>
            <a href="/bootstrap-example">Server Side Render</a>
          </button>
        </li>
        <li>
          <button>
            <a href="/bootstrap-provider-example">
              Server Side Render w Bootstrap Provider
            </a>
          </button>
        </li>
        <li>
          <button>
            <a href="/bootstrap-example-core">Server Side Render Core</a>
          </button>
        </li>
        <li>
          <button>
            <a href="/proxy-example">Proxied API Calls</a>
          </button>
        </li>
        <li>
          <button>
            <a href="/proxy-example-core">Proxied API Calls Core</a>
          </button>
        </li>
        <li>
          <button>
            <a href="/persisted-user-storage-example-on-device">
              User Persistent Storage On Device Eval
            </a>
          </button>
        </li>
        <li>
          <button>
            <a href="/persisted-user-storage-example">
              User Persistent Storage
            </a>
          </button>
        </li>
        <li>
          <button>
            <a href="/session-replay-example">Session Replay</a>
          </button>
        </li>
        <li>
          <button>
            <a href="/triggered-session-replay-example">
              Triggered Session Replay
            </a>
          </button>
        </li>
        <li>
          <button>
            <a href="/override-adapter-example">Override Adapter</a>
          </button>
        </li>
        <li>
          <button>
            <a href="/param-store-example">Param Stores</a>
          </button>
        </li>
        <li>
          <button>
            <a href="/async-initialize-example">Async Initialization</a>
          </button>
        </li>
        <li>
          <button>
            <a href="/login-example">Login</a>
          </button>
        </li>
        <li>
          <button>
            <a href="/simple-statsig-provider-example">
              Simple Statsig Provider
            </a>
          </button>
        </li>
        <li>
          <button>
            <a href="/dns-query-builder">DNS Query Builder</a>
          </button>
        </li>
        <li>
          <button>
            <a href="/on-device-eval-example">On Device Evaluation</a>
          </button>
        </li>
        <li>
          <button>
            <a href="/on-device-eval-adapter-example">
              On Device Evaluation Adapter
            </a>
          </button>
        </li>
        <li>
          <button>
            <a href="/statsig-network-resolver-example">
              Statsig Network Resolver
            </a>
          </button>
        </li>
      </ul>
    </div>
  );
}
