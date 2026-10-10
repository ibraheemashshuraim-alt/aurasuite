require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

let browser = null;
let page = null;

async function executeAction(action) {
  if (!browser) {
    console.log("Launching visible browser (Jarvis Mode)...");
    browser = await puppeteer.launch({
      headless: false, // VISIBLE!
      defaultViewport: null,
      args: ['--start-maximized']
    });
    page = await browser.newPage();
  }

  try {
    switch (action.type) {
      case 'open_url':
      case 'browser_navigation':
        console.log(`Jarvis: Navigating to ${action.target}...`);
        await page.goto(action.target, { waitUntil: 'networkidle2' });
        return { status: 'SUCCESS', result: `Navigated to ${page.url()}` };
        
      case 'click': {
        console.log(`Jarvis: Clicking on ${action.target}...`);
        let t = action.target; if (t === "input[name='q']") t = "textarea[name='q']"; await page.waitForSelector(t, { visible: true });
        await page.click(t);
        return { status: 'SUCCESS', result: `Clicked element: ${action.target}` }; }
        
      case 'type': {
        console.log(`Jarvis: Typing "${action.value}" into ${action.target}...`);
        let t = action.target; if (t === "input[name='q']") t = "textarea[name='q']"; await page.waitForSelector(t, { visible: true });
        await page.type(t, action.value, { delay: 100 });
        return { status: 'SUCCESS', result: `Typed into element: ${action.target}` }; }
        
      case 'press_key':
        console.log(`Jarvis: Pressing key ${action.value}...`);
        await page.keyboard.press(action.value);
        return { status: 'SUCCESS', result: `Pressed key: ${action.value}` };
        
      case 'wait':
        const ms = parseInt(action.value) || 2000;
        console.log(`Jarvis: Waiting for ${ms}ms...`);
        await new Promise(r => setTimeout(r, ms));
        return { status: 'SUCCESS', result: `Waited ${ms}ms` };
        
      case 'read_screen':
        console.log(`Jarvis: Reading screen...`);
        const text = await page.evaluate(() => document.body.innerText.substring(0, 5000));
        return { status: 'SUCCESS', result: text };
        
      default:
        console.log(`Jarvis: Ignored unsupported action: ${action.type}`);
        return { status: 'UNSUPPORTED', result: `Action type ${action.type} unsupported` };
    }
  } catch (err) {
    console.error(`Jarvis Error on action ${action.type}:`, err.message);
    return { status: 'FAILED', result: err.message };
  }
}

async function processTask(taskId, orgId, agentId) {
  console.log(`\n================================`);
  console.log(`Jarvis received task: ${taskId}`);
  
  // 1. Fetch action plan
  const { data: planRecords, error: planErr } = await supabase
    .from('engine_action_plans')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (planErr) console.error("Jarvis DB Error:", planErr);

  const planRecord = planRecords && planRecords.length > 0 ? planRecords[0] : null;

  if (!planRecord || !planRecord.actions) {
    console.log("No action plan found for task.", planErr);
    return;
  }

  const actions = planRecord.actions;
  console.log(`Executing ${actions.length} actions...`);
  
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
    console.log("Task Failed.");
    await supabase.from('engine_tasks').update({ status: 'FAILED', error: 'Jarvis encountered an error.' }).eq('id', taskId);
    await supabase.from('engine_action_plans').update({ status: 'FAILED' }).eq('id', planRecord.id);
    
    // RESET BROWSER IN CASE USER CLOSED IT OR IT CRASHED
    if (browser) {
      try { await browser.close(); } catch(e) {}
      browser = null;
      page = null;
    }
  } else {
    console.log("Task Completed Successfully!");
    const resultStr = "Jarvis Execution Completed:\n" + results.map(r => `- ${r.action.type}: ${r.result.result}`).join('\n');
    await supabase.from('engine_action_plans').update({ status: 'COMPLETED' }).eq('id', planRecord.id);
    
    console.log("Updating task to VERIFYING..."); if (browser) { try { await browser.close(); } catch(e){} browser = null; page = null; }
    await supabase.from('engine_tasks').update({ status: 'VERIFYING', result: resultStr }).eq('id', taskId);
    
    // Simulate verification delay then COMPLETE
    setTimeout(async () => {
      console.log("Updating task to COMPLETED...");
      await supabase.from('engine_tasks').update({ status: 'COMPLETED' }).eq('id', taskId);
      await supabase.from('engine_execution_logs').insert({
        task_id: taskId, agent_id: agentId, organization_id: orgId, event: 'jarvis_completed', message: 'Jarvis finished execution.'
      });
    }, 2000);
  }
}

// Subscribe to Supabase Realtime
console.log("Starting Jarvis Local Daemon...");
console.log("Listening for EXECUTING tasks on Supabase Realtime...");

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
      console.log("Connected to AuraSuite Cloud successfully! Ready.");
    }
  });
