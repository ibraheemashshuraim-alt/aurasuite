/**
 * Abstract Jarvis Connector & Mock Implementation
 */
export class MockJarvisConnector {
  constructor() {
    this.name = 'mock_jarvis_daemon';
    this.connected = true;
  }

  isConnected() {
    return this.connected;
  }

  async executeAction({ action, target = '', value = '', expectedResultCriteria = '' }) {
    if (!this.connected) {
      throw new Error('Jarvis daemon is offline');
    }

    // Simulated OS interaction for Phase 1 testing
    return {
      executed: true,
      output: `Executed action: ${action} on target: ${target || 'desktop'}`,
      rawLogs: `Simulated OS interaction completed with returncode 0`,
      completedAt: new Date().toISOString(),
    };
  }

  async captureScreen() {
    return 'simulated_png_screenshot_base64_data';
  }
}
