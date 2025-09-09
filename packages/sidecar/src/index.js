/* eslint-disable no-undef */

/* eslint-disable no-empty */

/* eslint-disable @typescript-eslint/no-unused-vars */
import { StatsigClient } from '@statsig/js-client';
import { LocalOverrideAdapter } from '@statsig/js-local-overrides';
import { runStatsigAutoCapture } from '@statsig/web-analytics';

const StatsigSidecar = window['StatsigSidecar'] || {
  _statsigInstance: null,
  _queuedEvents: [],
  _clientInitialized: false,
  _redirKey: '_stsgnoredir',

  activateExperiment: function (expId) {
    const matchedExps = this._getMatchingExperiments();
    if (matchedExps.includes(expId)) {
      StatsigSidecar._performExperiments([expId]);
    }
  },

  findElementToObserve: function (query) {
    while (query) {
      try {
        const element = document.querySelector(query);
        if (element) {
          return element;
        }
      } catch (e) {}
      query = query.substring(0, query.lastIndexOf('>'));
    }
    return document.body;
  },

  _flushQueuedEvents: function () {
    if (this._queuedEvents.length === 0) {
      return;
    }
    if (!this._statsigInstance) {
      return;
    }

    const events = [...this._queuedEvents];
    this._queuedEvents = [];
    events.forEach((event) => {
      this._statsigInstance.logEvent(
        event.eventName,
        event.value,
        event.metadata,
      );
    });
    this._statsigInstance.flush && this._statsigInstance.flush();
  },

  _getMatchingExperiments: function () {
    const matchingExps = [];
    const configList = this._statsigInstance.getConfigList();
    let url = window.location.href;
    try {
      const u = new URL(url);
      // This check is important or else it messes up the original URL
      if (u.searchParams.has('overrideuser')) {
        u.searchParams.delete('overrideuser');
      }
      url = u.toString();
    } catch (e) {}
    configList.forEach((config) => {
      const exp = this._statsigInstance.getExperiment(config);

      if (exp.value['!statsig_sidecar_directives']) {
        if (this._isMatchingExperiment(url, exp.value['sidecarURLFilters'])) {
          matchingExps.push(exp.name);
        }
      }
    });
    return matchingExps;
  },

  getStatsigInstance: function () {
    return this._statsigInstance;
  },

  _isMatchingExperiment: function (url, filters) {
    if (!filters || filters.length === 0) {
      return true;
    }
    for (const filter of filters) {
      if (filter.type === 'contains') {
        if (url.includes(filter.value)) {
          return true;
        }
      } else if (filter.type === 'equals') {
        if (url === filter.value) {
          return true;
        }
      } else if (filter.type === 'regex') {
        if (RegExp(filter.value).test(url)) {
          return true;
        }
      } else if (filter.type === 'path') {
        const path = new URL(url).pathname;
        if (path === filter.value) {
          return true;
        }
      }
    }
    return false;
  },

  _isIOS: function () {
    return /iPad|iPhone|iPod/.test(navigator?.userAgent ?? '');
  },

  logEvent: function (eventName, value, metadata) {
    if (!this._statsigInstance || !this._clientInitialized) {
      this._queuedEvents.push({ eventName, value, metadata });
      return;
    }

    this._flushQueuedEvents();
    this._statsigInstance.logEvent(eventName, value, metadata);
  },

  _observeMutation: function (element, modifierFunc) {
    const config = {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
      characterDataOldValue: false,
    };
    const callback = (mutationsList, observer) => {
      setTimeout(() => {
        modifierFunc();
      }, 0);
    };
    const observer = new MutationObserver(callback);
    observer.observe(element, config);
    modifierFunc();
  },

  _observePageChanges: function (expIds) {
    const ps = history.pushState;
    const rs = history.replaceState;

    const rerun = () => {
      StatsigSidecar.runAllExperiments(expIds);
    };

    history.pushState = function (...n) {
      ps.apply(history, n);
      rerun();
    };
    history.replaceState = function (...n) {
      rs.apply(history, n);
      rerun();
    };
    window.addEventListener('hashchange', rerun);
    window.addEventListener('popstate', rerun);
  },

  _performAfterLoad: function (callback) {
    if (/complete|interactive|loaded/.test(document.readyState)) {
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        callback();
      });
    }
  },

  performAttributeChange: function (query, attribute, value, removeAttrs = []) {
    if (!query) {
      return;
    }
    this.setupMutationObserver(query, () => {
      const element = document.querySelector(query);
      if (element && element.getAttribute(attribute) !== value) {
        element.setAttribute(attribute, value);
        removeAttrs?.forEach((attr) => {
          element.removeAttribute(attr);
        });
      }
    });
  },

  performContentChange: function (query, value) {
    if (!query) {
      return;
    }
    this.setupMutationObserver(query, () => {
      const element = document.querySelector(query);
      if (element && element.innerHTML !== value) {
        element.innerHTML = value;
      }
    });
  },

  _performDirective: function (directive) {
    console.log(directive);
    switch (directive.type) {
      case 'content':
        this._performAfterLoad(() => {
          this.performContentChange(directive.selector, directive.value);
        });
        break;

      case 'style':
        this._performAfterLoad(() => {
          this.performStyleChange(
            directive.selector,
            directive.key,
            directive.value,
          );
        });
        break;

      case 'properties':
        this._performAfterLoad(() => {
          directive.metadata?.forEach((property) => {
            if (property.type === 'style') {
              this.performStyleChange(
                property.selector,
                property.name,
                property.value,
              );
            } else if (property.type === 'attribute') {
              this.performAttributeChange(
                property.selector,
                property.name,
                property.value,
              );
            }
          });
        });
        break;

      case 'attribute':
        this._performAfterLoad(() => {
          this.performAttributeChange(
            directive.selector,
            directive.key,
            directive.value,
          );
        });
        break;

      case 'image':
        this._performAfterLoad(() => {
          this.performAttributeChange(
            directive.selector,
            'src',
            directive.value,
            ['srcset'],
          );
        });
        break;

      case 'reorder':
        this._performAfterLoad(() => {
          this.performReorderElement(
            directive.selector,
            directive.operator,
            directive.value,
          );
        });
        break;

      case 'code':
        this.performInjectScript(directive.value);
        break;

      case 'inject-style':
        this.performInjectStyle(directive.value);
        break;

      case 'redirect':
        this.redirectPage(directive.value);
        break;
    }
  },

  _performExperiments: function (expIds) {
    if (Array.isArray(expIds)) {
      expIds.forEach((expId) => {
        const expConfig = this._statsigInstance.getExperiment(expId);
        const directives = expConfig.get('!statsig_sidecar_directives', []);
        directives.forEach((directive) => {
          try {
            this._performDirective(directive);
          } catch (e) {
            console.error('Failed to perform directive:', e);
          }
        });
      });
    }
  },

  performInjectScript: function (value) {
    const script = document.createElement('script');
    script.setAttribute('nonce', this.scriptNonce);
    script.nonce = this.scriptNonce;
    script.innerHTML = value;
    document.head.appendChild(script);
  },

  performInjectStyle: function (value) {
    const style = document.createElement('style');
    style.innerHTML = value;
    document.head.appendChild(style);
  },

  performReorderElement: function (query, operator, anchorQuery) {
    if (!query) {
      return;
    }
    this.setupMutationObserver(query, () => {
      const target = document.querySelector(query);
      const anchor = document.querySelector(anchorQuery);
      if (!target || !anchor) {
        return;
      }

      switch (operator) {
        case 'before':
          anchor.before(target);
          break;
        case 'after':
          anchor.after(target);
          break;
        case 'first':
          anchor.prepend(target);
          break;
        case 'last':
          anchor.append(target);
          break;
      }
    });
  },

  performStyleChange: function (query, style, value) {
    if (!query) {
      return;
    }
    this.setupMutationObserver(query, () => {
      const element = document.querySelector(query);
      if (element) {
        element.style.setProperty(style, value);
        // const existingStyle = element.getAttribute("style") || "";
        // if (!existingStyle.includes(` ${value}`)) {
        //   const newStyle = `${existingStyle}; ${value}`;
        //   element.setAttribute("style", newStyle);
        // }
      }
    });
  },

  processEvent: function (event) {
    if (!event || !event.detail) {
      return false;
    }

    const detail = event.detail;
    if (detail.name === 'inject-script') {
      this.performInjectScript(detail.value);
      return false;
    }
  },

  redirectPage: async function (url) {
    this._flushQueuedEvents();

    if (!window || !window.location || !url || window.location.href == url) {
      return;
    }

    try {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has(this._redirKey)) {
        return;
      }

      const newUrl = new URL(url, currentUrl);
      for (const key of currentUrl.searchParams.keys()) {
        if (!newUrl.searchParams.has(key)) {
          newUrl.searchParams.set(key, currentUrl.searchParams.get(key));
        }
      }
      newUrl.searchParams.set(this._redirKey, '1');

      if (this._isIOS()) {
        await this._statsigInstance.flush();
      }

      window.location.href = newUrl.toString();
    } catch (e) {
      window.location.href = url;
    }
  },

  resetBody: function () {
    const sbpd = document.getElementById('__sbpd');
    if (sbpd) {
      sbpd.parentElement.removeChild(sbpd);
    }
  },

  runAllExperiments: function (expIds = null) {
    if (!expIds) {
      const matchingExps = this._getMatchingExperiments();
      this._runPreExperimentScripts(matchingExps);
      expIds = matchingExps;
    }

    if (expIds) {
      try {
        this._performExperiments(expIds);
      } catch (e) {
        console.error('Failed to perform experiments:', e);
      }
    }
    this.resetBody();
    if (window?.postExperimentCallback) {
      window.postExperimentCallback(this._statsigInstance, expIds);
    }
  },

  _runPreExperimentScripts: function (matchedExps) {
    matchedExps?.forEach((exp) => {
      if (exp.prerunScript) {
        const expConfig = this._statsigInstance.getExperiment(exp);
        if (expConfig.ruleID !== 'prestart') {
          this.performInjectScript(exp.prerunScript);
        }
      }
    });
  },

  setupMutationObserver: function (query, callback) {
    const observeElement = this.findElementToObserve(query);
    if (observeElement) {
      this._observeMutation(observeElement, callback);
    }
  },

  setupStatsigSdk: async function (
    apiKey,
    expIds,
    autoStart,
    initUrlOverride,
    logUrlOverride,
  ) {
    let overrideUserID = null;
    let overrideExp = null;
    try {
      const url = new URL(window.location.href);
      overrideUserID = url.searchParams.get('overrideuser');
      overrideExp = url.searchParams.get('overrideexp');
    } catch (e) {
      console.error('Failed to update user:', e);
    }

    try {
      const user = window?.statsigUser ?? {};
      if (overrideUserID) {
        user.userID = overrideUserID;
        user.customIDs = user.customIDs || {};
        user.customIDs.stableID = overrideUserID;
      }

      const options = window?.statsigOptions ?? {};
      options.disableLogging = !autoStart;
      if (initUrlOverride || logUrlOverride) {
        options.networkConfig = {
          initializeUrl: initUrlOverride,
          logEventUrl: logUrlOverride,
        };
      }
      if (overrideExp) {
        const overrideAdapter = new LocalOverrideAdapter();
        options.overrideAdapter = overrideAdapter;
        overrideAdapter.overrideExperiment('sidecar', JSON.parse(overrideExp));
      }

      this._statsigInstance = new StatsigClient(apiKey, user, options);
      await this._statsigInstance.initializeAsync();
      runStatsigAutoCapture(this._statsigInstance);

      this._clientInitialized = true;
      this._flushQueuedEvents();
      this._observePageChanges(expIds);
      this.runAllExperiments(expIds);
    } catch (e) {
      console.error('Failed to initialize Statsig:', e);
    }
    this.resetBody();
  },
};

