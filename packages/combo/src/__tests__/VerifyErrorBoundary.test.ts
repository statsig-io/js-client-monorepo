import { readFileSync } from 'fs';
import path from 'path';
import ts from 'typescript';

import { StatsigClient } from '@statsig/js-client';
import { StatsigOnDeviceEvalClient } from '@statsig/js-on-device-eval-client';
import { SessionReplay } from '@statsig/session-replay';
import { AutoCapture } from '@statsig/web-analytics';

const ebCapture = 'return this._capture(name';

const dir = '../../../../packages';

describe.each([
  [
    'ClientBase',
    getMethods(dir + '/client-core/src/StatsigClientBase.ts'),
    () => new StatsigClient('client-key', {}),
  ],
  [
    'StatsigClient',
    getMethods(dir + '/js-client/src/StatsigClient.ts'),
    () => new StatsigClient('client-key', {}),
  ],
  [
    'StatsigOnDeviceEvalClient',
    getMethods(
      dir + '/js-on-device-eval-client/src/StatsigOnDeviceEvalClient.ts',
    ),
    () => new StatsigOnDeviceEvalClient('client-key'),
  ],
  [
    'SessionReplay',
    getMethods(dir + '/session-replay/src/SessionReplay.ts'),
    () => new SessionReplay(new StatsigClient('client-key', {})),
  ],
  [
    'AutoCapture',
    getMethods(dir + '/web-analytics/src/AutoCapture.ts'),
    () => new AutoCapture(new StatsigClient('client-key', {})),
  ],
])('%s', (_title, methods, factory) => {
  const client = factory();

  test.each(methods)('method: %s', (method) => {
    expect((client as any)[method].toString()).toContain(ebCapture);
    expect((client as any)[method].$EB).toBe(true);
  });
});

function getMethods(sourcePath: string): string[] {
  const filePath = path.resolve(__dirname, sourcePath);
  const fileContent = readFileSync(filePath, { encoding: 'utf8' });

  const sourceFile = ts.createSourceFile(
    'tempFile.ts', // This is just a name for the source file in memory
    fileContent,
    ts.ScriptTarget.Latest,
    true,
  );

  const methods: string[] = [];

  function visitNode(node: ts.Node) {
    if (ts.isMethodDeclaration(node)) {
      const isStatic = node.modifiers?.find(
        (mod) => mod.kind === ts.SyntaxKind.StaticKeyword,
      );

      const methodName = node.name.getText(sourceFile);

      if (!isStatic) {
        methods.push(methodName);
      }
    }

    ts.forEachChild(node, visitNode);
  }

  visitNode(sourceFile);
  return methods;
}
