'use client';

import React, { useCallback, useRef, useState } from 'react';

import { LogEventCompressionMode } from '@statsig/client-core';
import { StatsigProvider } from '@statsig/react-bindings';
import { StatsigSessionReplayPlugin } from '@statsig/session-replay';
import { StatsigAutoCapturePlugin } from '@statsig/web-analytics';

import { DEMO_CLIENT_KEY } from '../../utils/constants';

const BURST_COUNT = 100;

function Content(): React.ReactElement {
  const [inputValue, setInputValue] = useState('');
  const mouseMoveAreaRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const clickButtonRef = useRef<HTMLButtonElement>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value as string);
    },
    [],
  );

  const runClickBurst = useCallback(() => {
    const btn = clickButtonRef.current;
    if (!btn) return;

    for (let i = 0; i < BURST_COUNT; i++) {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  }, []);

  const runMouseMoveBurst = useCallback(() => {
    const area = mouseMoveAreaRef.current;
    if (!area) return;

    for (let i = 0; i < BURST_COUNT; i++) {
      area.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 100 + (i % 200),
          clientY: 100 + Math.floor(i / 2),
          bubbles: true,
        }),
      );
    }
  }, []);

  const runScrollBurst = useCallback(() => {
    const area = scrollAreaRef.current;
    if (!area) return;

    for (let i = 0; i < BURST_COUNT; i++) {
      area.scrollTop = i * 10;
    }
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h1>DOM Events Profiling</h1>

      {/* Single Event Triggers */}
      <div style={{ marginBottom: 20 }}>
        <h3>Single Events</h3>
        <button ref={clickButtonRef} style={{ marginRight: 10 }}>
          Click
        </button>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type here..."
          style={{ marginRight: 10 }}
        />
      </div>

      {/* Mouse Move Area */}
      <div
        ref={mouseMoveAreaRef}
        style={{
          height: 80,
          background: '#eee',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Mouse move area
      </div>

      {/* Scroll Area */}
      <div
        ref={scrollAreaRef}
        style={{
          height: 100,
          overflowY: 'auto',
          border: '1px solid #ccc',
          marginBottom: 20,
        }}
      >
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
            Item {i + 1}
          </div>
        ))}
      </div>

      {/* Burst Triggers */}
      <div>
        <h3>Mass Triggers ({BURST_COUNT} each)</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={runClickBurst}>Click Burst</button>
          <button onClick={runMouseMoveBurst}>Mouse Burst</button>
          <button onClick={runScrollBurst}>Scroll Burst</button>
        </div>
      </div>
    </div>
  );
}

export default function DOMEventsProfiling(): React.ReactElement {
  return (
    <StatsigProvider
      sdkKey={DEMO_CLIENT_KEY}
      user={{ userID: 'profiling-user' }}
      options={{
        plugins: [
          new StatsigSessionReplayPlugin(),
          new StatsigAutoCapturePlugin(),
        ],
        logEventCompressionMode: LogEventCompressionMode.Disabled,
      }}
    >
      <Content />
    </StatsigProvider>
  );
}
