process.on('unhandledRejection', (reason) => {
  console.warn('Jarvis Unhandled Rejection:', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
  console.warn('Jarvis Uncaught Exception:', err?.message || err);
});
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const fs = require('fs');
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
const lockFile = path.join(__dirname, 'jarvis_daemon.lock');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(logFile, line, 'utf8');
  } catch (e) {}
  console.log(msg);
}

function acquireWorkerLock() {
  try {
    if (fs.existsSync(lockFile)) {
      if (process.env.JARVIS_FORCE_START === '1') {
        fs.rmSync(lockFile, { force: true });
      }
    }
    if (fs.existsSync(lockFile)) {
      const existingPid = Number(fs.readFileSync(lockFile, 'utf8').trim());
      if (existingPid) {
        try {
          process.kill(existingPid, 0);
          console.log(`Jarvis worker already running (PID ${existingPid}).`);
          return false;
        } catch (e) {
          // The prior worker ended without removing its lock.
        }
      }
      fs.rmSync(lockFile, { force: true });
    }
    fs.writeFileSync(lockFile, String(process.pid), 'utf8');
    return true;
  } catch (err) {
    console.error(`Unable to acquire Jarvis worker lock: ${err.message}`);
    return false;
  }
}

if (!acquireWorkerLock()) process.exit(0);
process.on('exit', () => {
  try {
    if (fs.existsSync(lockFile) && fs.readFileSync(lockFile, 'utf8').trim() === String(process.pid)) {
      fs.rmSync(lockFile, { force: true });
    }
  } catch (e) {}
});

log("=========================================");
log("Jarvis Full OS & Web Daemon starting up...");

let browser = null;
let page = null;
const activeTaskIds = new Set();

