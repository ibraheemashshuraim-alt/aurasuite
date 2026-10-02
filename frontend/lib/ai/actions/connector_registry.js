import { MockActionConnector } from './mock_connector.js';
import { BrowserConnector } from './browser_connector.js';

export class ActionConnectorRegistry {
  static getConnector(type = 'BROWSER') {
    switch(type) {
      case 'MOCK':
        return new MockActionConnector();
      case 'BROWSER':
        return new BrowserConnector();
      default:
        throw new Error(`Unknown connector type: ${type}`);
    }
  }
}
