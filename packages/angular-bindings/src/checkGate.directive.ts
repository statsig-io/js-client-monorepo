import {
  Directive,
  Input,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';

import { Log } from '@statsig/client-core';

import { FeatureGateOptions } from './statsig.module';
import { StatsigService } from './statsig.service';

@Directive({
  selector: '[stgCheckGate]',
})
export class CheckGateDirective implements OnInit {
  private _gate = '';
  private _isHidden = true;
  private _options: FeatureGateOptions = {};

  @Input() set stgCheckGate(val: string) {
    Log.debug('Setting gate', val);
    if (val) {
      this._gate = val;
      this._updateView();
    }
  }

  @Input() set stgCheckGateOptions(val: FeatureGateOptions) {
    Log.debug('Setting options', val);
    if (val) {
      this._options = val;
      this._updateView();
    }
  }

  constructor(
    private _templateRef: TemplateRef<unknown>,
    private _viewContainer: ViewContainerRef,
    private _statsigService: StatsigService,
  ) {
    _statsigService.getClient().$on('values_updated', () => {
      this._updateView();
    });
  }

  ngOnInit(): void {
    if (this._gate) {
      this._updateView();
    }
  }

  private _updateView() {
    if (this._checkGate()) {
      if (this._isHidden) {
        Log.debug('Feature flag is enabled, showing the template');
        this._viewContainer.createEmbeddedView(this._templateRef);
        this._isHidden = false;
      }
    } else {
      this._viewContainer.clear();
      this._isHidden = true;
    }
  }

  private _checkGate() {
    return (
      this._gate && this._statsigService.checkGate(this._gate, this._options)
    );
  }
}
