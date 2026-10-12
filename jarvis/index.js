require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Log to file so background daemon execution can be inspected
const logFile = path.join(__dirname, 'jarvis_daemon.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(logFile, line, 'utf8');
  } catch (e) {}
  console.log(msg);
}

log("=========================================");
log("Jarvis Full OS & Web Daemon starting up...");

let browser = null;
let page = null;

// Helper to resolve desktop and document paths
function resolveFilePath(targetPath) {
  if (!targetPath) return path.join(os.homedir(), 'Desktop', `jarvis_file_${Date.now()}.txt`);
  if (path.isAbsolute(targetPath)) return targetPath;
  
  const lower = targetPath.toLowerCase();
  if (lower.startsWith('desktop/') || lower.startsWith('desktop\\')) {
    return path.join(os.homedir(), targetPath);
  }
  if (lower.startsWith('documents/') || lower.startsWith('documents\\')) {
    return path.join(os.homedir(), targetPath);
  }
  return path.join(os.homedir(), 'Desktop', targetPath);
}

const BROWSER_ACTIONS = ['open_url', 'browser_navigation', 'click', 'type', 'press_key', 'scroll', 'read_screen', 'screenshot'];

async function executeAction(action) {
  // 1. WEB & BROWSER ACTIONS
  if (BROWSER_ACTIONS.includes(action.type)) {
    if (!browser) {
      log("Launching visible browser (Jarvis Mode)...");
      browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
      });
      page = await browser.newPage();
    }

    try {
      switch (action.type) {
        case 'open_url':
        case 'browser_navigation':
          log(`Jarvis Web: Navigating to ${action.target}...`);
          await page.goto(action.target, { waitUntil: 'networkidle2' });
          return { status: 'SUCCESS', result: `Navigated to ${page.url()}` };
          
        case 'click': {
          log(`Jarvis Web: Clicking on ${action.target}...`);
          let t = action.target;
          if (t === "input[name='q']") t = "textarea[name='q']";
          await page.waitForSelector(t, { visible: true });
          await page.click(t);
          return { status: 'SUCCESS', result: `Clicked element: ${action.target}` };
        }
          
        case 'type': {
          log(`Jarvis Web: Typing "${action.value}" into ${action.target}...`);
          let t = action.target;
          if (t === "input[name='q']") t = "textarea[name='q']";
          await page.waitForSelector(t, { visible: true });
          await page.type(t, action.value, { delay: 100 });
          return { status: 'SUCCESS', result: `Typed into element: ${action.target}` };
        }
          
        case 'press_key':
          log(`Jarvis Web: Pressing key ${action.value}...`);
          await page.keyboard.press(action.value);
          return { status: 'SUCCESS', result: `Pressed key: ${action.value}` };
          
        case 'wait':
          const ms = parseInt(action.value) || 2000;
          log(`Jarvis: Waiting for ${ms}ms...`);
          await new Promise(r => setTimeout(r, ms));
          return { status: 'SUCCESS', result: `Waited ${ms}ms` };
          
        case 'read_screen':
          log(`Jarvis Web: Reading screen...`);
          const text = await page.evaluate(() => document.body.innerText.substring(0, 5000));
          return { status: 'SUCCESS', result: text };

        case 'screenshot':
          log(`Jarvis Web: Capturing screenshot...`);
          const scPath = path.join(os.homedir(), 'Desktop', `screenshot_${Date.now()}.png`);
          await page.screenshot({ path: scPath });
          return { status: 'SUCCESS', result: `Screenshot saved to: ${scPath}` };

        default:
          return { status: 'UNSUPPORTED', result: `Action type ${action.type} unsupported` };
      }
    } catch (err) {
      log(`Jarvis Error on web action ${action.type}: ${err.message}`);
      return { status: 'FAILED', result: err.message };
    }
  }

  // 2. DESKTOP & FULL COMPUTER OS ACTIONS
  try {
    switch (action.type) {
      case 'launch_app':
      case 'open_app': {
        const app = (action.target || action.value || 'notepad').trim();
        let fileArg = '';
        if (action.value && action.value !== action.target) {
          const resolved = resolveFilePath(action.value);
          fileArg = `"${resolved}"`;
        }
        log(`Jarvis OS: Launching application: ${app} ${fileArg}...`);
        return new Promise((resolve) => {
          exec(`start "" ${app} ${fileArg}`, (err) => {
            if (err) {
              log(`Jarvis Error launching app: ${err.message}`);
              resolve({ status: 'FAILED', result: err.message });
            } else {
              resolve({ status: 'SUCCESS', result: `Successfully launched ${app} ${fileArg}`.trim() });
            }
          });
        });
      }

      case 'write_file': {
        const filePath = resolveFilePath(action.target);
        const content = action.value || '';
        log(`Jarvis OS: Writing file: ${filePath}...`);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, content, 'utf8');
        log(`Jarvis OS: File created successfully on disk.`);
        return { status: 'SUCCESS', result: `Successfully wrote file: ${filePath}` };
      }

      case 'read_file': {
        const filePath = resolveFilePath(action.target || action.value);
        log(`Jarvis OS: Reading file: ${filePath}...`);
        if (!fs.existsSync(filePath)) {
          return { status: 'FAILED', result: `File does not exist: ${filePath}` };
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return { status: 'SUCCESS', result: data };
      }

      case 'open_file': {
        const filePath = resolveFilePath(action.target || action.value);
        log(`Jarvis OS: Opening file with default app: ${filePath}...`);
        return new Promise((resolve) => {
          exec(`start "" "${filePath}"`, (err) => {
            if (err) {
              log(`Jarvis Error opening file: ${err.message}`);
              resolve({ status: 'FAILED', result: err.message });
            } else {
              resolve({ status: 'SUCCESS', result: `Opened file: ${filePath}` });
            }
          });
        });
      }

      case 'run_command': {
        const cmd = action.value || action.target;
        log(`Jarvis OS: Running command: ${cmd}...`);
        return new Promise((resolve) => {
          exec(cmd, { cwd: os.homedir() }, (err, stdout, stderr) => {
            if (err) {
              log(`Jarvis Error running command: ${err.message}`);
              resolve({ status: 'FAILED', result: err.message });
            } else {
              const out = (stdout || stderr || 'Command executed').trim();
              resolve({ status: 'SUCCESS', result: out });
            }
          });
        });
      }

      case 'type_desktop': {
        const text = action.value || '';
        log(`Jarvis OS: Typing text into active desktop window...`);
        const safeText = text.replace(/[\{\}\+\^\%\~\(\)\[\]]/g, '{$&}');
        return new Promise((resolve) => {
          const vbs = `Set w = CreateObject("WScript.Shell"): WScript.Sleep 500: w.SendKeys "${safeText.replace(/"/g, '""')}"`;
          exec(`mshta "vbscript:Execute("${vbs.replace(/"/g, '\"')}:close()")"`, () => {
            resolve({ status: 'SUCCESS', result: `Typed text into desktop window` });
          });
        });
      }

      default:
        log(`Jarvis: Ignored unsupported action: ${action.type}`);
        return { status: 'UNSUPPORTED', result: `Action type ${action.type} unsupported` };
    }
  } catch (err) {
    log(`Jarvis Error on OS action ${action.type}: ${err.message}`);
    return { status: 'FAILED', result: err.message };
  }
}

