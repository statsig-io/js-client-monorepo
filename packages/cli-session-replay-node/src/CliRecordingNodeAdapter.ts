import * as process from 'process';

import {
  CliAdapterFactory,
  CliRecordingAdapter,
  CliRecordingPrivateHooks,
} from './CliRecording';

import intercept = require('intercept-stdout');

export class CliRecordingNodeAdapter implements CliRecordingAdapter {
  private _stopIntercept: ReturnType<typeof intercept> | undefined;

  constructor(private _hooks: CliRecordingPrivateHooks) {}

  start(): void {
    this._stopIntercept = intercept((str) => {
      this._hooks.onOutput(str.replaceAll('\n', '\r\n'));
    });
    process.stdout.on('resize', this._resizeHandler);
  }

  getSize(): { width: number; height: number } {
    return {
      width: process.stdout.columns,
      height: process.stdout.rows,
    };
  }

  stop(): void {
    if (this._stopIntercept) {
      this._stopIntercept();
      this._stopIntercept = undefined;
    }
    process.stdout.off('resize', this._resizeHandler);
  }

  private _resizeHandler = () => {
    this._hooks.onResize(process.stdout.columns, process.stdout.rows);
  };
}

export const CliRecordingNodeAdapterFactory: CliAdapterFactory = (hooks) =>
  new CliRecordingNodeAdapter(hooks);