function getSystemChromePath() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function ensureBrowser() {
  if (browser) {
    try {
      const pages = await browser.pages();
      if (pages.length === 0) {
        browser = null;
        page = null;
      } else {
        page = pages[pages.length - 1];
      }
    } catch (e) {
      browser = null;
      page = null;
    }
  }

  if (!browser) {
    log("Launching visible browser (Jarvis Mode)...");
    const chromePath = getSystemChromePath();
    const launchOpts = {
      headless: false,
      defaultViewport: null,
      args: [
        '--start-maximized',
        '--window-position=0,0',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    };
    if (chromePath) {
      launchOpts.executablePath = chromePath;
    }
    try {
      browser = await puppeteer.launch(launchOpts);
      const pages = await browser.pages();
      page = pages.length > 0 ? pages[0] : await browser.newPage();
      try { 
        await page.bringToFront(); 
        exec('powershell -Command "$w = New-Object -ComObject WScript.Shell; $w.AppActivate(\\"Chromium\\"); $w.AppActivate(\\"Chrome\\")"');
      } catch(e) {}
    } catch (err) {
      log(`Jarvis browser launch warning: ${err.message}. Falling back to default system browser.`);
      browser = null;
      page = null;
    }
  }
}

async function focusControlledBrowser() {
  const browserPid = browser?.process?.()?.pid;
  if (!browserPid) return;
  await new Promise((resolve) => {
    exec(
      `powershell -WindowStyle Hidden -Command "$shell = New-Object -ComObject WScript.Shell; [void]$shell.AppActivate(${browserPid})"`,
      () => resolve()
    );
  });
}

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

const BROWSER_ACTIONS = ['open_url', 'close_url', 'browser_navigation', 'click', 'type', 'press_key', 'scroll', 'read_screen', 'screenshot', 'wait'];

async function executeAction(action, taskContext = {}) {
  // 1. WEB & BROWSER ACTIONS
  if (BROWSER_ACTIONS.includes(action.type)) {
    const isDirectVisibleLaunch = action.type === 'open_url' && /(^|\.)google\.com$/i.test(new URL(action.target).hostname);
    if (action.type !== 'wait' && action.type !== 'close_url' && !isDirectVisibleLaunch) {
      await ensureBrowser();
    }

    try {
      switch (action.type) {
        case 'open_url':
        case 'browser_navigation': {
          log(`Jarvis Web: Navigating to ${action.target}...`);
          const safeUrl = action.target.startsWith('http') ? action.target : `https://${action.target}`;
          // Google is a user-facing lookup. Open it through Windows' registered
          // browser so it cannot be hidden behind the automation browser.
          if (isDirectVisibleLaunch) {
            return new Promise((resolve) => {
              exec(`powershell -WindowStyle Hidden -Command "Start-Process '${safeUrl}'"`, (err) => {
                if (err) return resolve({ status: 'FAILED', result: err.message });
                log(`Jarvis OS: Opened visible browser window for ${safeUrl}`);
                resolve({ status: 'SUCCESS', result: `Opened visible browser for ${safeUrl}` });
              });
            });
          }
          if (page) {
            try {
              await page.goto(action.target, { waitUntil: 'domcontentloaded', timeout: 30000 });
              try {
                await page.bringToFront();
                await focusControlledBrowser();
              } catch(e) {}
              return { status: 'SUCCESS', result: `Navigated to ${page.url()}` };
            } catch (navErr) {
              if (!navErr.message.includes('ERR_ABORTED')) throw navErr;
              return { status: 'SUCCESS', result: `Navigated to ${action.target}` };
            }
          } else {
            return new Promise((resolve) => {
              exec(`cmd.exe /c start "" "${safeUrl}"`, (err) => {
                if (err) {
                  resolve({ status: 'FAILED', result: err.message });
                } else {
                  log(`Jarvis OS: Successfully opened URL in default browser: ${safeUrl}`);
                  resolve({ status: 'SUCCESS', result: `Opened ${safeUrl}` });
                }
              });
            });
          }
        }

        case 'close_url': {
          if (!browser) {
            return { status: 'FAILED', result: 'No Jarvis-controlled browser session is open.' };
          }
          const targetUrl = new URL(action.target).hostname.replace(/^www\./, '');
          const pages = await browser.pages();
          const matchingPages = pages.filter((browserPage) => {
            try {
              return new URL(browserPage.url()).hostname.replace(/^www\./, '') === targetUrl;
            } catch (e) {
              return false;
            }
          });
          if (matchingPages.length === 0) {
            return { status: 'FAILED', result: `No open Jarvis browser tab found for ${targetUrl}.` };
          }
          for (const browserPage of matchingPages) {
            await browserPage.close();
          }
          return { status: 'SUCCESS', result: `Closed ${matchingPages.length} tab(s) for ${targetUrl}` };
        }
          
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
        const rawApp = (action.target || action.value || 'notepad').trim();
        const appMap = {
          'calculator': 'calc',
          'calc': 'calc',
          'notepad': 'notepad',
          'paint': 'mspaint',
          'mspaint': 'mspaint',
          'chrome': 'chrome',
          'google': 'https://www.google.com',
          'google chrome': 'chrome',
          'youtube': 'https://www.youtube.com',
          'edge': 'msedge',
          'word': 'winword',
          'excel': 'excel',
          'powerpoint': 'powerpnt',
          'explorer': 'explorer',
          'file explorer': 'explorer',
          'control': 'control',
          'control panel': 'control',
          'camera': 'microsoft.windows.camera:',
          'settings': 'ms-settings:',
          'taskmgr': 'taskmgr',
          'task manager': 'taskmgr',
          'weather': 'bingweather:',
          'photos': 'ms-photos:'
        };
        const resolvedApp = appMap[rawApp.toLowerCase()] || rawApp;
        
        let fileArg = '';
        if (action.value && action.value !== action.target && action.value !== rawApp) {
          fileArg = `"${resolveFilePath(action.value)}"`;
        }
        
        log(`Jarvis OS: Launching application: ${resolvedApp} ${fileArg}...`);
        return new Promise((resolve) => {
          let psCmd = '';
          if (resolvedApp.startsWith('http://') || resolvedApp.startsWith('https://')) {
            psCmd = `powershell -WindowStyle Hidden -Command "Start-Process '${resolvedApp}'"`;
          } else if (resolvedApp === 'notepad') {
            // Do not kill/reset a running Notepad instance: that made valid requests appear successful while no window opened.
            psCmd = `powershell -WindowStyle Hidden -Command "Start-Process 'notepad.exe' -ErrorAction Stop"`;
          } else if (fileArg) {
            const rawFile = fileArg.replace(/^"|"$/g, '').replace(/'/g, "''");
            psCmd = `powershell -WindowStyle Hidden -Command "Start-Process '${resolvedApp}' -ArgumentList '${rawFile}'"`;
          } else {
            psCmd = `powershell -WindowStyle Hidden -Command "Start-Process '${resolvedApp}'"`;
          }
          exec(psCmd, (err) => {
            if (err) {
              log(`Jarvis Error launching ${resolvedApp}: ${err.message}`);
              resolve({ status: 'FAILED', result: err.message });
              return;
            }
            log(`Jarvis OS: Successfully launched application: ${resolvedApp}`);
            resolve({ status: 'SUCCESS', result: `Successfully launched ${resolvedApp}` });
          });
        });
      }

      case 'open_url': {
        const url = (action.target || action.value || '').trim();
        const safeUrl = url.startsWith('http') ? url : `https://${url}`;
        log(`Jarvis OS: Opening URL in default browser: ${safeUrl}...`);
        return new Promise((resolve) => {
          exec(`cmd.exe /c start "" "${safeUrl}"`, (err) => {
            if (err) {
              log(`Jarvis Error opening URL: ${err.message}`);
              resolve({ status: 'FAILED', result: err.message });
            } else {
              log(`Jarvis OS: Successfully opened URL: ${safeUrl}`);
              resolve({ status: 'SUCCESS', result: `Opened ${safeUrl}` });
            }
          });
        });
      }

      case 'close_app': {
        const target = (action.target || action.value || '').toLowerCase().trim();
        log(`Jarvis OS: Closing application: ${target}...`);
        const processMap = {
          'calculator': ['CalculatorApp', 'calc', 'calculator'],
          'calc': ['CalculatorApp', 'calc', 'calculator'],
          'notepad': ['notepad'],
          'paint': ['mspaint'],
          'mspaint': ['mspaint'],
          'chrome': ['chrome'],
          'browser': ['chrome', 'msedge'],
          'edge': ['msedge'],
          'camera': ['WindowsCamera'],
          'task manager': ['Taskmgr'],
          'taskmgr': ['Taskmgr'],
          'control': ['control'],
          'control panel': ['control'],
          'photos': ['Microsoft.Photos']
        };
        const targetsToKill = processMap[target] || [target];
        const cmdKill = targetsToKill.map(t => `/IM ${t}.exe`).join(' ');
        
        return new Promise((resolve) => {
          exec(`taskkill /F ${cmdKill} 2>nul`, () => {
            const pList = targetsToKill.map(t => `'${t}'`).join(',');
            const psCmd = `powershell -Command "Get-Process -ErrorAction SilentlyContinue | Where-Object { (${pList}) -contains \$_.ProcessName } | Stop-Process -Force -ErrorAction SilentlyContinue"`;
            exec(psCmd, () => {
              log(`Jarvis OS: Application close command finished for ${target}`);
              resolve({ status: 'SUCCESS', result: `Closed application: ${target}` });
            });
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
        log(`Jarvis OS: File created successfully on disk: ${filePath}`);
        return { status: 'SUCCESS', result: `Successfully wrote file: ${filePath}` };
      }

      case 'send_team_message': {
        const text = String(action.value || '').trim();
        const organizationId = taskContext.organizationId;
        // The worker obtains the sender from the claimed task, rather than
        // trusting a value embedded in an action plan.
        const fromId = taskContext.userId || action.actorId;
        const fromName = String(action.actorName || 'Admin').trim().slice(0, 120);
        if (!organizationId || !fromId || !text || text.length > 1500) {
          return { status: 'FAILED', result: 'Invalid Team Chat message details.' };
        }
        const messageId = `msg-jarvis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const { error } = await supabase.from('group_messages').insert({
          id: messageId,
          organization_id: organizationId,
          from_id: fromId,
          from_name: fromName,
          text,
          msg_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'chat',
          audio_url: null,
          attachment_url: null,
        });
        if (error) {
          log(`Jarvis Team Chat send error: ${error.message}`);
          return { status: 'FAILED', result: error.message };
        }
        log(`Jarvis Team Chat: Sent group message as ${fromName}.`);
        return { status: 'SUCCESS', result: 'Sent message to Team General' };
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
              if (cmd.toLowerCase().includes('taskkill') && ((stderr || '').includes('not found') || (err.message || '').includes('not found'))) {
                log(`Jarvis OS: Process was already closed or not found.`);
                resolve({ status: 'SUCCESS', result: `Process was not running or already closed.` });
                return;
              }
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
  if (activeTaskIds.has(taskId)) {
    log(`Skipping duplicate Jarvis task delivery: ${taskId}`);
    return;
  }
  activeTaskIds.add(taskId);

  log(`\n================================`);
  log(`Jarvis received task: ${taskId}`);

  // Claim the task before executing it. This prevents a daemon restart or a repeated
  // realtime event from launching the same application more than once.
  const { data: claimedTask, error: claimError } = await supabase
    .from('engine_tasks')
    .update({ status: 'RUNNING', started_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('status', 'EXECUTING')
    .select('id, organization_id, created_by')
    .maybeSingle();
  if (claimError || !claimedTask) {
    log(`Task ${taskId} was already claimed or could not be claimed.`);
    activeTaskIds.delete(taskId);
    return;
  }
  
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
    activeTaskIds.delete(taskId);
    return;
  }

  const actions = planRecord.actions;
  log(`Executing ${actions.length} actions...`);
  
  const results = [];
  let failed = false;

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const res = await executeAction(action, {
      organizationId: claimedTask.organization_id,
      userId: claimedTask.created_by,
    });
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
  } else {
    log("Task Completed Successfully!");
    const resultStr = "Jarvis Execution Completed:\n" + results.map(r => `- ${r.action.type}: ${r.result.result}`).join('\n');
    await supabase.from('engine_action_plans').update({ status: 'COMPLETED' }).eq('id', planRecord.id);
    
    // NOTE: Keep the browser OPEN so user can see it! 
    // Do NOT call browser.close() here!

    log("Updating task to COMPLETED...");
    await supabase.from('engine_tasks').update({ status: 'COMPLETED', result: resultStr, completed_at: new Date().toISOString() }).eq('id', taskId);
    await supabase.from('engine_execution_logs').insert({
      task_id: taskId, agent_id: agentId, organization_id: orgId, event: 'jarvis_completed', message: 'Jarvis finished execution.'
    });
  }

  activeTaskIds.delete(taskId);
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
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      log("Connected to AuraSuite Cloud successfully! Ready.");
      try {
        const { data: pendingTasks } = await supabase
          .from('engine_tasks')
          .select('id, organization_id, assigned_agent_id')
          .eq('status', 'EXECUTING')
          .order('created_at', { ascending: true });
        if (pendingTasks && pendingTasks.length > 0) {
          log(`Found ${pendingTasks.length} pending EXECUTING task(s). Executing now...`);
          for (const t of pendingTasks) {
            await processTask(t.id, t.organization_id, t.assigned_agent_id);
          }
        }
      } catch (err) {
        log(`Error fetching pending tasks: ${err.message}`);
      }
    }
  });

// Realtime can briefly disconnect without the Node process exiting. Polling is the
// recovery path, so an instruction is never stranded waiting for a missed event.
async function collectPendingTasks() {
  try {
    // A PC restart can interrupt a task after it has been claimed. Return only
    // stale claims to the queue; recently claimed tasks are left untouched.
    const staleBefore = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { error: recoveryError } = await supabase
      .from('engine_tasks')
      .update({ status: 'EXECUTING' })
      .eq('status', 'RUNNING')
      .lt('started_at', staleBefore);
    if (recoveryError) throw recoveryError;

    const { data: pendingTasks, error } = await supabase
      .from('engine_tasks')
      .select('id, organization_id, assigned_agent_id')
      .eq('status', 'EXECUTING')
      .order('created_at', { ascending: true });
    if (error) throw error;
    for (const task of pendingTasks || []) {
      processTask(task.id, task.organization_id, task.assigned_agent_id);
    }
  } catch (err) {
    log(`Jarvis task polling error: ${err.message}`);
  }
}

setInterval(collectPendingTasks, 5000);
