'use client';

import { useEffect, useState } from 'react';

const DOMAIN_CHARS = [
  'i', // initialize
  'e', // events
  'd', // dcs
];

// prettier-ignore
// Standard DNS header (12 bytes)
const DNS_HEADER = new Uint8Array([
    0x00, 0x00, // ID
    0x01, 0x00, // Flags: Standard query
    0x00, 0x01, // QDCOUNT (1 question)
    0x00, 0x00, // ANCOUNT (0 answers)
    0x00, 0x00, // NSCOUNT (0 authority records)
    0x00, 0x00, // ARCOUNT (0 additional records)
  ]);


export default function DnsQueryBuilder(): JSX.Element {
  const [value, setValue] = useState('featureassets.org');
  const [response, setResponse] = useState('');
  const [query, setQuery] = useState(
    new Uint8Array([...DNS_HEADER, ...encodeDomain(value)]),
  );

  useEffect(() => {
    fetchDNS(query)
      .then((res) => setResponse(res ?? ''))
      // eslint-disable-next-line no-console
      .catch(console.error);
  }, [query]);

  const handleChange = (value: string) => {
    setValue(value);
    setQuery(new Uint8Array([...DNS_HEADER, ...encodeDomain(value)]));
  };

  const result = arrayToHexString(query);

  const formattedResult = result
    .split(', ')
    .reduce((acc, curr, index) => {
      if (index % 10 === 0 && index !== 0) {
        acc.push('\n  ');
      }
      acc.push(curr);
      if (index !== result.split(', ').length - 1) {
        acc.push(', ');
      }
      return acc;
    }, [] as string[])
    .join('');

  return (
    <div style={{ padding: '20px' }}>
      <h1>DNS Query Builder</h1>
      <label>
        Domain:
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
        />
      </label>

      <div>
        <pre>
          <code>
            {`const QUERY = new Uint8Array([
  ${formattedResult}
]);`}
          </code>
        </pre>
      </div>
      <div>
        <h2>Raw DNS Response</h2>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          <code>{response.split(',').join('\n')}</code>
        </pre>
      </div>
    </div>
  );
}



function arrayToHexString(arr: Uint8Array) {
    return Array.from(
      arr,
      (byte) => '0x' + byte.toString(16).padStart(2, '0'),
    ).join(', ');
  }
  
  function encodeDomain(domain: string) {
    const parts = domain.split('.');
  
    if (parts.length === 0) {
      return new Uint8Array();
    }
  
    const wireFormat = [];
  
    // Each part of the domain is prefixed with its length
    parts.forEach((part) => {
      wireFormat.push(part.length);
      for (const char of part) {
        wireFormat.push(char.charCodeAt(0));
      }
    });
  
    // Terminate with a 0 byte (end of domain)
    wireFormat.push(0);
  
    // Add standard query trailer for a DNS query (TXT record, class IN)
    wireFormat.push(0x00, 0x10); // QTYPE = TXT (0x0010)
    wireFormat.push(0x00, 0x01); // QCLASS = IN (Internet)
  
    return new Uint8Array(wireFormat);
  }
  
  function simpleParse(input: Uint8Array): string | null {
    let start = 0;
    for (let i = 1; i < input.length; i++) {
      const curr = String.fromCharCode(input[i]);
  
      if (curr !== '=') {
        continue;
      }
  
      const prev = String.fromCharCode(input[i - 1]);
      if (DOMAIN_CHARS.includes(prev)) {
        start = i - 1;
        break;
      }
  
      if (i >= 200) {
        return null;
      }
    }
  
    const filter = /[a-zA-Z0-9\-_.~,=:/]/;
  
    let result = '';
    for (let i = start; i < input.length; i++) {
      const char = String.fromCharCode(input[i]);
      if (filter.test(char)) {
        result += char;
      }
    }
  
    return result;
  }
  
  async function fetchDNS(query: Uint8Array) {
    try {
      const response = await fetch('https://cloudflare-dns.com/dns-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/dns-message',
          Accept: 'application/dns-message',
        },
        body: query, // Use the binary DNS query in the request body
      });
  
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer(); // Get the response as an ArrayBuffer
        const responseBytes = new Uint8Array(arrayBuffer); // Convert ArrayBuffer to Uint8Array (binary)
  
        const parsedResponse = simpleParse(responseBytes);
        return parsedResponse;
      } else {
        throw new Error(
          `Failed to fetch DNS response: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error occurred:', error);
    }
  
    return 'ERROR';
  }