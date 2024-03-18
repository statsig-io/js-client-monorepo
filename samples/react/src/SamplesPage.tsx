/* eslint-disable no-console */
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import Prism from 'prismjs';
import { ReactNode, useEffect, useState } from 'react';

const SAMPLES = [
  // Precomputed Evaluations Client
  () => import('./samples/precomputed-client/sample-precomp-initialize'),
  () => import('./samples/precomputed-client/sample-precomp-basic'),
  () => import('./samples/precomputed-client/sample-precomp-check-gate'),
  () => import('./samples/precomputed-client/sample-precomp-get-config'),
  () => import('./samples/precomputed-client/sample-precomp-get-layer'),
  () => import('./samples/precomputed-client/sample-precomp-log-event'),
  () => import('./samples/precomputed-client/sample-precomp-shutdown'),
  () => import('./samples/precomputed-client/sample-precomp-bootstrap'),
  () => import('./samples/precomputed-client/sample-precomp-get-data-adapter'),

  // React
  () => import('./samples/react-precomp/sample-react-login'),

  () => import('./samples/OnDeviceClientBasic'),
];

type Snippet = {
  content: string;
  name: string;
};

function _extractSnippet(input: string): string {
  const parts = input.split('\n');
  const result = [];

  let isAdding = false;

  for (const line of parts) {
    if (line.includes('<snippet>')) {
      isAdding = true;
    } else if (line.includes('</snippet>')) {
      isAdding = false;
    } else if (isAdding) {
      result.push(line);
    }
  }

  return result.join('\n');
}

async function _fetchSnippet(path: string): Promise<string> {
  // /assets/samples/precomputed-client/sample-precomp-basic.tsx
  const response = await fetch(path);
  const contents = await response.text();
  return _extractSnippet(contents);
}

export default function SamplesPage(): ReactNode {
  const [snippetIndex, setSnippetIndex] = useState(0);
  const [snippets, setSnippets] = useState<Snippet[]>([]);

  useEffect(() => {
    (async () => {
      for await (const sample of SAMPLES) {
        await (await sample()).default(); // execute the sample to ensure it works

        const path = sample
          .toString()
          .split('"')[1]
          .replaceAll('_', '/')
          .replace('/tsx', '.tsx')
          .replace('src/', '');

        const snippet = await _fetchSnippet(`/assets/${path}`);
        setSnippets((old) => [...old, { content: snippet, name: path }]);
      }
    })().catch((e) => {
      throw e;
    });
  }, []);

  useEffect(() => {
    Prism.highlightAll();
  }, [snippets, snippetIndex]);

  return (
    <div>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Snippet</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={`${snippetIndex}`}
          label="Age"
          onChange={(event: SelectChangeEvent) => {
            setSnippetIndex(parseInt(event.target.value));
          }}
        >
          {snippets.map((snippet, i) => (
            <MenuItem key={`snippet-menu-item-${i}`} value={i}>
              {snippet.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {snippets.length > 0 && (
        <pre>
          <code className="language-javascript">
            {snippets[snippetIndex].content}
          </code>
        </pre>
      )}
    </div>
  );
}
