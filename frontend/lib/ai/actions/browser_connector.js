/**
 * Phase 3B: Real Browser Connector using Puppeteer
 */
import puppeteer from 'puppeteer';

const BLOCKED_DOMAINS = ['localhost', '127.0.0.1', 'internal.network'];

export class BrowserConnector {
  constructor() {
    this.name = 'Puppeteer Browser Connector';
    this.browser = null;
    this.page = null;
  }

  async connect() {
    this.browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    });
    this.page = await this.browser.newPage();
    this.page.setDefaultNavigationTimeout(30000);
    this.page.setDefaultTimeout(15000);
  }

  async disconnect() {
    if (this.page) await this.page.close().catch(()=>null);
    if (this.browser) await this.browser.close().catch(()=>null);
  }

  _isSafeUrl(target) {
    try {
      const url = new URL(target);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
      if (BLOCKED_DOMAINS.includes(url.hostname)) return false;
      return true;
    } catch (e) {
      return false; // Malformed
    }
  }

  async executeAction(action) {
    if (!this.page) return { status: 'FAILED', result: 'Browser not connected' };

    try {
      switch (action.type) {
        case 'open_url':
        case 'browser_navigation':
          if (!this._isSafeUrl(action.target)) {
            return { status: 'FAILED', result: `Unsafe or blocked URL: ${action.target}` };
          }
          await this.page.goto(action.target, { waitUntil: 'networkidle2' });
          return { status: 'SUCCESS', result: `Navigated to ${this.page.url()}` };
          
        case 'click':
          await this.page.waitForSelector(action.target, { visible: true });
          await this.page.click(action.target);
          return { status: 'SUCCESS', result: `Clicked element: ${action.target}` };
          
        case 'type':
          await this.page.waitForSelector(action.target, { visible: true });
          await this.page.type(action.target, action.value, { delay: 50 });
          return { status: 'SUCCESS', result: `Typed into element: ${action.target}` };
          
        case 'press_key':
          await this.page.keyboard.press(action.value);
          return { status: 'SUCCESS', result: `Pressed key: ${action.value}` };
          
        case 'scroll':
          await this.page.evaluate(() => window.scrollBy(0, window.innerHeight));
          return { status: 'SUCCESS', result: `Scrolled page` };
          
        case 'wait':
          const ms = parseInt(action.value) || 2000;
          await new Promise(r => setTimeout(r, ms));
          return { status: 'SUCCESS', result: `Waited ${ms}ms` };
          
        case 'screenshot':
          const base64 = await this.page.screenshot({ encoding: 'base64' });
          return { status: 'SUCCESS', result: `Screenshot taken` }; // omit data log size
          
        case 'read_screen':
          const text = await this.page.evaluate(() => document.body.innerText.substring(0, 5000));
          return { status: 'SUCCESS', result: text };
          
        default:
          return { status: 'UNSUPPORTED', result: `Action type ${action.type} unsupported` };
      }
    } catch (err) {
      return { status: 'FAILED', result: err.message };
    }
  }
}
