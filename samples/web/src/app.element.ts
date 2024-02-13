import { PrecomputedEvaluationsClient } from '@sigstat/precomputed-evaluations';

import './app.element.css';

const DEMO_CLIENT_KEY = 'client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq';

const client = new PrecomputedEvaluationsClient(DEMO_CLIENT_KEY, {
  userID: 'a-user',
});

export class AppElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback(): void {
    client
      .initialize()
      .then(() => {
        const gate = client.checkGate('a_gate');
        const experiment = client.getExperiment('an_experiment');

        this.innerHTML = `
      <div class="wrapper">
        <div class="container">
          <!--  WELCOME  -->
          <div id="welcome">
            <h1>
               Statsig: ${client.loadingStatus}
            </h1>
            <br />
            <span> a_gate: ${gate ? 'Pass' : 'Fail'} </span>
            <span>an_experiment: 
              <pre>${JSON.stringify(experiment, null, 2)}</pre>
            </span>
            

          </div>
        </div>
      </div>
        `;
      })
      .catch(() => {
        //
      });
  }
}
customElements.define('app-root', AppElement);
