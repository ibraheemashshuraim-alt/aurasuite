/**
 * Phase 3A: Action Safety Validation and Permissions
 */

const ALLOWED_ACTION_TYPES = [
  'open_url', 'click', 'type', 'press_key', 
  'scroll', 'wait', 'screenshot', 'read_screen', 
  'browser_navigation'
];

const PERMISSIONS = {
  READ_ONLY: ['open_url', 'screenshot', 'read_screen', 'scroll', 'wait'],
  SAFE_ACTIONS: [...ALLOWED_ACTION_TYPES]
};

// Max actions per plan to prevent infinite loops / runaway plans
const MAX_ACTIONS = 15; 

export function validateActionPlan(planJSON, permissionLevel = 'SAFE_ACTIONS') {
  let plan;
  try {
    plan = typeof planJSON === 'string' ? JSON.parse(planJSON) : planJSON;
  } catch (e) {
    return { valid: false, reason: 'Malformed JSON action plan', status: 'BLOCKED' };
  }

  if (!plan || !Array.isArray(plan.actions)) {
    return { valid: false, reason: 'Missing "actions" array in plan', status: 'BLOCKED' };
  }

  const actions = plan.actions;

  if (actions.length > MAX_ACTIONS) {
    return { valid: false, reason: `Exceeded max actions limit of ${MAX_ACTIONS}`, status: 'BLOCKED' };
  }

  const allowedForRole = PERMISSIONS[permissionLevel] || PERMISSIONS['READ_ONLY'];

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    
    // 1. Reject unknown types
    if (!action.type || !ALLOWED_ACTION_TYPES.includes(action.type)) {
      return { valid: false, reason: `Unknown or forbidden action type: ${action.type || 'undefined'}`, status: 'BLOCKED' };
    }

    // 2. Reject shell/code execution explicitly (extra safety net)
    if (['shell', 'execute', 'bash', 'powershell', 'cmd'].includes(action.type)) {
      return { valid: false, reason: 'Arbitrary command execution is strictly forbidden', status: 'BLOCKED' };
    }

    // 3. Permission check
    // FOR PHASE 5 JARVIS: All actions now require explicit user approval before sending to the local daemon!
    return { valid: false, reason: `Action '${action.type}' requires user approval before dispatching to Jarvis daemon`, status: 'APPROVAL_REQUIRED' };

    // 4. Required targets
    if (action.type === 'open_url' && (!action.target || !action.target.startsWith('http'))) {
      return { valid: false, reason: `Action 'open_url' requires a valid http/https target url`, status: 'BLOCKED' };
    }
  }

  return { valid: true, plan, status: 'VALID' };
}
