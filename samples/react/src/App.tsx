import { getUUID } from '@sigstat/core';
import { useEffect } from 'react';

export function App() {
  useEffect(() => {
    alert('Result: ' + getUUID());
  }, []);

  return (
    <div>
      <h1>
        <span> Hello there, </span>
        Welcome react-sample 👋
      </h1>
    </div>
  );
}

export default App;
