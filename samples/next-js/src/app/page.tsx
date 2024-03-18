export default function Index(): JSX.Element {
  return (
    <div>
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
      </ul>
    </div>
  );
}
