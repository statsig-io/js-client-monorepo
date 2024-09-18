/* eslint-disable no-console */
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import Prism from 'prismjs';
import { ReactNode, useEffect, useState } from 'react';

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
  const response = await fetch(path);
  const contents = await response.text();
  return _extractSnippet(contents);
}

export default function SamplesPage(): ReactNode {
  const [snippetIndex, setSnippetIndex] = useState(0);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    (async () => {
      setSnippets([]);
      console.log('fetching snippets!');

      const filesResponse = await fetch('/sample-files');
      const { files } = (await filesResponse.json()) as any;

      for await (const sample of files) {
        const snippet = await _fetchSnippet(`./samples/${sample}`);
        setSnippets((old) => [...old, { content: snippet, name: sample }]);
      }
    })().catch((e) => {
      throw e;
    });
  }, []);

  useEffect(() => {
    Prism.highlightAll();
  }, [snippets, snippetIndex]);

  const filteredSnippets = snippets.filter((snippet) =>
    snippet.name.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div>
      <TextField
        label="Filter snippets"
        variant="outlined"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        fullWidth
        margin="normal"
      />
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
          {filteredSnippets.map((snippet, i) => (
            <MenuItem key={`snippet-menu-item-${i}`} value={i}>
              {snippet.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {filteredSnippets.length > 0 && (
        <pre>
          <code className="language-typescript">
            {filteredSnippets[snippetIndex]?.content}
          </code>
        </pre>
      )}
    </div>
  );
}