async function processTask(taskId, orgId, agentId) {
  log(`\n================================`);
  log(`Jarvis received task: ${taskId}`);
  
  // 1. Fetch action plan
  const { data: planRecords, error: planErr } = await supabase
    .from('engine_action_plans')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (planErr) log(`Jarvis DB Error: ${planErr.message}`);

  const planRecord = planRecords && planRecords.length > 0 ? planRecords[0] : null;

  if (!planRecord || !planRecord.actions) {
    log("No action plan found for task.");
    return;
  }

  const actions = planRecord.actions;
  log(`Executing ${actions.length} actions...`);
  
  const results = [];
  let failed = false;

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const res = await executeAction(action);
    results.push({ action, result: res });
    if (res.status === 'FAILED') {
      failed = true;
      break;
    }
  }

  // 2. Update DB based on outcome
  if (failed) {
    log("Task Failed.");
    await supabase.from('engine_tasks').update({ status: 'FAILED', error: 'Jarvis encountered an error.' }).eq('id', taskId);
    await supabase.from('engine_action_plans').update({ status: 'FAILED' }).eq('id', planRecord.id);
    
    // Close browser if it was opened
    if (browser) {
      try { await browser.close(); } catch(e) {}
      browser = null;
      page = null;
    }
  } else {
    log("Task Completed Successfully!");
    const resultStr = "Jarvis Execution Completed:\n" + results.map(r => `- ${r.action.type}: ${r.result.result}`).join('\n');
    await supabase.from('engine_action_plans').update({ status: 'COMPLETED' }).eq('id', planRecord.id);
    
    // Close browser cleanly if web tasks were run
    if (browser) {
      try { await browser.close(); } catch(e) {}
      browser = null;
      page = null;
    }

    log("Updating task to VERIFYING...");
    await supabase.from('engine_tasks').update({ status: 'VERIFYING', result: resultStr }).eq('id', taskId);
    
    // Simulate verification delay then COMPLETE
    setTimeout(async () => {
      log("Updating task to COMPLETED...");
      await supabase.from('engine_tasks').update({ status: 'COMPLETED' }).eq('id', taskId);
      await supabase.from('engine_execution_logs').insert({
        task_id: taskId, agent_id: agentId, organization_id: orgId, event: 'jarvis_completed', message: 'Jarvis finished execution.'
      });
    }, 1500);
  }
}

// Subscribe to Supabase Realtime
log("Starting Jarvis Local Daemon...");
log("Listening for EXECUTING tasks on Supabase Realtime...");

const channel = supabase.channel('jarvis-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'engine_tasks', filter: 'status=eq.EXECUTING' },
    (payload) => {
      const task = payload.new;
      processTask(task.id, task.organization_id, task.assigned_agent_id);
    }
  )
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      log("Connected to AuraSuite Cloud successfully! Ready.");
    }
  });
