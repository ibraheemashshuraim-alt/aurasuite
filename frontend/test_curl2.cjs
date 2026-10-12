async function run() {
  const url = 'https://aurasuite-kappa.vercel.app/api/engine/action-plan/approve';
  
  const body = {
    taskId: 'task-00036dbd-e5d9-4097-acd5-fa5f2baa9b2a',
    orgId: 'org-aurasuite-superadmin',
    agentId: 'agent-48bfe44c-b550-4d7c-91ae-c189633be7db',
    decision: 'APPROVE',
    planText: '{"actions":[]}'
  };
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
