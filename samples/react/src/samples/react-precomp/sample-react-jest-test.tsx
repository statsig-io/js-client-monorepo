/* eslint-disable no-console */

/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-inferrable-types */
import type {
  expect as expectType,
  jest as jestType,
  test as testType,
} from '@jest/globals';
import type {
  render as renderType,
  screen as screenType,
} from '@testing-library/react';
// <snippet>
import { render, screen } from '@testing-library/react';

// </snippet>

// prettier-ignore
export default async function Sample(): Promise<void> {
  console.log(Foo)
}

function App() {
  return <div></div>;
}

// prettier-ignore
function Foo() {
const expect: typeof expectType = 1 as any;
const jest: typeof jestType = 1 as any;
const test: typeof testType = 1 as any;
const render: typeof renderType = 1 as any;
const screen: typeof screenType = 1 as any;

// <snippet>
jest.mock('@statsig/react-bindings', () => {
  return {
    ...(jest.requireActual('@statsig/react-bindings') as object),
    useFeatureGate: () => ({ value: true }),
    useExperiment: () => ({ get: () => 'my_value' }),
  };
});

test('renders gate pass', async () => {
  render(<App />);

  const elem = await screen.findByTestId('gate_test');
  expect(elem.textContent).toContain('Pass');
});

test('renders experiment value', async () => {
  render(<App />);

  const elem = await screen.findByTestId('exp_test');
  expect(elem.textContent).toContain('my_value');
});

// </snippet>
}
