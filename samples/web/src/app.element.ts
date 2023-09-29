import { PrecomputedEvaluationsClient } from '@sigstat/precomputed-evaluations';

import './app.element.css';

const client = new PrecomputedEvaluationsClient('client-key', {
  userID: 'a-user',
});

export class AppElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback(): void {
    client
      .initialize()
      .then(() => {
        this.innerHTML = `
      <div class="wrapper">
        <div class="container">
          <!--  WELCOME  -->
          <div id="welcome">
            <h1>
              <span> Hello there, </span>
              Welcome ${client.loadingStatus} 👋
            </h1>
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