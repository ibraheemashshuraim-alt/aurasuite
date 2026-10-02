/**
 * Phase 3A: Mock Action Connector (Development/Simulation Only)
 */

export class MockActionConnector {
  constructor() {
    this.name = 'MockConnector (Dev Only)';
  }

  async executeAction(action) {
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 500));

    switch (action.type) {
      case 'open_url':
        return { status: 'SUCCESS', result: `Simulated navigation to ${action.target}` };
      case 'click':
        return { status: 'SUCCESS', result: `Simulated click on ${action.target || 'unknown target'}` };
      case 'type':
        return { status: 'SUCCESS', result: `Simulated typing "${action.value}" into ${action.target || 'active field'}` };
      case 'press_key':
        return { status: 'SUCCESS', result: `Simulated pressing key: ${action.value}` };
      case 'scroll':
        return { status: 'SUCCESS', result: `Simulated scrolling ${action.value || 'down'}` };
      case 'wait':
        return { status: 'SUCCESS', result: `Simulated wait for ${action.value || 'some'} ms` };
      case 'screenshot':
        return { status: 'SUCCESS', result: `Simulated capturing screenshot (mock_base64_data)` };
      case 'read_screen':
        return { status: 'SUCCESS', result: `Simulated reading screen state: "Mock DOM representation"` };
      case 'browser_navigation':
        return { status: 'SUCCESS', result: `Simulated browser navigation: ${action.value}` };
      default:
        return { status: 'UNSUPPORTED', result: `Action type ${action.type} is not supported by MockConnector` };
    }
  }
}
