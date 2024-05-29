export default function Index(): JSX.Element {
  return (
    <div>
      <h1>Samples</h1>
      <ul>
        <li>
          <button>
            <a href="/bootstrap-example">Simple Server Side Render</a>
          </button>
        </li>
        <li>
          <button>
            <a href="/proxy-example">Proxied API Calls</a>
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
            <a href="/override-adapter-example">Override Adapter</a>
          </button>
        </li>
      </ul>
    </div>
  );
}