if (document.currentScript && document.currentScript.src) {
  const url = new URL(document.currentScript.src);
  const apiKey = url.searchParams.get('apikey');
  const multiExpIds = url.searchParams.get('multiexpids');
  const initUrl = url.searchParams.get('initializeurl');
  const logUrl = url.searchParams.get('logeventurl');

  const autoStart = url.searchParams.get('autostart') !== '0';
  // Deprecated
  // const autoCapture = url.searchParams.get('autocapture') !== '0';
  const reduceFlicker = url.searchParams.get('reduceflicker') !== '0';
  StatsigSidecar.scriptNonce = document.currentScript.nonce;
  if (apiKey) {
    if (reduceFlicker) {
      document.write('<style id="__sbpd">body { display: none; }</style>\n');
      setTimeout(() => {
        StatsigSidecar.resetBody();
      }, 1000);
    }
    const expIds = multiExpIds ? multiExpIds.split(',') : null;
    StatsigSidecar.setupStatsigSdk(apiKey, expIds, autoStart, initUrl, logUrl);
    document.addEventListener(`sidecar_${apiKey}`, (e) => {
      StatsigSidecar.processEvent(e);
      e.preventDefault();
    });
  }
};

window['StatsigSidecar'] = StatsigSidecar;

export default StatsigSidecar;
